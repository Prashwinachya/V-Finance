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

        $income = (float) Transaction::query()
            ->where('user_id', $user->id)
            ->where('user_deleted', false)
            ->where('type', 'income')
            ->tap($applyPrimaryBankFilter)
            ->sum('amount');

        $expense = (float) Transaction::query()
            ->where('user_id', $user->id)
            ->where('user_deleted', false)
            ->where('type', 'expense')
            ->tap($applyPrimaryBankFilter)
            ->sum('amount');

        $monthlyIncome = (float) Transaction::query()
            ->where('user_id', $user->id)
            ->where('user_deleted', false)
            ->where('type', 'income')
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->tap($applyPrimaryBankFilter)
            ->sum('amount');

        $monthlyExpense = (float) Transaction::query()
            ->where('user_id', $user->id)
            ->where('user_deleted', false)
            ->where('type', 'expense')
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->tap($applyPrimaryBankFilter)
            ->sum('amount');

        $recent = Transaction::query()
            ->with(['user', 'wallet'])
            ->where('user_id', $user->id)
            ->where('user_deleted', false)
            ->tap($applyPrimaryBankFilter)
            ->latest('date')
            ->limit(5)
            ->get()
            ->map(fn (Transaction $transaction): array => ApiTransformer::transaction($transaction));

        $monthlyOverview = collect(range(5, 0))->map(function (int $monthsBack) use ($user, $applyPrimaryBankFilter): array {
            $month = Carbon::now()->subMonths($monthsBack - 1);

            $incomeValue = (float) Transaction::query()
                ->where('user_id', $user->id)
                ->where('user_deleted', false)
                ->where('type', 'income')
                ->whereYear('date', $month->year)
                ->whereMonth('date', $month->month)
                ->tap($applyPrimaryBankFilter)
                ->sum('amount');

            $expenseValue = (float) Transaction::query()
                ->where('user_id', $user->id)
                ->where('user_deleted', false)
                ->where('type', 'expense')
                ->whereYear('date', $month->year)
                ->whereMonth('date', $month->month)
                ->tap($applyPrimaryBankFilter)
                ->sum('amount');

            return [
                'month' => $month->format('M'),
                'income' => $incomeValue,
                'expense' => $expenseValue,
            ];
        })->values();

        $categoryData = Transaction::query()
            ->where('user_id', $user->id)
            ->where('user_deleted', false)
            ->where('type', 'expense')
            ->whereYear('date', now()->year)
            ->whereMonth('date', now()->month)
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
