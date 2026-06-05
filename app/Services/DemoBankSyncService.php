<?php

namespace App\Services;

use App\Models\BankConnection;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DemoBankSyncService
{
    /**
     * @return array{connections:int, transactions:int, inserted:int, scanned:int, analysis:array{incomeTotal:float, expenseTotal:float, recurringCandidates:int}}
     */
    public function seedForUser(User $user): array
    {
        $templates = $this->accountTemplates($user);
        $currentConnectionCount = BankConnection::query()->where('user_id', $user->id)->count();
        $inserted = 0;
        $scanned = 0;
        $incomeTotal = 0.0;
        $expenseTotal = 0.0;
        $recurringCandidates = 0;

        DB::transaction(function () use ($user, $templates, &$currentConnectionCount, &$inserted, &$scanned, &$incomeTotal, &$expenseTotal, &$recurringCandidates): void {
            foreach ($templates as $template) {
                $last4 = substr($template['accountNumber'], -4);

                $existingConnection = BankConnection::query()
                    ->where('user_id', $user->id)
                    ->where('bank_name', $template['bankName'])
                    ->where('account_last4', $last4)
                    ->first();

                if (! $existingConnection && $currentConnectionCount >= BankConnection::MAX_CONNECTED_ACCOUNTS) {
                    continue;
                }

                $connection = BankConnection::query()->firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'bank_name' => $template['bankName'],
                        'account_last4' => $last4,
                    ],
                    [
                        'account_holder_name' => $template['accountHolderName'],
                        'account_number' => $template['accountNumber'],
                        'ifsc_code' => $template['ifscCode'],
                        'access_token' => 'demo-token-'.$template['key'].'-'.$user->id,
                        'is_active' => true,
                        'is_primary' => $template['isPrimary'],
                        'meta' => [
                            'provider' => 'demo-sandbox',
                            'dataset' => 'bank-sync-v1',
                            'isDemoData' => true,
                        ],
                    ]
                );

                if ($connection->wasRecentlyCreated) {
                    $currentConnectionCount++;
                }

                $connection->forceFill([
                    'is_active' => true,
                    'is_primary' => $template['isPrimary'],
                    'last_synced_at' => now(),
                    'meta' => array_merge($connection->meta ?? [], [
                        'provider' => 'demo-sandbox',
                        'dataset' => 'bank-sync-v1',
                        'isDemoData' => true,
                    ]),
                ])->save();

                $feed = $this->transactionFeed($connection, $template);
                $scanned += count($feed);

                foreach ($feed as $entry) {
                    $type = $entry['amount'] >= 0 ? 'income' : 'expense';
                    $absoluteAmount = abs($entry['amount']);

                    if ($entry['amount'] > 0) {
                        $incomeTotal += $entry['amount'];
                    }

                    if ($entry['amount'] < 0) {
                        $expenseTotal += abs($entry['amount']);
                    }

                    if ($entry['isRecurring']) {
                        $recurringCandidates++;
                    }

                    $category = Category::query()->firstOrCreate(
                        ['name' => $entry['category'], 'type' => $type],
                        ['color' => '#0ea5e9', 'icon' => 'building-2']
                    );

                    $transaction = Transaction::query()->firstOrCreate(
                        [
                            'user_id' => $user->id,
                            'external_reference' => $entry['externalReference'],
                        ],
                        [
                            'category_id' => $category->id,
                            'wallet_id' => null,
                            'bank_connection_id' => $connection->id,
                            'title' => $entry['title'],
                            'category' => $entry['category'],
                            'description' => $entry['description'],
                            'amount' => $absoluteAmount,
                            'type' => $type,
                            'transaction_type' => 'bank',
                            'source' => 'bank_sync',
                            'is_recurring' => (bool) $entry['isRecurring'],
                            'recurrence' => $entry['recurrence'],
                            'date' => $entry['date'],
                            'timestamp' => $entry['timestamp'],
                            'user_deleted' => false,
                        ]
                    );

                    if ($transaction->wasRecentlyCreated) {
                        $inserted++;
                    }
                }

                app(BankAccountProvisioningService::class)->provision($connection);
            }
        });

        return [
            'connections' => count($templates),
            'transactions' => $scanned,
            'inserted' => $inserted,
            'scanned' => $scanned,
            'analysis' => [
                'incomeTotal' => round($incomeTotal, 2),
                'expenseTotal' => round($expenseTotal, 2),
                'recurringCandidates' => $recurringCandidates,
            ],
        ];
    }

    /**
     * @return array<int, array{key:string, bankName:string, accountHolderName:string, accountNumber:string, ifscCode:string, isPrimary:bool}>
     */
    private function accountTemplates(User $user): array
    {
        return [
            [
                'key' => 'canara',
                'bankName' => 'Canara Bank',
                'accountHolderName' => $user->name,
                'accountNumber' => '22445566114821',
                'ifscCode' => 'CNRB0001XXX',
                'isPrimary' => true,
            ],
            [
                'key' => 'karnataka',
                'bankName' => 'Karnataka Bank',
                'accountHolderName' => $user->name,
                'accountNumber' => '5522338877314',
                'ifscCode' => 'KARB0002XXX',
                'isPrimary' => true,
            ],
            [
                'key' => 'hdfc',
                'bankName' => 'HDFC Bank',
                'accountHolderName' => $user->name,
                'accountNumber' => '9900117799056',
                'ifscCode' => 'HDFC0003XXX',
                'isPrimary' => false,
            ],
        ];
    }

    /**
     * @param array{key:string, bankName:string, accountHolderName:string, accountNumber:string, ifscCode:string, isPrimary:bool} $template
     * @return array<int, array{externalReference:string,title:string,description:string,amount:float,category:string,isRecurring:bool,recurrence:?string,date:string,timestamp:\Illuminate\Support\Carbon}>
     */
    private function transactionFeed(BankConnection $connection, array $template): array
    {
        $month = now()->format('Ym');

        return [
            [
                'externalReference' => 'BANKDEMO-'.$template['key'].'-SALARY-'.$month,
                'title' => 'Salary Credit',
                'description' => 'Monthly salary credited',
                'amount' => $template['key'] === 'hdfc' ? 125000 : ($template['key'] === 'karnataka' ? 38000 : 98000),
                'category' => 'Salary',
                'isRecurring' => true,
                'recurrence' => 'monthly',
                'date' => now()->startOfMonth()->addDays(1)->toDateString(),
                'timestamp' => now()->startOfMonth()->addDays(1)->setTime(9, 30),
            ],
            [
                'externalReference' => 'BANKDEMO-'.$template['key'].'-EMI-'.$month,
                'title' => 'Loan EMI Auto-Debit',
                'description' => 'Scheduled EMI debit',
                'amount' => $template['key'] === 'hdfc' ? -30500 : ($template['key'] === 'karnataka' ? -9800 : -21500),
                'category' => 'EMI',
                'isRecurring' => true,
                'recurrence' => 'monthly',
                'date' => now()->startOfMonth()->addDays(4)->toDateString(),
                'timestamp' => now()->startOfMonth()->addDays(4)->setTime(8, 50),
            ],
            [
                'externalReference' => 'BANKDEMO-'.$template['key'].'-UTILITY-'.$month,
                'title' => 'Electricity Bill',
                'description' => 'Utility payment via netbanking',
                'amount' => $template['key'] === 'hdfc' ? -3200 : ($template['key'] === 'karnataka' ? -2100 : -1860),
                'category' => 'Utilities',
                'isRecurring' => true,
                'recurrence' => 'monthly',
                'date' => now()->startOfMonth()->addDays(8)->toDateString(),
                'timestamp' => now()->startOfMonth()->addDays(8)->setTime(10, 15),
            ],
            [
                'externalReference' => 'BANKDEMO-'.$template['key'].'-SUBS-'.$month,
                'title' => 'Subscription Debit',
                'description' => 'Streaming subscription',
                'amount' => $template['key'] === 'hdfc' ? -899 : ($template['key'] === 'karnataka' ? -649 : -549),
                'category' => 'Subscriptions',
                'isRecurring' => true,
                'recurrence' => 'monthly',
                'date' => now()->startOfMonth()->addDays(10)->toDateString(),
                'timestamp' => now()->startOfMonth()->addDays(10)->setTime(19, 20),
            ],
            [
                'externalReference' => 'BANKDEMO-'.$template['key'].'-UPI-'.now()->format('Ymd'),
                'title' => 'UPI Payment',
                'description' => 'Food and dining',
                'amount' => $template['key'] === 'hdfc' ? -1250 : ($template['key'] === 'karnataka' ? -580 : -640),
                'category' => 'Food',
                'isRecurring' => false,
                'recurrence' => null,
                'date' => now()->subDays(2)->toDateString(),
                'timestamp' => now()->subDays(2)->setTime(13, 40),
            ],
            [
                'externalReference' => 'BANKDEMO-'.$template['key'].'-CREDIT-'.now()->subDays(1)->format('Ymd'),
                'title' => 'Transfer Received',
                'description' => 'Incoming transfer',
                'amount' => $template['key'] === 'hdfc' ? 45000 : ($template['key'] === 'karnataka' ? 12000 : 7500),
                'category' => 'Transfer',
                'isRecurring' => false,
                'recurrence' => null,
                'date' => now()->subDays(1)->toDateString(),
                'timestamp' => now()->subDays(1)->setTime(15, 10),
            ],
        ];
    }
}
