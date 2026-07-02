<?php

namespace App\Support;

use App\Models\Loan;
use App\Models\ScheduledPayment;
use App\Models\Transaction;
use App\Models\TripBudget;
use App\Models\User;
use App\Models\Wallet;
use Carbon\CarbonInterface;

class ApiTransformer
{
    private static function portalRole(User $user): string
    {
        // If explicit portal column exists, prefer it
        $portal = (string) ($user->portal ?? '');

        if ($portal !== '') {
            return in_array($portal, ['business_user'], true) ? 'business_user' : 'student';
        }

        $rawRole = (string) ($user->role ?: 'user');

        return match ($rawRole) {
            'user', 'student', 'super_admin_student' => 'student',
            'business_user', 'super_admin_business', 'super_admin' => 'business_user',
            default => 'student',
        };
    }

    public static function date(CarbonInterface|string|null $value): ?string
    {
        if ($value instanceof CarbonInterface) {
            return $value->toISOString();
        }

        if (is_string($value) && $value !== '') {
            return (string) now()->parse($value)->toISOString();
        }

        return null;
    }

    public static function user(User $user): array
    {
        $effectiveRole = $user->is_super_admin ? 'super_admin' : ($user->role ?: 'user');

        return [
            '_id' => (string) $user->id,
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $effectiveRole,
            'portal' => $user->portal ?? 'student',
            'portalRole' => self::portalRole($user),
            'isSuperAdmin' => (bool) $user->is_super_admin,
            'avatarUrl' => $user->avatar_url,
            'phone' => $user->phone,
            'dateOfBirth' => optional($user->date_of_birth)->toDateString(),
            'gender' => $user->gender,
            'city' => $user->city,
            'country' => $user->country,
            'timezone' => $user->timezone,
            'bio' => $user->bio,
            'requirePaymentPin' => (bool) $user->require_payment_pin,
            'requirePaymentFingerprint' => (bool) $user->require_payment_fingerprint,
            'paymentPinEnabled' => (bool) $user->payment_pin_enabled,
            'fingerprintEnabled' => (bool) $user->fingerprint_enabled,
            'hasBiometricCredential' => Webauthn::hasCredential($user),
            'fingerprintCount' => Webauthn::credentialCount($user),
            'biometricRpId' => $user->webauthn_rp_id,
            'lastLoginAt' => self::date($user->last_login_at),
            'loginCount' => (int) $user->login_count,
            'createdAt' => self::date($user->created_at),
            'updatedAt' => self::date($user->updated_at),
        ];
    }

    public static function transaction(Transaction $transaction): array
    {
        return [
            '_id' => (string) $transaction->id,
            'id' => (string) $transaction->id,
            'user' => $transaction->relationLoaded('user') && $transaction->user ? self::user($transaction->user) : (string) $transaction->user_id,
            'wallet' => $transaction->relationLoaded('wallet') && $transaction->wallet
                ? ['_id' => (string) $transaction->wallet->id, 'name' => $transaction->wallet->name]
                : ($transaction->wallet_id ? (string) $transaction->wallet_id : null),
            'title' => $transaction->title,
            'category' => $transaction->category,
            'type' => $transaction->type,
            'transactionType' => $transaction->transaction_type,
            'source' => $transaction->source ?? 'manual',
            'isRecurring' => (bool) $transaction->is_recurring,
            'recurrence' => $transaction->recurrence,
            'amount' => (float) $transaction->amount,
            'date' => self::date($transaction->date),
            'timestamp' => self::date($transaction->timestamp),
            'createdAt' => self::date($transaction->created_at),
            'updatedAt' => self::date($transaction->updated_at),
        ];
    }

    public static function nextEligibleWithdrawalDate(Wallet $wallet): ?CarbonInterface
    {
        if ($wallet->wallet_type !== 'pocket_saver_wallet' || ! $wallet->last_withdrawal_date) {
            return null;
        }

        return $wallet->last_withdrawal_date->copy()->addDays(14);
    }

    public static function wallet(Wallet $wallet, array $metrics = []): array
    {
        $nextEligible = self::nextEligibleWithdrawalDate($wallet);

        return [
            '_id' => (string) $wallet->id,
            'id' => (string) $wallet->id,
            'name' => $wallet->name,
            'walletType' => $wallet->wallet_type,
            'bankConnectionId' => $wallet->bank_connection_id ? (string) $wallet->bank_connection_id : null,
            'balance' => (float) $wallet->balance,
            'lastWithdrawalDate' => self::date($wallet->last_withdrawal_date),
            'canWithdrawNow' => ! $nextEligible || $nextEligible->isPast(),
            'nextEligibleWithdrawalDate' => self::date($nextEligible),
            'totalCredits' => (float) ($metrics['totalCredits'] ?? 0),
            'totalDebits' => (float) ($metrics['totalDebits'] ?? 0),
            'transactionsCount' => (int) ($metrics['transactionsCount'] ?? 0),
            'createdAt' => self::date($wallet->created_at),
            'updatedAt' => self::date($wallet->updated_at),
        ];
    }

    public static function tripBudget(TripBudget $tripBudget): array
    {
        return [
            '_id' => (string) $tripBudget->id,
            'id' => (string) $tripBudget->id,
            'user' => $tripBudget->relationLoaded('user') && $tripBudget->user ? self::user($tripBudget->user) : (string) $tripBudget->user_id,
            'budgetName' => $tripBudget->budget_name,
            'bankConnectionId' => $tripBudget->bank_connection_id ? (string) $tripBudget->bank_connection_id : null,
            'destination' => $tripBudget->destination,
            'amount' => (float) $tripBudget->amount,
            'period' => $tripBudget->period,
            'category' => $tripBudget->category,
            'startDate' => self::date($tripBudget->start_date),
            'endDate' => self::date($tripBudget->end_date),
            'peopleCount' => (int) $tripBudget->people_count,
            'breakdown' => $tripBudget->breakdown ?: [
                'accommodation' => 0,
                'transportation' => 0,
                'food' => 0,
                'activities' => 0,
                'miscellaneous' => 0,
            ],
            'createdAt' => self::date($tripBudget->created_at),
            'updatedAt' => self::date($tripBudget->updated_at),
        ];
    }

    public static function loan(Loan $loan): array
    {
        return [
            '_id' => (string) $loan->id,
            'id' => (string) $loan->id,
            'name' => $loan->name,
            'bankConnectionId' => $loan->bank_connection_id ? (string) $loan->bank_connection_id : null,
            'lender' => $loan->lender,
            'annualRate' => (float) $loan->annual_rate,
            'remainingPrincipal' => (float) $loan->remaining_principal,
            'emi' => (float) $loan->emi,
            'startDate' => self::date($loan->start_date),
            'tenureMonths' => $loan->tenure_months ? (int) $loan->tenure_months : null,
            'notes' => $loan->notes,
            'createdAt' => self::date($loan->created_at),
            'updatedAt' => self::date($loan->updated_at),
        ];
    }

    public static function scheduledPayment(ScheduledPayment $payment, array $extra = []): array
    {
        return array_merge([
            '_id' => (string) $payment->id,
            'id' => (string) $payment->id,
            'title' => $payment->title,
            'bankConnectionId' => $payment->bank_connection_id ? (string) $payment->bank_connection_id : null,
            'payee' => $payment->payee,
            'kind' => $payment->kind,
            'amount' => (float) $payment->amount,
            'dueDay' => (int) $payment->due_day,
            'alertDaysBefore' => (int) $payment->alert_days_before,
            'notes' => $payment->notes,
            'isActive' => (bool) $payment->is_active,
            'lastPaidAt' => self::date($payment->last_paid_at),
            'createdAt' => self::date($payment->created_at),
            'updatedAt' => self::date($payment->updated_at),
        ], $extra);
    }
}
