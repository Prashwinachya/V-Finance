<?php

namespace App\Http\Controllers;

use App\Services\SubscriptionRadarService;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(SubscriptionRadarService $radarService): View
    {
        $user = auth()->user();

        $currentMonthIncome = (float) $user->transactions()
            ->where('type', 'income')
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->sum('amount');

        $currentMonthExpense = (float) $user->transactions()
            ->where('type', 'expense')
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->sum('amount');

        $previousMonthDate = now()->subMonth();

        $previousMonthIncome = (float) $user->transactions()
            ->where('type', 'income')
            ->whereMonth('date', $previousMonthDate->month)
            ->whereYear('date', $previousMonthDate->year)
            ->sum('amount');

        $previousMonthExpense = (float) $user->transactions()
            ->where('type', 'expense')
            ->whereMonth('date', $previousMonthDate->month)
            ->whereYear('date', $previousMonthDate->year)
            ->sum('amount');

        $currentNet = $currentMonthIncome - $currentMonthExpense;
        $previousNet = $previousMonthIncome - $previousMonthExpense;

        $monthlyChangePercentage = $previousNet == 0.0
            ? ($currentNet > 0 ? 100.0 : 0.0)
            : (($currentNet - $previousNet) / abs($previousNet)) * 100;

        $recentTransactions = $user->transactions()
            ->with('category')
            ->latest('date')
            ->limit(5)
            ->get();

        $radar = $radarService->buildForUser($user);
        $radarSummary = $radar['summary'];

        return view('dashboard', [
            'totalBalance' => $user->total_balance,
            'monthlyIncome' => $currentMonthIncome,
            'monthlyExpenses' => $currentMonthExpense,
            'monthlyChangePercentage' => $monthlyChangePercentage,
            'recentTransactions' => $recentTransactions,
            'radarLeakYearly' => (float) ($radarSummary['leaking_annual'] ?? 0),
            'radarDetectedCount' => (int) ($radarSummary['detected_count'] ?? 0),
            'radarUnusedCount' => (int) ($radarSummary['unused_count'] ?? 0),
        ]);
    }
}
