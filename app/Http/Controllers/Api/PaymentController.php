<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\ScheduledPayment;
use App\Models\Transaction;
use App\Models\Wallet;
use App\Support\ApiTransformer;
use App\Support\PaymentVerification;
use App\Support\Webauthn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = ScheduledPayment::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn (ScheduledPayment $payment): array => ApiTransformer::scheduledPayment($payment));

        return response()->json($items);
    }

    public function overview(Request $request): JsonResponse
    {
        $payments = ScheduledPayment::query()->where('user_id', $request->user()->id)->get();
        $dueSoon = $payments->filter(fn (ScheduledPayment $payment): bool => $payment->is_active && $payment->due_day >= now()->day && $payment->due_day <= now()->addDays(7)->day);

        return response()->json([
            'count' => $payments->count(),
            'activeCount' => $payments->where('is_active', true)->count(),
            'monthlyTotal' => (float) $payments->where('is_active', true)->sum('amount'),
            'dueSoon' => $dueSoon->values()->map(fn (ScheduledPayment $payment): array => ApiTransformer::scheduledPayment($payment)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'payee' => ['nullable', 'string', 'max:255'],
            'kind' => ['required', 'in:utility,subscription,rent,loan,insurance,other'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'dueDay' => ['required', 'integer', 'min:1', 'max:31'],
            'alertDaysBefore' => ['nullable', 'integer', 'min:0', 'max:30'],
            'notes' => ['nullable', 'string'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $payment = ScheduledPayment::create([
            'user_id' => $request->user()->id,
            'title' => $data['title'],
            'payee' => $data['payee'] ?? null,
            'kind' => $data['kind'],
            'amount' => $data['amount'],
            'due_day' => $data['dueDay'],
            'alert_days_before' => $data['alertDaysBefore'] ?? 3,
            'notes' => $data['notes'] ?? null,
            'is_active' => (bool) ($data['isActive'] ?? true),
        ]);

        return response()->json(ApiTransformer::scheduledPayment($payment), 201);
    }

    public function update(Request $request, ScheduledPayment $scheduledPayment): JsonResponse
    {
        $this->assertOwnership($request, $scheduledPayment);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'payee' => ['nullable', 'string', 'max:255'],
            'kind' => ['sometimes', 'in:utility,subscription,rent,loan,insurance,other'],
            'amount' => ['sometimes', 'numeric', 'min:0.01'],
            'dueDay' => ['sometimes', 'integer', 'min:1', 'max:31'],
            'alertDaysBefore' => ['nullable', 'integer', 'min:0', 'max:30'],
            'notes' => ['nullable', 'string'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $scheduledPayment->fill([
            'title' => $data['title'] ?? $scheduledPayment->title,
            'payee' => $data['payee'] ?? $scheduledPayment->payee,
            'kind' => $data['kind'] ?? $scheduledPayment->kind,
            'amount' => $data['amount'] ?? $scheduledPayment->amount,
            'due_day' => $data['dueDay'] ?? $scheduledPayment->due_day,
            'alert_days_before' => $data['alertDaysBefore'] ?? $scheduledPayment->alert_days_before,
            'notes' => $data['notes'] ?? $scheduledPayment->notes,
            'is_active' => $data['isActive'] ?? $scheduledPayment->is_active,
        ])->save();

        return response()->json(ApiTransformer::scheduledPayment($scheduledPayment));
    }

    public function destroy(Request $request, ScheduledPayment $scheduledPayment): JsonResponse
    {
        $this->assertOwnership($request, $scheduledPayment);
        $scheduledPayment->delete();

        return response()->json(['message' => 'Scheduled payment deleted']);
    }

    public function payNow(Request $request, ScheduledPayment $scheduledPayment): JsonResponse
    {
        $this->assertOwnership($request, $scheduledPayment);

        $data = $request->validate([
            'walletId' => ['nullable', 'integer'],
            'verificationToken' => ['nullable', 'string'],
        ]);

        $this->requirePaymentVerification($request, $data['verificationToken'] ?? null);

        $wallet = null;
        if (! empty($data['walletId'])) {
            $wallet = Wallet::where('user_id', $request->user()->id)->find($data['walletId']);
        }

        if ($wallet && (float) $wallet->balance < (float) $scheduledPayment->amount) {
            return response()->json(['message' => 'Insufficient wallet balance'], 422);
        }

        $transaction = DB::transaction(function () use ($request, $wallet, $scheduledPayment): Transaction {
            if ($wallet) {
                $wallet->balance = (float) $wallet->balance - (float) $scheduledPayment->amount;
                $wallet->save();
            }

            $category = Category::firstOrCreate(
                ['name' => ucfirst($scheduledPayment->kind), 'type' => 'expense'],
                ['color' => '#F59E0B', 'icon' => 'credit-card']
            );

            $created = Transaction::create([
                'user_id' => $request->user()->id,
                'category_id' => $category->id,
                'wallet_id' => $wallet?->id,
                'title' => $scheduledPayment->title,
                'category' => ucfirst($scheduledPayment->kind),
                'description' => 'Scheduled payment to '.($scheduledPayment->payee ?: 'Unknown'),
                'amount' => $scheduledPayment->amount,
                'type' => 'expense',
                'transaction_type' => 'debit',
                'is_recurring' => true,
                'recurrence' => 'monthly',
                'date' => now()->toDateString(),
                'timestamp' => now(),
                'user_deleted' => false,
            ]);

            $scheduledPayment->last_paid_at = now();
            $scheduledPayment->save();

            return $created;
        });

        $transaction->load(['user', 'wallet']);

        return response()->json([
            'payment' => ApiTransformer::scheduledPayment($scheduledPayment),
            'transaction' => ApiTransformer::transaction($transaction),
        ]);
    }

    public function scanPay(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'walletId' => ['nullable', 'integer'],
            'payee' => ['nullable', 'string', 'max:255'],
            'verificationToken' => ['nullable', 'string'],
        ]);

        $this->requirePaymentVerification($request, $data['verificationToken'] ?? null);

        $wallet = null;
        if (! empty($data['walletId'])) {
            $wallet = Wallet::where('user_id', $request->user()->id)->find($data['walletId']);
        }

        if ($wallet && (float) $wallet->balance < (float) $data['amount']) {
            return response()->json(['message' => 'Insufficient wallet balance'], 422);
        }

        $transaction = DB::transaction(function () use ($request, $wallet, $data): Transaction {
            if ($wallet) {
                $wallet->balance = (float) $wallet->balance - (float) $data['amount'];
                $wallet->save();
            }

            $category = Category::firstOrCreate(
                ['name' => 'Scan & Pay', 'type' => 'expense'],
                ['color' => '#EC4899', 'icon' => 'scan-line']
            );

            return Transaction::create([
                'user_id' => $request->user()->id,
                'category_id' => $category->id,
                'wallet_id' => $wallet?->id,
                'title' => $data['title'],
                'category' => 'Scan & Pay',
                'description' => $data['payee'] ? 'Paid to '.$data['payee'] : null,
                'amount' => $data['amount'],
                'type' => 'expense',
                'transaction_type' => 'scan_pay',
                'is_recurring' => false,
                'date' => now()->toDateString(),
                'timestamp' => now(),
                'user_deleted' => false,
            ]);
        });

        $transaction->load(['user', 'wallet']);

        return response()->json(ApiTransformer::transaction($transaction), 201);
    }

    private function assertOwnership(Request $request, ScheduledPayment $scheduledPayment): void
    {
        abort_unless((string) $scheduledPayment->user_id === (string) $request->user()->id, 404);
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

        $headerToken = $request->header('X-Payment-Verification-Token');
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
}
