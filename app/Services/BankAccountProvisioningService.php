<?php

namespace App\Services;

use App\Models\BankConnection;
use App\Models\Category;
use App\Models\Loan;
use App\Models\ScheduledPayment;
use App\Models\Transaction;
use App\Models\TripBudget;
use App\Models\Wallet;
use Illuminate\Support\Arr;

class BankAccountProvisioningService
{
    private const WALLET_TYPES = [
        'travelling_wallet',
        'medical_emergency_wallet',
        'pocket_saver_wallet',
    ];

    private const DESTINATIONS = [
        'Goa',
        'Jaipur',
        'Munnar',
        'Shillong',
        'Pondicherry',
        'Coorg',
        'Udaipur',
        'Manali',
    ];

    private const SUBSCRIPTION_NAMES = [
        'StreamFlix Premium',
        'CloudBox Backup',
        'FitLife Plus',
        'MusicSphere',
        'OfficeSuite Pro',
        'TravelMate Elite',
        'SecureShield',
        'Mindful Reads',
    ];

    private const PAYMENT_TEMPLATES = [
        ['kind' => 'utility', 'title' => 'Electricity Bill', 'payee' => 'City Power Board'],
        ['kind' => 'insurance', 'title' => 'Health Insurance', 'payee' => 'Care Protect'],
        ['kind' => 'subscription', 'title' => 'OTT Bundle', 'payee' => 'StreamBox'],
        ['kind' => 'loan', 'title' => 'Vehicle EMI', 'payee' => 'Metro Finance'],
    ];

    public function provision(BankConnection $connection): void
    {
        $profile = $this->profile($connection);

        $wallet = $this->ensureWallet($connection, $profile);
        $this->ensureWalletSeedTransactions($connection, $wallet, $profile);
        $this->ensureTripPlan($connection, $profile);
        $this->ensureLoans($connection, $profile);
        $this->ensureScheduledPayments($connection, $profile);
        $this->ensureRecurringTransactions($connection, $profile);
    }

    private function ensureTripPlan(BankConnection $connection, array $profile): void
    {
        TripBudget::query()->firstOrCreate(
            [
                'user_id' => $connection->user_id,
                'bank_connection_id' => $connection->id,
                'budget_name' => $profile['tripName'],
            ],
            [
                'destination' => $profile['destination'],
                'amount' => $profile['tripAmount'],
                'period' => 'quarterly',
                'category' => 'Travel',
                'start_date' => now()->addWeeks(($profile['seed'] % 6) + 2)->toDateString(),
                'end_date' => now()->addWeeks(($profile['seed'] % 6) + 3)->toDateString(),
                'people_count' => ($profile['seed'] % 4) + 1,
                'breakdown' => [
                    'accommodation' => round($profile['tripAmount'] * 0.32, 2),
                    'transportation' => round($profile['tripAmount'] * 0.24, 2),
                    'food' => round($profile['tripAmount'] * 0.18, 2),
                    'activities' => round($profile['tripAmount'] * 0.16, 2),
                    'miscellaneous' => round($profile['tripAmount'] * 0.10, 2),
                ],
            ]
        );
    }

    private function ensureLoans(BankConnection $connection, array $profile): void
    {
        if ($this->isStudent($connection)) {
            return;
        }

        foreach ($profile['loans'] as $loanConfig) {
            Loan::query()->firstOrCreate(
                [
                    'user_id' => $connection->user_id,
                    'bank_connection_id' => $connection->id,
                    'name' => $loanConfig['name'],
                ],
                [
                    'lender' => $loanConfig['lender'],
                    'annual_rate' => $loanConfig['annualRate'],
                    'remaining_principal' => $loanConfig['remainingPrincipal'],
                    'emi' => $loanConfig['emi'],
                    'start_date' => $loanConfig['startDate'],
                    'tenure_months' => $loanConfig['tenureMonths'],
                    'notes' => $loanConfig['notes'],
                ]
            );
        }
    }

    private function ensureScheduledPayments(BankConnection $connection, array $profile): void
    {
        foreach ($profile['payments'] as $paymentConfig) {
            ScheduledPayment::query()->firstOrCreate(
                [
                    'user_id' => $connection->user_id,
                    'bank_connection_id' => $connection->id,
                    'title' => $paymentConfig['title'],
                ],
                [
                    'payee' => $paymentConfig['payee'],
                    'kind' => $paymentConfig['kind'],
                    'amount' => $paymentConfig['amount'],
                    'due_day' => $paymentConfig['dueDay'],
                    'alert_days_before' => $paymentConfig['alertDaysBefore'],
                    'notes' => $paymentConfig['notes'],
                    'is_active' => true,
                    'last_paid_at' => now()->subDays(($profile['seed'] % 5) + 2),
                ]
            );
        }
    }

    private function ensureWallet(BankConnection $connection, array $profile): Wallet
    {
        if ($this->isStudent($connection)) {
            $existing = Wallet::query()
                ->where('user_id', $connection->user_id)
                ->where('wallet_type', 'pocket_saver_wallet')
                ->oldest('id')
                ->first();

            if ($existing) {
                return $existing;
            }

            return Wallet::query()->create([
                'user_id' => $connection->user_id,
                'bank_connection_id' => $connection->id,
                'name' => 'Pocket Saver Wallet',
                'wallet_type' => 'pocket_saver_wallet',
                'balance' => $profile['walletBalance'],
                'last_withdrawal_date' => now()->subDays(16 + ($profile['seed'] % 5)),
            ]);
        }

        return Wallet::query()->firstOrCreate(
            [
                'user_id' => $connection->user_id,
                'bank_connection_id' => $connection->id,
                'name' => $profile['walletName'],
            ],
            [
                'wallet_type' => $profile['walletType'],
                'balance' => $profile['walletBalance'],
                'last_withdrawal_date' => $profile['walletType'] === 'pocket_saver_wallet'
                    ? now()->subDays(16 + ($profile['seed'] % 5))
                    : null,
            ]
        );
    }

    private function ensureWalletSeedTransactions(BankConnection $connection, Wallet $wallet, array $profile): void
    {
        $incomeCategory = Category::firstOrCreate(
            ['name' => 'Wallet', 'type' => 'income'],
            ['color' => '#10B981', 'icon' => 'wallet']
        );

        $expenseCategory = Category::firstOrCreate(
            ['name' => 'Wallet', 'type' => 'expense'],
            ['color' => '#EF4444', 'icon' => 'wallet']
        );

        $entries = [
            [
                'reference' => 'BANKWALLET-'.$connection->id.'-TOPUP',
                'category_id' => $incomeCategory->id,
                'title' => 'Bank reserve top up - '.$profile['label'],
                'description' => 'Initial wallet reserve from '.$profile['bankLabel'],
                'amount' => $profile['walletTopUp'],
                'type' => 'income',
                'date' => now()->subDays(12 + ($profile['seed'] % 7))->toDateString(),
            ],
            [
                'reference' => 'BANKWALLET-'.$connection->id.'-SPEND',
                'category_id' => $expenseCategory->id,
                'title' => 'Bank reserve spend - '.$profile['label'],
                'description' => 'Protected fund usage for '.$profile['bankLabel'],
                'amount' => $profile['walletTopUp'] - $profile['walletBalance'],
                'type' => 'expense',
                'date' => now()->subDays(4 + ($profile['seed'] % 4))->toDateString(),
            ],
        ];

        foreach ($entries as $entry) {
            Transaction::query()->firstOrCreate(
                [
                    'user_id' => $connection->user_id,
                    'external_reference' => $entry['reference'],
                ],
                [
                    'category_id' => $entry['category_id'],
                    'wallet_id' => $wallet->id,
                    'bank_connection_id' => $connection->id,
                    'title' => $entry['title'],
                    'category' => 'Wallet',
                    'description' => $entry['description'],
                    'amount' => $entry['amount'],
                    'type' => $entry['type'],
                    'transaction_type' => 'transfer',
                    'source' => 'bank_sync',
                    'is_recurring' => false,
                    'recurrence' => null,
                    'date' => $entry['date'],
                    'timestamp' => now(),
                    'user_deleted' => false,
                ]
            );
        }
    }

    private function ensureRecurringTransactions(BankConnection $connection, array $profile): void
    {
        foreach ($profile['subscriptions'] as $subscription) {
            $category = Category::firstOrCreate(
                ['name' => 'Subscriptions', 'type' => 'expense'],
                ['color' => '#8B5CF6', 'icon' => 'radar']
            );

            foreach ([3, 2, 1] as $monthsBack) {
                $date = now()->subMonths($monthsBack)->startOfMonth()->addDays(($profile['seed'] % 6) + $subscription['dayOffset']);

                Transaction::query()->firstOrCreate(
                    [
                        'user_id' => $connection->user_id,
                        'external_reference' => 'BANKSUB-'.$connection->id.'-'.$subscription['slug'].'-'.$date->format('Ym'),
                    ],
                    [
                        'category_id' => $category->id,
                        'wallet_id' => null,
                        'bank_connection_id' => $connection->id,
                        'title' => $subscription['title'],
                        'category' => 'Subscriptions',
                        'description' => 'Auto-debit subscription via '.$profile['bankLabel'],
                        'amount' => $subscription['amount'],
                        'type' => 'expense',
                        'transaction_type' => 'debit',
                        'source' => 'bank_sync',
                        'is_recurring' => true,
                        'recurrence' => 'monthly',
                        'date' => $date->toDateString(),
                        'timestamp' => $date->copy()->setTime(9, 15),
                        'user_deleted' => false,
                    ]
                );
            }
        }
    }

    private function profile(BankConnection $connection): array
    {
        $seed = (int) $connection->id;
        $destination = self::DESTINATIONS[$seed % count(self::DESTINATIONS)];
        $walletType = self::WALLET_TYPES[$seed % count(self::WALLET_TYPES)];
        $bankLabel = trim($connection->bank_name).' A/C '.$connection->account_last4;
        $label = trim($connection->bank_name).' '.$connection->account_last4;

        $paymentTemplateA = self::PAYMENT_TEMPLATES[$seed % count(self::PAYMENT_TEMPLATES)];
        $paymentTemplateB = self::PAYMENT_TEMPLATES[($seed + 2) % count(self::PAYMENT_TEMPLATES)];

        $subscriptionA = self::SUBSCRIPTION_NAMES[$seed % count(self::SUBSCRIPTION_NAMES)];
        $subscriptionB = self::SUBSCRIPTION_NAMES[($seed + 3) % count(self::SUBSCRIPTION_NAMES)];

        $tripAmount = 22000 + ($seed * 1750);
        $walletBalance = 9000 + ($seed * 850);
        $walletTopUp = $walletBalance + 3200 + ($seed * 120);

        return [
            'seed' => $seed,
            'label' => $label,
            'bankLabel' => $bankLabel,
            'destination' => $destination,
            'tripName' => $destination.' Getaway via '.$label,
            'tripAmount' => $tripAmount,
            'walletName' => 'Reserve Wallet • '.$label,
            'walletType' => $walletType,
            'walletBalance' => $walletBalance,
            'walletTopUp' => $walletTopUp,
            'loans' => [
                [
                    'name' => 'Flexi Credit Line • '.$label,
                    'lender' => trim($connection->bank_name).' Finance',
                    'annualRate' => 10.5 + ($seed % 5),
                    'remainingPrincipal' => 120000 + ($seed * 9500),
                    'emi' => 6200 + ($seed * 260),
                    'startDate' => now()->subMonths(10 + ($seed % 6))->startOfMonth()->toDateString(),
                    'tenureMonths' => 24 + ($seed % 18),
                    'notes' => 'Linked to '.$bankLabel.' for optimizer planning.',
                ],
                [
                    'name' => 'Travel Assist Loan • '.$label,
                    'lender' => trim($connection->bank_name).' Credit',
                    'annualRate' => 12.25 + ($seed % 4),
                    'remainingPrincipal' => 65000 + ($seed * 5400),
                    'emi' => 3400 + ($seed * 180),
                    'startDate' => now()->subMonths(6 + ($seed % 5))->startOfMonth()->toDateString(),
                    'tenureMonths' => 18 + ($seed % 12),
                    'notes' => 'Secondary bank-linked loan for '.$bankLabel.'.',
                ],
            ],
            'payments' => [
                [
                    'title' => $paymentTemplateA['title'].' • '.$label,
                    'payee' => $paymentTemplateA['payee'],
                    'kind' => $paymentTemplateA['kind'],
                    'amount' => 1200 + ($seed * 125),
                    'dueDay' => 4 + ($seed % 12),
                    'alertDaysBefore' => 3,
                    'notes' => 'Auto-generated from bank sync for '.$bankLabel.'.',
                ],
                [
                    'title' => $paymentTemplateB['title'].' • '.$label,
                    'payee' => $paymentTemplateB['payee'],
                    'kind' => $paymentTemplateB['kind'],
                    'amount' => 1800 + ($seed * 165),
                    'dueDay' => 10 + ($seed % 12),
                    'alertDaysBefore' => 5,
                    'notes' => 'Scheduled around '.$bankLabel.' outflows.',
                ],
            ],
            'subscriptions' => [
                [
                    'slug' => 'sub-a',
                    'title' => $subscriptionA.' • '.trim($connection->bank_name),
                    'amount' => 199 + ($seed % 5) * 40,
                    'dayOffset' => 2,
                ],
                [
                    'slug' => 'sub-b',
                    'title' => $subscriptionB.' • '.trim($connection->bank_name),
                    'amount' => 349 + ($seed % 4) * 55,
                    'dayOffset' => 8,
                ],
            ],
        ];
    }

    private function isStudent(BankConnection $connection): bool
    {
        $role = (string) ($connection->user?->role ?? 'student');
        return in_array($role, ['student', 'user', 'super_admin_student'], true);
    }
}