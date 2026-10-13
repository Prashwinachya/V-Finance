<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;

class FinancialPulseController extends Controller
{
    public function getPulse(Request $request)
    {
        $user = $request->user();
        
        $wallets = $user->wallets;
        $totalBalance = $wallets->sum('balance');
        $loans = $user->loans;
        $totalDebt = $loans->sum('outstanding_balance');
        
        // 1. Quick Net Worth
        $netWorth = $totalBalance - $totalDebt;
        
        // 2. Financial Health Score (logic simplified from Autopilot)
        $score = 50; 
        $monthlyExpenses = 15000; 
        if ($monthlyExpenses > 0) {
            $monthsCoverage = $totalBalance / $monthlyExpenses;
            if ($monthsCoverage >= 6) $score += 20;
            elseif ($monthsCoverage >= 3) $score += 10;
            elseif ($monthsCoverage < 1) $score -= 15;
        }
        if ($totalBalance > 0) {
            $debtRatio = $totalDebt / $totalBalance;
            if ($debtRatio > 1) $score -= 15;
            elseif ($debtRatio === 0) $score += 15;
        }
        $score = max(0, min(100, (int)$score));
        
        $status = 'healthy';
        if ($score < 50) $status = 'critical';
        elseif ($score < 80) $status = 'watch';
        
        // 3. Safe to Spend (logic from Emergency Mode)
        $essentialPayments = $loans->sum('emi_amount');
        $safeToSpend = max(0, $totalBalance - $essentialPayments);
        
        // 4. Financial Streak (consecutive days without transaction > 5000)
        // Check transactions
        $transactions = $user->transactions()
            ->where('amount', '>', 5000)
            ->where('type', 'expense')
            ->orderBy('date', 'desc')
            ->first();
            
        $streakDays = 0;
        if ($transactions) {
            $lastHighSpend = Carbon::parse($transactions->date);
            $streakDays = $lastHighSpend->diffInDays(Carbon::now());
        } else {
            // If no high spend ever or no transactions, assume 14 days baseline for mockup
            $streakDays = 14; 
        }

        // 5. Notification Indicator
        // We will just return a simple count of simulated "alerts" for the UI.
        $alertsCount = 0;
        if ($score < 50) $alertsCount++;
        if ($streakDays < 3) $alertsCount++;
        if ($totalDebt > $totalBalance) $alertsCount++;

        // 6. Dynamic Insight
        $insight = "You're on track! Keep monitoring your spending.";
        if ($streakDays >= 7) {
            $insight = "Great job! You've kept high expenses low for $streakDays days.";
        } elseif ($score < 50) {
            $insight = "Your liquid cash is low. Consider reducing non-essential spending.";
        } elseif ($netWorth > 100000) {
            $insight = "Your net worth is growing! Consider allocating excess cash to investments.";
        }
        
        return response()->json([
            'health_score' => $score,
            'health_status' => $status,
            'safe_to_spend' => $safeToSpend,
            'net_worth' => $netWorth,
            'streak_days' => max(0, $streakDays),
            'insight' => $insight,
            'alerts_count' => $alertsCount,
        ]);
    }
}
