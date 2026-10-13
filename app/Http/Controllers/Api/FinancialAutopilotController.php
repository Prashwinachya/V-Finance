<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;

class FinancialAutopilotController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $wallets = $user->wallets;
        $totalBalance = $wallets->sum('balance');
        $loans = $user->loans;
        $totalDebt = $loans->sum('outstanding_balance');
        
        // Calculate basic score 0-100
        $score = 50; // Base score
        
        // 1. Emergency Savings factor
        $monthlyExpenses = 15000; // Mock average monthly expense
        if ($monthlyExpenses > 0) {
            $monthsCoverage = $totalBalance / $monthlyExpenses;
            if ($monthsCoverage >= 6) {
                $score += 20;
            } elseif ($monthsCoverage >= 3) {
                $score += 10;
            } elseif ($monthsCoverage < 1) {
                $score -= 15;
            }
        }
        
        // 2. Debt factor
        if ($totalBalance > 0) {
            $debtRatio = $totalDebt / $totalBalance;
            if ($debtRatio > 1) {
                $score -= 15;
            } elseif ($debtRatio === 0) {
                $score += 15;
            }
        }

        // 3. Subscriptions factor (mock data for now)
        $subscriptions = 1200;
        if ($subscriptions > ($totalBalance * 0.1)) {
            $score -= 10;
        } else {
            $score += 5;
        }
        
        $score = max(0, min(100, (int)$score));
        
        // Generate recommendations
        $recommendations = [];
        
        if ($score < 40) {
            $recommendations[] = [
                'id' => 'rec_1',
                'title' => 'Critical: Low Emergency Savings',
                'message' => 'Your liquid balance covers less than 1 month of expenses.',
                'risk_level' => 'high',
                'impact' => 'Financial vulnerability to sudden expenses',
                'action_text' => 'Set up SIP to Emergency Wallet',
                'action_type' => 'link',
                'action_target' => '/wallets',
                'explanation' => 'We detected that your total balance across wallets is dangerously low compared to your estimated monthly outflows.'
            ];
        }

        if ($totalDebt > 0 && $totalBalance > $totalDebt) {
            $recommendations[] = [
                'id' => 'rec_2',
                'title' => 'Optimize Debt',
                'message' => 'You have enough surplus to clear your outstanding debt.',
                'risk_level' => 'medium',
                'impact' => 'Save on interest payments',
                'action_text' => 'Review Loans',
                'action_type' => 'link',
                'action_target' => '/loans',
                'explanation' => 'Paying off debt when you have excess liquid cash is usually financially optimal.'
            ];
        }
        
        if ($score > 80) {
            $recommendations[] = [
                'id' => 'rec_3',
                'title' => 'Excess Idle Cash',
                'message' => 'You have surplus funds that are not invested.',
                'risk_level' => 'low',
                'impact' => 'Opportunity cost of missed returns',
                'action_text' => 'Explore Investments',
                'action_type' => 'link',
                'action_target' => '/investing',
                'explanation' => 'Your emergency fund is fully funded. Excess cash loses value to inflation.'
            ];
        }
        
        // Add a generic one just in case
        if (empty($recommendations)) {
            $recommendations[] = [
                'id' => 'rec_4',
                'title' => 'Review Subscription Spending',
                'message' => 'Your active subscriptions total ₹' . number_format($subscriptions) . '/mo.',
                'risk_level' => 'low',
                'impact' => 'Free up monthly cash flow',
                'action_text' => 'View Subscriptions',
                'action_type' => 'link',
                'action_target' => '/smart-radar',
                'explanation' => 'Regular audits of recurring expenses is a healthy financial habit.'
            ];
        }

        return response()->json([
            'score' => $score,
            'last_updated' => Carbon::now()->toIso8601String(),
            'recommendations' => $recommendations
        ]);
    }
}
