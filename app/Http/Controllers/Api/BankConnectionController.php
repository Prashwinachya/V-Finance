<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankConnection;
use App\Models\Category;
use App\Models\Transaction;
use App\Services\DemoBankSyncService;
use App\Support\PaymentVerification;
use App\Support\Webauthn;
use App\Services\BankAccountProvisioningService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BankConnectionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = BankConnection::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(function (BankConnection $connection): array {
                return [
                    'id' => (string) $connection->id,
                    'bankName' => $connection->bank_name,
                    'accountHolderName' => $connection->account_holder_name,
                    'maskedAccount' => 'XXXXXX'.($connection->account_last4 ?: '0000'),
                    'isActive' => (bool) $connection->is_active,
                    'isPrimary' => (bool) $connection->is_primary,
                    'bankConnectionId' => (string) $connection->id,
                    'lastSyncedAt' => optional($connection->last_synced_at)?->toISOString(),
                    'createdAt' => optional($connection->created_at)?->toISOString(),
                ];
            })
            ->values();

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'bankName' => ['required', 'string', 'max:120'],
            'accountHolderName' => ['required', 'string', 'max:120'],
            'accountNumber' => ['required', 'string', 'min:6', 'max:34'],
            'ifscCode' => ['nullable', 'string', 'max:20'],
            'accessToken' => ['nullable', 'string', 'max:255'],
            'verificationToken' => ['nullable', 'string'],
        ]);

        $this->requirePaymentVerification($request, $data['verificationToken'] ?? null);

        $existingConnections = BankConnection::query()
            ->where('user_id', $request->user()->id)
            ->count();

        if ($existingConnections >= BankConnection::MAX_CONNECTED_ACCOUNTS) {
            return response()->json([
                'message' => 'You can connect up to '.BankConnection::MAX_CONNECTED_ACCOUNTS.' bank accounts at a time.',
            ], 422);
        }

        $sanitizedAccount = preg_replace('/\s+/', '', $data['accountNumber']);
        $hasPrimary = BankConnection::query()
            ->where('user_id', $request->user()->id)
            ->where('is_primary', true)
            ->exists();

        $connection = BankConnection::create([
            'user_id' => $request->user()->id,
            'bank_name' => $data['bankName'],
            'account_holder_name' => $data['accountHolderName'],
            'account_number' => $sanitizedAccount,
            'ifsc_code' => $data['ifscCode'] ?? null,
            'access_token' => $data['accessToken'] ?? null,
            'account_last4' => substr($sanitizedAccount, -4),
            'is_active' => true,
            'is_primary' => ! $hasPrimary,
            'meta' => [
                'security' => 'encrypted_at_rest',
                'connectedVia' => 'manual_secure_link',
            ],
        ]);

        app(BankAccountProvisioningService::class)->provision($connection);

        return response()->json([
            'message' => 'Bank connected securely',
            'bank' => [
                'id' => (string) $connection->id,
                'bankName' => $connection->bank_name,
                'accountHolderName' => $connection->account_holder_name,
                'maskedAccount' => 'XXXXXX'.$connection->account_last4,
                'isActive' => true,
                'isPrimary' => (bool) $connection->is_primary,
            ],
        ], 201);
    }

    public function updatePrimarySelection(Request $request): JsonResponse
    {
        $data = $request->validate([
            'primaryBankIds' => ['nullable', 'array'],
            'primaryBankIds.*' => ['integer'],
        ]);

        $selectedIds = collect($data['primaryBankIds'] ?? [])
            ->map(static fn ($id): int => (int) $id)
            ->unique()
            ->values();

        $userBankIds = BankConnection::query()
            ->where('user_id', $request->user()->id)
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->values();

        $invalidIds = $selectedIds->diff($userBankIds);
        if ($invalidIds->isNotEmpty()) {
            return response()->json(['message' => 'One or more selected bank accounts are invalid.'], 422);
        }

        DB::transaction(function () use ($request, $selectedIds): void {
            BankConnection::query()
                ->where('user_id', $request->user()->id)
                ->update(['is_primary' => false]);

            if ($selectedIds->isNotEmpty()) {
                BankConnection::query()
                    ->where('user_id', $request->user()->id)
                    ->whereIn('id', $selectedIds->all())
                    ->update(['is_primary' => true]);
            }
        });

        return response()->json([
            'message' => $selectedIds->isNotEmpty()
                ? 'Primary bank selection updated.'
                : 'Primary bank selection cleared. Bank-synced transactions will be hidden until you select at least one primary account.',
            'primaryBankIds' => $selectedIds->map(static fn (int $id): string => (string) $id)->all(),
        ]);
    }

    public function setPrimary(Request $request, BankConnection $bankConnection): JsonResponse
    {
        $this->assertOwnership($request, $bankConnection);

        $nextState = ! $bankConnection->is_primary;
        $bankConnection->forceFill(['is_primary' => $nextState])->save();

        return response()->json([
            'message' => $nextState ? 'Bank added to primary selection.' : 'Bank removed from primary selection.',
            'isPrimary' => $nextState,
        ]);
    }

    public function sync(Request $request, BankConnection $bankConnection): JsonResponse
    {
        $data = $request->validate([
            'verificationToken' => ['nullable', 'string'],
        ]);

        $this->assertOwnership($request, $bankConnection);
        $this->requirePaymentVerification($request, $data['verificationToken'] ?? null);

        if (! $bankConnection->is_primary) {
            return response()->json(['message' => 'Only selected primary banks can be synced. Mark this account as primary first.'], 422);
        }

        $result = $this->syncConnectedBank($request, $bankConnection);

        return response()->json([
            'message' => 'Bank transactions synced',
            'inserted' => $result['inserted'],
            'scanned' => $result['scanned'],
            'analysis' => $result['analysis'],
            'bank' => $result['bank'],
        ]);
    }

    public function syncPrimary(Request $request): JsonResponse
    {
        $data = $request->validate([
            'verificationToken' => ['nullable', 'string'],
        ]);

        $this->requirePaymentVerification($request, $data['verificationToken'] ?? null);

        $primaryConnections = BankConnection::query()
            ->where('user_id', $request->user()->id)
            ->where('is_primary', true)
            ->orderByDesc('id')
            ->get();

        if ($primaryConnections->isEmpty()) {
            return response()->json(['message' => 'Select at least one primary bank before syncing.'], 422);
        }

        $results = $primaryConnections->map(fn (BankConnection $connection): array => $this->syncConnectedBank($request, $connection));

        return response()->json([
            'message' => 'Primary bank accounts synced successfully.',
            'syncedBanks' => $results->map(fn (array $result): array => [
                'id' => $result['bank']['id'],
                'bankName' => $result['bank']['bankName'],
                'inserted' => $result['inserted'],
                'scanned' => $result['scanned'],
            ])->values(),
            'inserted' => (int) $results->sum('inserted'),
            'scanned' => (int) $results->sum('scanned'),
            'analysis' => [
                'incomeTotal' => round((float) $results->sum(fn (array $result): float => (float) ($result['analysis']['incomeTotal'] ?? 0)), 2),
                'expenseTotal' => round((float) $results->sum(fn (array $result): float => (float) ($result['analysis']['expenseTotal'] ?? 0)), 2),
                'recurringCandidates' => (int) $results->sum(fn (array $result): int => (int) ($result['analysis']['recurringCandidates'] ?? 0)),
            ],
        ]);
    }

    public function demoSync(Request $request, DemoBankSyncService $demoBankSyncService): JsonResponse
    {
        $result = $demoBankSyncService->seedForUser($request->user());

        return response()->json([
            'message' => 'Demo bank sync dataset imported successfully.',
            'connections' => $result['connections'],
            'transactions' => $result['transactions'],
            'inserted' => $result['inserted'],
            'scanned' => $result['scanned'],
            'analysis' => $result['analysis'],
        ]);
    }

    private function syncConnectedBank(Request $request, BankConnection $bankConnection): array
    {
        if (! $bankConnection->is_primary) {
            return [
                'bank' => [
                    'id' => (string) $bankConnection->id,
                    'bankName' => $bankConnection->bank_name,
                ],
                'inserted' => 0,
                'scanned' => 0,
                'analysis' => [
                    'incomeTotal' => 0,
                    'expenseTotal' => 0,
                    'recurringCandidates' => 0,
                ],
            ];
        }

        $feed = $this->mockBankFeed($bankConnection);
        $inserted = 0;

        DB::transaction(function () use ($request, $bankConnection, $feed, &$inserted): void {
            foreach ($feed as $entry) {
                $existing = Transaction::query()
                    ->where('user_id', $request->user()->id)
                    ->where('external_reference', $entry['externalReference'])
                    ->first();

                if ($existing) {
                    continue;
                }

                $type = $entry['amount'] >= 0 ? 'income' : 'expense';
                $absoluteAmount = abs($entry['amount']);

                $category = Category::firstOrCreate(
                    ['name' => $entry['category'], 'type' => $type],
                    ['color' => '#0ea5e9', 'icon' => 'building-2']
                );

                Transaction::create([
                    'user_id' => $request->user()->id,
                    'category_id' => $category->id,
                    'wallet_id' => null,
                    'bank_connection_id' => $bankConnection->id,
                    'title' => $entry['title'],
                    'category' => $entry['category'],
                    'description' => $entry['description'],
                    'amount' => $absoluteAmount,
                    'type' => $type,
                    'transaction_type' => 'bank',
                    'source' => 'bank_sync',
                    'external_reference' => $entry['externalReference'],
                    'is_recurring' => (bool) $entry['isRecurring'],
                    'recurrence' => $entry['recurrence'],
                    'date' => $entry['date'],
                    'timestamp' => now(),
                    'user_deleted' => false,
                ]);

                $inserted++;
            }

            $bankConnection->forceFill([
                'last_synced_at' => now(),
                'is_active' => true,
            ])->save();
        });

        $analysis = [
            'incomeTotal' => round(array_sum(array_map(fn (array $row): float => $row['amount'] > 0 ? $row['amount'] : 0, $feed)), 2),
            'expenseTotal' => round(abs(array_sum(array_map(fn (array $row): float => $row['amount'] < 0 ? $row['amount'] : 0, $feed))), 2),
            'recurringCandidates' => count(array_filter($feed, fn (array $row): bool => (bool) $row['isRecurring'])),
        ];

        app(BankAccountProvisioningService::class)->provision($bankConnection);

        return [
            'bank' => [
                'id' => (string) $bankConnection->id,
                'bankName' => $bankConnection->bank_name,
            ],
            'inserted' => $inserted,
            'scanned' => count($feed),
            'analysis' => $analysis,
        ];
    }

    public function destroy(Request $request, BankConnection $bankConnection): JsonResponse
    {
        $this->assertOwnership($request, $bankConnection);
        $wasPrimary = (bool) $bankConnection->is_primary;
        $bankConnection->delete();

        if ($wasPrimary) {
            $remainingHasPrimary = BankConnection::query()
                ->where('user_id', $request->user()->id)
                ->where('is_primary', true)
                ->exists();

            $fallback = $remainingHasPrimary ? null : BankConnection::query()
                ->where('user_id', $request->user()->id)
                ->latest('id')
                ->first();

            if ($fallback) {
                $fallback->forceFill(['is_primary' => true])->save();
            }
        }

        return response()->json(['message' => 'Bank connection removed']);
    }

    private function assertOwnership(Request $request, BankConnection $bankConnection): void
    {
        abort_unless((string) $bankConnection->user_id === (string) $request->user()->id, 404);
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

    private function mockBankFeed(BankConnection $connection): array
    {
        $suffix = $connection->account_last4;

        return [
            [
                'externalReference' => 'BANK-'.$connection->id.'-SALARY-'.now()->format('Ym'),
                'title' => 'Salary Credit',
                'description' => 'Monthly salary credited (A/C '.$suffix.')',
                'amount' => 84000,
                'category' => 'Salary',
                'isRecurring' => true,
                'recurrence' => 'monthly',
                'date' => now()->startOfMonth()->addDays(1)->toDateString(),
            ],
            [
                'externalReference' => 'BANK-'.$connection->id.'-EMI-'.now()->format('Ym'),
                'title' => 'Home Loan EMI',
                'description' => 'Auto-debit EMI payment',
                'amount' => -21500,
                'category' => 'EMI',
                'isRecurring' => true,
                'recurrence' => 'monthly',
                'date' => now()->startOfMonth()->addDays(4)->toDateString(),
            ],
            [
                'externalReference' => 'BANK-'.$connection->id.'-UPI-FOOD-'.now()->format('Ymd'),
                'title' => 'UPI Payment - Cafe',
                'description' => 'Food and dining spend',
                'amount' => -420,
                'category' => 'Food',
                'isRecurring' => false,
                'recurrence' => null,
                'date' => now()->subDays(2)->toDateString(),
            ],
            [
                'externalReference' => 'BANK-'.$connection->id.'-TRANSFER-'.now()->subDays(3)->format('Ymd'),
                'title' => 'IMPS Transfer Received',
                'description' => 'Personal transfer credit',
                'amount' => 7500,
                'category' => 'Transfer',
                'isRecurring' => false,
                'recurrence' => null,
                'date' => now()->subDays(3)->toDateString(),
            ],
            [
                'externalReference' => 'BANK-'.$connection->id.'-UTIL-'.now()->format('Ym'),
                'title' => 'Electricity Bill',
                'description' => 'Utility payment via netbanking',
                'amount' => -1860,
                'category' => 'Utilities',
                'isRecurring' => true,
                'recurrence' => 'monthly',
                'date' => now()->subDays(5)->toDateString(),
            ],
        ];
    }
}
