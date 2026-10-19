<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankConnection;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\Wallet;
use App\Support\ApiTransformer;
use App\Support\PaymentVerification;
use App\Support\Webauthn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $primaryBankIds = BankConnection::primaryIdsForUser($request->user()->id);

        $items = Transaction::query()
            ->with(['user', 'wallet'])
            ->where('user_id', $request->user()->id)
            ->where('user_deleted', false)
            ->where(function ($query) use ($primaryBankIds): void {
                $query
                    ->where('source', '!=', 'bank_sync')
                    ->orWhereNull('source')
                    ->orWhere(function ($inner) use ($primaryBankIds): void {
                        if (! empty($primaryBankIds)) {
                            $inner->where('source', 'bank_sync')->whereIn('bank_connection_id', $primaryBankIds);
                            return;
                        }

                        $inner->whereRaw('1 = 0');
                    });
            })
            ->latest('date')
            ->get()
            ->map(fn (Transaction $transaction): array => ApiTransformer::transaction($transaction));

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $this->abortIfBusinessUser($request);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'type' => ['required', 'in:income,expense'],
            'transactionType' => ['nullable', 'in:cash,bank,credit,debit,transfer,scan_pay'],
            'isRecurring' => ['nullable', 'boolean'],
            'recurrence' => ['nullable', 'in:none,daily,weekly,monthly,yearly'],
            'date' => ['nullable', 'date'],
            'wallet' => ['nullable', 'integer'],
            'walletId' => ['nullable', 'integer'],
            'verificationToken' => ['nullable', 'string'],
        ]);

        $this->requirePaymentVerification($request, $data['verificationToken'] ?? null);

        $category = Category::firstOrCreate(
            ['name' => $data['category'] ?? 'General', 'type' => $data['type']],
            ['color' => '#4B5563', 'icon' => 'tag']
        );

        $walletId = $data['walletId'] ?? $data['wallet'] ?? null;
        $wallet = $walletId ? Wallet::where('user_id', $request->user()->id)->find($walletId) : null;
        $recurrence = ($data['recurrence'] ?? null) === 'none' ? null : ($data['recurrence'] ?? null);
        $isRecurring = $data['isRecurring'] ?? ($recurrence !== null);

        $transaction = DB::transaction(function () use ($request, $data, $category, $wallet, $isRecurring, $recurrence): Transaction {
            $created = Transaction::create([
                'user_id' => $request->user()->id,
                'category_id' => $category->id,
                'wallet_id' => $wallet?->id,
                'title' => $data['title'],
                'category' => $data['category'] ?? 'General',
                'description' => $data['description'] ?? null,
                'amount' => $data['amount'],
                'type' => $data['type'],
                'transaction_type' => $data['transactionType'] ?? 'cash',
                'is_recurring' => (bool) $isRecurring,
                'recurrence' => $recurrence,
                'date' => $data['date'] ?? now()->toDateString(),
                'timestamp' => now(),
                'user_deleted' => false,
            ]);

            if ($wallet) {
                $this->applyWalletDelta($wallet, $created->type, (float) $created->amount);
            }

            return $created;
        });

        $transaction->load(['user', 'wallet']);

        return response()->json(ApiTransformer::transaction($transaction), 201);
    }

    public function update(Request $request, Transaction $transaction): JsonResponse
    {
        $this->abortIfBusinessUser($request);
        $this->assertOwnership($request, $transaction);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'amount' => ['sometimes', 'numeric', 'min:0.01'],
            'type' => ['sometimes', 'in:income,expense'],
            'transactionType' => ['nullable', 'in:cash,bank,credit,debit,transfer,scan_pay'],
            'isRecurring' => ['nullable', 'boolean'],
            'recurrence' => ['nullable', 'in:none,daily,weekly,monthly,yearly'],
            'date' => ['nullable', 'date'],
            'wallet' => ['nullable', 'integer'],
            'walletId' => ['nullable', 'integer'],
        ]);

        $transaction = DB::transaction(function () use ($request, $data, $transaction): Transaction {
            if ($transaction->wallet) {
                $this->applyWalletDelta($transaction->wallet, $transaction->type === 'income' ? 'expense' : 'income', (float) $transaction->amount);
            }

            $walletId = $data['walletId'] ?? $data['wallet'] ?? $transaction->wallet_id;
            $wallet = $walletId ? Wallet::where('user_id', $request->user()->id)->find($walletId) : null;

            if (isset($data['category']) && $data['category']) {
                $category = Category::firstOrCreate(
                    ['name' => $data['category'], 'type' => $data['type'] ?? $transaction->type],
                    ['color' => '#4B5563', 'icon' => 'tag']
                );
                $transaction->category_id = $category->id;
            }

            $recurrence = array_key_exists('recurrence', $data)
                ? (($data['recurrence'] === 'none') ? null : $data['recurrence'])
                : $transaction->recurrence;
            $isRecurring = array_key_exists('isRecurring', $data)
                ? (bool) $data['isRecurring']
                : ($recurrence !== null);

            $transaction->fill([
                'wallet_id' => $wallet?->id,
                'title' => $data['title'] ?? $transaction->title,
                'category' => $data['category'] ?? $transaction->category,
                'description' => $data['description'] ?? $transaction->description,
                'amount' => $data['amount'] ?? $transaction->amount,
                'type' => $data['type'] ?? $transaction->type,
                'transaction_type' => $data['transactionType'] ?? $transaction->transaction_type,
                'is_recurring' => $isRecurring,
                'recurrence' => $recurrence,
                'date' => $data['date'] ?? $transaction->date,
            ]);
            $transaction->save();

            if ($wallet) {
                $this->applyWalletDelta($wallet, $transaction->type, (float) $transaction->amount);
            }

            return $transaction;
        });

        $transaction->load(['user', 'wallet']);

        return response()->json(ApiTransformer::transaction($transaction));
    }

    public function destroy(Request $request, Transaction $transaction): JsonResponse
    {
        $this->abortIfBusinessUser($request);
        $this->assertOwnership($request, $transaction);

        DB::transaction(function () use ($transaction): void {
            if ($transaction->wallet) {
                $this->applyWalletDelta($transaction->wallet, $transaction->type === 'income' ? 'expense' : 'income', (float) $transaction->amount);
            }

            $transaction->forceFill([
                'user_deleted' => true,
                'user_deleted_at' => now(),
            ])->save();
        });

        return response()->json(['message' => 'Transaction deleted']);
    }

    private function assertOwnership(Request $request, Transaction $transaction): void
    {
        abort_unless((string) $transaction->user_id === (string) $request->user()->id, 404);
    }

    private function applyWalletDelta(Wallet $wallet, string $type, float $amount): void
    {
        $wallet->balance = $type === 'income'
            ? ((float) $wallet->balance + $amount)
            : ((float) $wallet->balance - $amount);

        $wallet->save();
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

    private function abortIfBusinessUser(Request $request): void
    {
        if ($request->user()?->isAdmin()) {
            return;
        }

        if (($request->user()?->role ?? null) === 'business_user') {
            abort(response()->json([
                'message' => 'Business accounts are read-only in Transactions. Sync your bank accounts to import transactions automatically.',
            ], 403));
        }
    }
}
