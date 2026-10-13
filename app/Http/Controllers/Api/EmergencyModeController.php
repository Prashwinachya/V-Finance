<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class EmergencyModeController extends Controller
{
    public function getEmergencyData(Request $request)
    {
        $user = $request->user();
        
        $wallets = $user->wallets;
        
        // Calculate Liquid Balance (ignore pocket_saver_wallet limits for emergency view)
        $liquidBalance = $wallets->sum('balance');
        
        // Calculate essential upcoming payments (loans)
        $loans = $user->loans;
        $essentialPayments = $loans->sum('emi_amount');
        
        // Subscriptions that can be paused (mock data based on active overrides)
        $overrides = $user->subscriptionOverrides;
        $pauseableAmount = 2500; // Mock amount
        
        // Safe to spend
        $safeToSpend = max(0, $liquidBalance - $essentialPayments);
        
        $monthlyExpenses = 15000;
        $coverageDays = $monthlyExpenses > 0 ? round(($liquidBalance / $monthlyExpenses) * 30) : 0;
        
        return response()->json([
            'liquid_balance' => $liquidBalance,
            'essential_payments' => $essentialPayments,
            'pauseable_subscriptions_amount' => $pauseableAmount,
            'safe_to_spend' => $safeToSpend,
            'coverage_days' => $coverageDays,
            'status' => $coverageDays > 30 ? 'healthy' : 'critical'
        ]);
    }
}
