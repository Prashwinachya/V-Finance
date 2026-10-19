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
        $user = $request->user();

        if ($user->isAdmin()) {
            $wallets = Wallet::query()
                ->where('user_id', $user->id)
                ->whereIn('wallet_type', Wallet::ALLOWED_BUSINESS_TYPES)
                ->oldest('id')
                ->get()
                ->map(fn (Wallet $wallet): array => ApiTransformer::wallet($wallet, $this->walletMetrics($wallet)));

            return response()->json($wallets);
        }

        if ($this->isStudent($request)) {
            $this->migrateStudentLegacyWalletIfNeeded((string) $user->id);

            $wallets = Wallet::query()
                ->where('user_id', $user->id)
                ->where('wallet_type', Wallet::TYPE_POCKET_SAVER)
                ->oldest('id')
                ->limit(1)
                ->get()
                ->map(fn (Wallet $wallet): array => ApiTransformer::wallet($wallet, $this->walletMetrics($wallet)));

            return response()->json($wallets);
        }

        $wallets = Wallet::query()
            ->where('user_id', $user->id)
            ->whereIn('wallet_type', Wallet::ALLOWED_BUSINESS_TYPES)
            ->oldest('id')
            ->get()
            ->map(fn (Wallet $wallet): array => ApiTransformer::wallet($wallet, $this->walletMetrics($wallet)));

        return response()->json($wallets);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:120'],
            'walletType' => ['required', 'string'],
            'balance' => ['nullable', 'numeric', 'min:0'],
        ]);

        $user = $request->user();

        try {
            return DB::transaction(function () use ($user, $data): JsonResponse {
                // Lock existing wallets for this user to prevent race conditions from concurrent clicks
                $existingWallets = Wallet::query()
                    ->where('user_id', $user->id)
                    ->lockForUpdate()
                    ->get();

                if ($user->isAdmin()) {
                    $normalizedType = $this->normalizeWalletType($data['walletType']);

                    if (! in_array($normalizedType, Wallet::ALLOWED_BUSINESS_TYPES, true)) {
                        return response()->json([
                            'message' => 'Invalid wallet type. Allowed types are Travel, Medical, and Pocket Saver.',
                        ], 422);
                    }

                    if ($existingWallets->count() >= Wallet::MAX_BUSINESS_WALLETS) {
                        return response()->json([
                            'message' => 'Business accounts can have a maximum of 3 wallets: Travel, Medical, and Pocket Saver.',
                        ], 422);
                    }

                    if ($existingWallets->contains('wallet_type', $normalizedType)) {
                        $label = $this->defaultWalletName($normalizedType);
                        return response()->json([
                            'message' => "You already have an active {$label}.",
                        ], 422);
                    }
                } elseif ($user->isStudent()) {
                    if ($data['walletType'] !== Wallet::TYPE_POCKET_SAVER) {
                        return response()->json([
                            'message' => 'Student accounts can only use Pocket Saver Wallet.',
                        ], 422);
                    }

                    $existingStudentWallet = $existingWallets->firstWhere('wallet_type', Wallet::TYPE_POCKET_SAVER);

                    if ($existingStudentWallet) {
                        return response()->json([
                            'message' => 'Student accounts can activate only one wallet.',
                        ], 422);
                    }

                    $this->migrateStudentLegacyWalletIfNeeded((string) $user->id);

                    $migratedWallet = Wallet::query()
                        ->where('user_id', $user->id)
                        ->where('wallet_type', Wallet::TYPE_POCKET_SAVER)
                        ->first();

                    if ($migratedWallet) {
                        return response()->json(ApiTransformer::wallet($migratedWallet, $this->walletMetrics($migratedWallet)), 201);
                    }

                    if ($existingWallets->count() >= Wallet::MAX_STUDENT_WALLETS) {
                        return response()->json([
                            'message' => 'Student accounts can activate only one wallet.',
                        ], 422);
                    }

                    $normalizedType = Wallet::TYPE_POCKET_SAVER;
                } else {
                    $normalizedType = $this->normalizeWalletType($data['walletType']);

                    if (! in_array($normalizedType, Wallet::ALLOWED_BUSINESS_TYPES, true)) {
                        return response()->json([
                            'message' => 'Invalid wallet type. Allowed types are Travel, Medical, and Pocket Saver.',
                        ], 422);
                    }

                    if ($existingWallets->count() >= Wallet::MAX_BUSINESS_WALLETS) {
                        return response()->json([
                            'message' => 'Business accounts can have a maximum of 3 wallets: Travel, Medical, and Pocket Saver.',
                        ], 422);
                    }

                    if ($existingWallets->contains('wallet_type', $normalizedType)) {
                        $label = $this->defaultWalletName($normalizedType);
                        return response()->json([
                            'message' => "You already have an active {$label}.",
                        ], 422);
                    }
                }

                $wallet = Wallet::create([
                    'user_id' => $user->id,
                    'name' => trim((string) ($data['name'] ?? '')) !== '' ? trim((string) $data['name']) : $this->defaultWalletName($normalizedType),
                    'wallet_type' => $normalizedType,
                    'balance' => $data['balance'] ?? 0,
                    'last_withdrawal_date' => $normalizedType === Wallet::TYPE_POCKET_SAVER ? now()->subDays(16) : null,
                ]);

                return response()->json(ApiTransformer::wallet($wallet, $this->walletMetrics($wallet)), 201);
            });
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            if (! $user->isAdmin() && $user->isStudent()) {
                return response()->json(['message' => 'Student accounts can activate only one wallet.'], 422);
            }
            $normalizedType = $this->normalizeWalletType($data['walletType']);
            $label = $this->defaultWalletName($normalizedType);
            return response()->json(['message' => "You already have an active {$label}."], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23505' || $e->getCode() === '23000' || str_contains($e->getMessage(), 'UNIQUE')) {
                if (! $user->isAdmin() && $user->isStudent()) {
                    return response()->json(['message' => 'Student accounts can activate only one wallet.'], 422);
                }
                $normalizedType = $this->normalizeWalletType($data['walletType']);
                $label = $this->defaultWalletName($normalizedType);
                return response()->json(['message' => "You already have an active {$label}."], 422);
            }
            throw $e;
        }
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
            'walletType' => ['sometimes', 'string'],
        ]);

        $user = $request->user();

        if (! $user->isAdmin() && $user->isStudent() && array_key_exists('walletType', $data) && $data['walletType'] !== Wallet::TYPE_POCKET_SAVER) {
            return response()->json(['message' => 'Student accounts can only use Pocket Saver Wallet.'], 422);
        }

        $normalizedType = array_key_exists('walletType', $data)
            ? (($user->isAdmin() || ! $user->isStudent()) ? $this->normalizeWalletType($data['walletType']) : Wallet::TYPE_POCKET_SAVER)
            : $wallet->wallet_type;

        $allowedTypes = ($user->isAdmin() || ! $user->isStudent()) ? Wallet::ALLOWED_BUSINESS_TYPES : Wallet::ALLOWED_STUDENT_TYPES;
        if (! in_array($normalizedType, $allowedTypes, true)) {
            return response()->json(['message' => 'Invalid wallet type. Allowed types are Travel, Medical, and Pocket Saver.'], 422);
        }

        if ($normalizedType !== $wallet->wallet_type) {
            $duplicate = Wallet::where('user_id', $user->id)
                ->where('wallet_type', $normalizedType)
                ->where('id', '!=', $wallet->id)
                ->exists();

            if ($duplicate) {
                $label = $this->defaultWalletName($normalizedType);
                return response()->json(['message' => "You already have an active {$label}."], 422);
            }
        }

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
            'default_wallet', 'cash_wallet', 'personal_wallet', 'travelling_wallet' => Wallet::TYPE_TRAVELLING,
            'medical_emergency_wallet' => Wallet::TYPE_MEDICAL_EMERGENCY,
            'pocket_saver_wallet' => Wallet::TYPE_POCKET_SAVER,
            default => $walletType,
        };
    }

    private function defaultWalletName(string $walletType): string
    {
        return match ($walletType) {
            Wallet::TYPE_MEDICAL_EMERGENCY => 'Medical Emergency Wallet',
            Wallet::TYPE_POCKET_SAVER => 'Pocket Saver Wallet',
            default => 'Travelling Wallet',
        };
    }

    private function isStudent(Request $request): bool
    {
        if ($request->user()?->isAdmin()) {
            return false;
        }

        return $request->user()?->isStudent() ?? true;
    }

    private function assertStudentWalletAccess(Request $request, Wallet $wallet): void
    {
        if ($request->user()?->isAdmin()) {
            return;
        }

        if (! $this->isStudent($request)) {
            return;
        }

        $primaryWalletId = Wallet::query()
            ->where('user_id', $request->user()->id)
            ->where('wallet_type', Wallet::TYPE_POCKET_SAVER)
            ->oldest('id')
            ->value('id');

        if ($wallet->wallet_type !== Wallet::TYPE_POCKET_SAVER || ! $primaryWalletId || (string) $wallet->id !== (string) $primaryWalletId) {
            abort(response()->json([
                'message' => 'Student accounts can access only Pocket Saver Wallet.',
            ], 403));
        }
    }

    private function migrateStudentLegacyWalletIfNeeded(string $userId): void
    {
        $hasPocketSaverWallet = Wallet::query()
            ->where('user_id', $userId)
            ->where('wallet_type', Wallet::TYPE_POCKET_SAVER)
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
            'wallet_type' => Wallet::TYPE_POCKET_SAVER,
            'name' => trim((string) $legacyWallet->name) !== '' ? $legacyWallet->name : 'Pocket Saver Wallet',
        ]);

        if (! $legacyWallet->last_withdrawal_date) {
            $legacyWallet->last_withdrawal_date = now()->subDays(16);
        }

        $legacyWallet->save();
    }
}
