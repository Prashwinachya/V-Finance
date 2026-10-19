<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankConnection;
use App\Models\Transaction;
use App\Models\Wallet;
use App\Support\ApiTransformer;
use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $primaryBankIds = BankConnection::primaryIdsForUser($user->id);

        $applyPrimaryBankFilter = static function ($query) use ($primaryBankIds): void {
            $query->where(function ($inner) use ($primaryBankIds): void {
                $inner
                    ->where('source', '!=', 'bank_sync')
                    ->orWhereNull('source')
                    ->orWhere(function ($bank) use ($primaryBankIds): void {
                        if (! empty($primaryBankIds)) {
                            $bank->where('source', 'bank_sync')->whereIn('bank_connection_id', $primaryBankIds);
                            return;
                        }

                        $bank->whereRaw('1 = 0');
                    });
            });
        };

        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth()->toDateString();
        $endOfMonth = $now->copy()->endOfMonth()->toDateString();

        $totals = Transaction::query()
            ->where('user_id', $user->id)
            ->where('user_deleted', false)
            ->tap($applyPrimaryBankFilter)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
                COALESCE(SUM(CASE WHEN type = 'income' AND date >= ? AND date <= ? THEN amount ELSE 0 END), 0) as monthly_income,
                COALESCE(SUM(CASE WHEN type = 'expense' AND date >= ? AND date <= ? THEN amount ELSE 0 END), 0) as monthly_expense
            ", [$startOfMonth, $endOfMonth, $startOfMonth, $endOfMonth])
            ->first();

        $income = (float) ($totals->total_income ?? 0);
        $expense = (float) ($totals->total_expense ?? 0);
        $monthlyIncome = (float) ($totals->monthly_income ?? 0);
        $monthlyExpense = (float) ($totals->monthly_expense ?? 0);

        $recent = Transaction::query()
            ->with(['user', 'wallet'])
            ->where('user_id', $user->id)
            ->where('user_deleted', false)
            ->tap($applyPrimaryBankFilter)
            ->latest('date')
            ->limit(5)
            ->get()
            ->map(fn (Transaction $transaction): array => ApiTransformer::transaction($transaction));

        $sixMonthsStart = Carbon::now()->subMonths(5)->startOfMonth();
        $recentSixMonthsTx = Transaction::query()
            ->where('user_id', $user->id)
            ->where('user_deleted', false)
            ->where('date', '>=', $sixMonthsStart->toDateString())
            ->tap($applyPrimaryBankFilter)
            ->select(['type', 'amount', 'date'])
            ->get();

        $monthlyOverview = collect(range(5, 0))->map(function (int $monthsBack) use ($recentSixMonthsTx): array {
            $month = Carbon::now()->subMonths($monthsBack - 1);
            $yearMonth = $month->format('Y-m');

            $monthTx = $recentSixMonthsTx->filter(function ($tx) use ($yearMonth): bool {
                return $tx->date && str_starts_with((string) $tx->date, $yearMonth);
            });

            return [
                'month' => $month->format('M'),
                'income' => (float) $monthTx->where('type', 'income')->sum('amount'),
                'expense' => (float) $monthTx->where('type', 'expense')->sum('amount'),
            ];
        })->values();

        $categoryData = Transaction::query()
            ->where('user_id', $user->id)
            ->where('user_deleted', false)
            ->where('type', 'expense')
            ->where('date', '>=', $startOfMonth)
            ->where('date', '<=', $endOfMonth)
            ->tap($applyPrimaryBankFilter)
            ->selectRaw("COALESCE(category, 'General') as name, SUM(amount) as value")
            ->groupBy('name')
            ->orderByDesc('value')
            ->get()
            ->map(fn ($row): array => [
                'name' => (string) $row->name,
                'value' => (float) $row->value,
            ])
            ->values();

        $walletSummary = Wallet::query()
            ->where('user_id', $user->id)
            ->selectRaw('COALESCE(SUM(balance), 0) as total_balance, COUNT(*) as wallet_count')
            ->first();

        $walletSavings = (float) ($walletSummary->total_balance ?? 0);
        $walletCount = (int) ($walletSummary->wallet_count ?? 0);

        return response()->json([
            'summary' => [
                'totalIncome' => $income,
                'totalExpenses' => $expense,
                'balance' => $income - $expense,
                'monthlyIncome' => $monthlyIncome,
                'monthlyExpenses' => $monthlyExpense,
            ],
            'monthlyOverview' => $monthlyOverview,
            'categoryData' => $categoryData,
            'walletSavings' => $walletSavings,
            'walletCount' => $walletCount,
            'primaryBankCount' => count($primaryBankIds),
            'recentTransactions' => $recent,
        ]);
    }
}
