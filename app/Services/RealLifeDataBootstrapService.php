<?php

namespace App\Services;

use App\Models\Loan;
use App\Models\ScheduledPayment;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;

class RealLifeDataBootstrapService
{
    public function __construct(private readonly DemoBankSyncService $demoBankSyncService)
    {
    }

    public function ensureForUser(User $user): void
    {
        if (! $this->needsBootstrap($user)) {
            return;
        }

        // Uses existing demo bank sync + provisioning to create realistic data
        // across transactions, wallets, payments, subscriptions, and business loans.
        $this->demoBankSyncService->seedForUser($user);
    }

    private function needsBootstrap(User $user): bool
    {
        $isStudentLike = in_array((string) ($user->role ?? 'student'), ['student', 'user', 'super_admin_student'], true);

        $hasTransactions = Transaction::query()->where('user_id', $user->id)->exists();
        $hasWallets = Wallet::query()->where('user_id', $user->id)->exists();
        $hasPayments = ScheduledPayment::query()->where('user_id', $user->id)->exists();
        $hasRecurringForRadar = Transaction::query()
            ->where('user_id', $user->id)
            ->where('is_recurring', true)
            ->exists();

        $needsBusinessLoans = ! $isStudentLike
            && ! Loan::query()->where('user_id', $user->id)->exists();

        return ! $hasTransactions
            || ! $hasWallets
            || ! $hasPayments
            || ! $hasRecurringForRadar
            || $needsBusinessLoans;
    }
}
