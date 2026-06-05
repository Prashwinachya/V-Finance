<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\Wallet;
use App\Support\ApiTransformer;
use App\Support\PaymentVerification;
use App\Support\Webauthn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if ($this->isStudent($request)) {
            $this->migrateStudentLegacyWalletIfNeeded((string) $request->user()->id);

            $wallets = Wallet::query()
                ->where('user_id', $request->user()->id)
                ->where('wallet_type', 'pocket_saver_wallet')
                ->oldest('id')
                ->limit(1)
                ->get()
                ->map(fn (Wallet $wallet): array => ApiTransformer::wallet($wallet, $this->walletMetrics($wallet)));

            return response()->json($wallets);
        }

        $walletsQuery = Wallet::query()
            ->where('user_id', $request->user()->id)
            ->latest();

        $wallets = $walletsQuery
            ->get()
            ->map(fn (Wallet $wallet): array => ApiTransformer::wallet($wallet, $this->walletMetrics($wallet)));

        return response()->json($wallets);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:120'],
            'walletType' => ['required', 'in:default_wallet,cash_wallet,personal_wallet,travelling_wallet,medical_emergency_wallet,pocket_saver_wallet'],
            'balance' => ['nullable', 'numeric', 'min:0'],
        ]);

        if ($this->isStudent($request) && $data['walletType'] !== 'pocket_saver_wallet') {
            return response()->json(['message' => 'Student accounts can only use Pocket Saver Wallet.'], 422);
        }

        $normalizedType = $this->isStudent($request)
            ? 'pocket_saver_wallet'
            : $this->normalizeWalletType($data['walletType']);

        if ($this->isStudent($request)) {
            $existingStudentWallet = Wallet::query()
                ->where('user_id', $request->user()->id)
                ->where('wallet_type', 'pocket_saver_wallet')
                ->first();

            if ($existingStudentWallet) {
                return response()->json(['message' => 'Student accounts can activate only one wallet.'], 422);
            }

            $this->migrateStudentLegacyWalletIfNeeded((string) $request->user()->id);

            $migratedWallet = Wallet::query()
                ->where('user_id', $request->user()->id)
                ->where('wallet_type', 'pocket_saver_wallet')
                ->first();

            if ($migratedWallet) {
                return response()->json(ApiTransformer::wallet($migratedWallet, $this->walletMetrics($migratedWallet)), 201);
            }
        }

        $walletCount = Wallet::query()->where('user_id', $request->user()->id)->count();
        if ($walletCount >= Wallet::MAX_WALLETS) {
            return response()->json(['message' => 'Maximum '.Wallet::MAX_WALLETS.' wallets allowed per user.'], 422);
        }

        $wallet = Wallet::create([
            'user_id' => $request->user()->id,
            'name' => trim((string) ($data['name'] ?? '')) !== '' ? trim((string) $data['name']) : $this->defaultWalletName($normalizedType),
            'wallet_type' => $normalizedType,
            'balance' => $data['balance'] ?? 0,
        ]);

        return response()->json(ApiTransformer::wallet($wallet, $this->walletMetrics($wallet)), 201);
    }

    public function show(Request $request, Wallet $wallet): JsonResponse
    {
        $this->assertOwnership($request, $wallet);
        $this->assertStudentWalletAccess($request, $wallet);

        $transactions = $wallet->transactions()
            ->where('user_deleted', false)
            ->latest('date')
            ->get()
            ->map(fn (Transaction $transaction): array => ApiTransformer::transaction($transaction))
            ->values();

        return response()->json([
            'wallet' => ApiTransformer::wallet($wallet, $this->walletMetrics($wallet)),
            'transactions' => $transactions,
        ]);
    }

    public function update(Request $request, Wallet $wallet): JsonResponse
    {
        $this->assertOwnership($request, $wallet);
        $this->assertStudentWalletAccess($request, $wallet);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'walletType' => ['sometimes', 'in:default_wallet,cash_wallet,personal_wallet,travelling_wallet,medical_emergency_wallet,pocket_saver_wallet'],
        ]);

        if ($this->isStudent($request) && array_key_exists('walletType', $data) && $data['walletType'] !== 'pocket_saver_wallet') {
            return response()->json(['message' => 'Student accounts can only use Pocket Saver Wallet.'], 422);
        }

        $normalizedType = array_key_exists('walletType', $data)
            ? ($this->isStudent($request) ? 'pocket_saver_wallet' : $this->normalizeWalletType($data['walletType']))
            : $wallet->wallet_type;

        $wallet->fill([
            'name' => $data['name'] ?? $wallet->name,
            'wallet_type' => $normalizedType,
        ])->save();

        return response()->json(ApiTransformer::wallet($wallet, $this->walletMetrics($wallet)));
    }

    public function addMoney(Request $request, Wallet $wallet): JsonResponse
    {
        $this->assertOwnership($request, $wallet);
        $this->assertStudentWalletAccess($request, $wallet);

        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string'],
            'verificationToken' => ['nullable', 'string'],
        ]);

        $this->requirePaymentVerification($request, $data['verificationToken'] ?? null);

        DB::transaction(function () use ($request, $wallet, $data): void {
            $wallet->balance = (float) $wallet->balance + (float) $data['amount'];
            $wallet->save();

            $category = Category::firstOrCreate(
                ['name' => 'Wallet', 'type' => 'income'],
                ['color' => '#10B981', 'icon' => 'wallet']
            );

            Transaction::create([
                'user_id' => $request->user()->id,
                'category_id' => $category->id,
                'wallet_id' => $wallet->id,
                'title' => 'Wallet top up',
                'category' => 'Wallet',
                'description' => $data['description'] ?? null,
                'amount' => $data['amount'],
                'type' => 'income',
                'transaction_type' => 'transfer',
                'is_recurring' => false,
                'date' => now()->toDateString(),
                'timestamp' => now(),
                'user_deleted' => false,
            ]);
        });

        return response()->json(ApiTransformer::wallet($wallet, $this->walletMetrics($wallet)));
    }

    public function withdrawMoney(Request $request, Wallet $wallet): JsonResponse
    {
        $this->assertOwnership($request, $wallet);
        $this->assertStudentWalletAccess($request, $wallet);

        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string'],
            'verificationToken' => ['nullable', 'string'],
        ]);

        $this->requirePaymentVerification($request, $data['verificationToken'] ?? null);

        if ($wallet->wallet_type === 'pocket_saver_wallet' && $wallet->last_withdrawal_date) {
            $days = $wallet->last_withdrawal_date->diffInDays(now());
            if ($days < 14) {
                return response()->json(['message' => 'Pocket saver withdrawals are allowed every 14 days'], 422);
            }
        }

        if ((float) $wallet->balance < (float) $data['amount']) {
            return response()->json(['message' => 'Insufficient wallet balance'], 422);
        }

        DB::transaction(function () use ($request, $wallet, $data): void {
            $wallet->balance = (float) $wallet->balance - (float) $data['amount'];
            if ($wallet->wallet_type === 'pocket_saver_wallet') {
                $wallet->last_withdrawal_date = now();
            }
            $wallet->save();

            $category = Category::firstOrCreate(
                ['name' => 'Wallet', 'type' => 'expense'],
                ['color' => '#EF4444', 'icon' => 'wallet']
            );

            Transaction::create([
                'user_id' => $request->user()->id,
                'category_id' => $category->id,
                'wallet_id' => $wallet->id,
                'title' => 'Wallet withdrawal',
                'category' => 'Wallet',
                'description' => $data['description'] ?? null,
                'amount' => $data['amount'],
                'type' => 'expense',
                'transaction_type' => 'transfer',
                'is_recurring' => false,
                'date' => now()->toDateString(),
                'timestamp' => now(),
                'user_deleted' => false,
            ]);
        });

        return response()->json(ApiTransformer::wallet($wallet, $this->walletMetrics($wallet)));
    }

    private function walletMetrics(Wallet $wallet): array
    {
        $base = $wallet->transactions()->where('user_deleted', false);

        return [
            'totalCredits' => (float) (clone $base)->where('type', 'income')->sum('amount'),
            'totalDebits' => (float) (clone $base)->where('type', 'expense')->sum('amount'),
            'transactionsCount' => (int) (clone $base)->count(),
        ];
    }

    private function assertOwnership(Request $request, Wallet $wallet): void
    {
        abort_unless((string) $wallet->user_id === (string) $request->user()->id, 404);
    }

    private function requirePaymentVerification(Request $request, ?string $token): void
    {
        $user = $request->user();

        if (! $user->payment_pin_enabled || ! $user->payment_pin_hash) {
            abort(response()->json(['message' => 'Set your payment PIN before performing this action'], 403));
        }

        if (! $user->fingerprint_enabled || ! Webauthn::hasCredential($user)) {
            abort(response()->json(['message' => 'Enable fingerprint verification before performing this action'], 403));
        }

        $headerToken = $request->header('X-Payment-Verification-Token')
            ?: $request->header('x-payment-token');
        $payload = PaymentVerification::validateToken($token ?: $headerToken, $user);

        if (! $payload) {
            abort(response()->json(['message' => 'Payment verification required'], 403));
        }

        if (! ($payload['pinVerified'] ?? false)) {
            abort(response()->json(['message' => 'PIN verification required'], 403));
        }

        if (! ($payload['fingerprintVerified'] ?? false)) {
            abort(response()->json(['message' => 'Fingerprint verification required'], 403));
        }
    }

    private function normalizeWalletType(string $walletType): string
    {
        return match ($walletType) {
            'default_wallet', 'cash_wallet', 'personal_wallet', 'travelling_wallet' => 'travelling_wallet',
            'medical_emergency_wallet' => 'medical_emergency_wallet',
            'pocket_saver_wallet' => 'pocket_saver_wallet',
            default => 'travelling_wallet',
        };
    }

    private function defaultWalletName(string $walletType): string
    {
        return match ($walletType) {
            'medical_emergency_wallet' => 'Medical Emergency Wallet',
            'pocket_saver_wallet' => 'Pocket Saver Wallet',
            default => 'Travelling Wallet',
        };
    }

    private function isStudent(Request $request): bool
    {
        $role = (string) ($request->user()?->role ?? 'student');
        return in_array($role, ['student', 'user', 'super_admin_student'], true);
    }

    private function assertStudentWalletAccess(Request $request, Wallet $wallet): void
    {
        if (! $this->isStudent($request)) {
            return;
        }

        $primaryWalletId = Wallet::query()
            ->where('user_id', $request->user()->id)
            ->where('wallet_type', 'pocket_saver_wallet')
            ->oldest('id')
            ->value('id');

        if ($wallet->wallet_type !== 'pocket_saver_wallet' || ! $primaryWalletId || (string) $wallet->id !== (string) $primaryWalletId) {
            abort(response()->json([
                'message' => 'Student accounts can access only Pocket Saver Wallet.',
            ], 403));
        }
    }

    private function migrateStudentLegacyWalletIfNeeded(string $userId): void
    {
        $hasPocketSaverWallet = Wallet::query()
            ->where('user_id', $userId)
            ->where('wallet_type', 'pocket_saver_wallet')
            ->exists();

        if ($hasPocketSaverWallet) {
            return;
        }

        $legacyWallet = Wallet::query()
            ->where('user_id', $userId)
            ->oldest('id')
            ->first();

        if (! $legacyWallet) {
            return;
        }

        $legacyWallet->fill([
            'wallet_type' => 'pocket_saver_wallet',
            'name' => trim((string) $legacyWallet->name) !== '' ? $legacyWallet->name : 'Pocket Saver Wallet',
        ]);

        if (! $legacyWallet->last_withdrawal_date) {
            $legacyWallet->last_withdrawal_date = now()->subDays(16);
        }

        $legacyWallet->save();
    }
}
