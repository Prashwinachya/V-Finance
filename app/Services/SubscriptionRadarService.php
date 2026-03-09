<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Collection;

class SubscriptionRadarService
{
    private const CADENCE_DEFINITIONS = [
        'monthly' => ['days' => 30, 'perYear' => 12, 'min' => 24, 'max' => 37],
        'quarterly' => ['days' => 91, 'perYear' => 4, 'min' => 76, 'max' => 105],
        'yearly' => ['days' => 365, 'perYear' => 1, 'min' => 320, 'max' => 410],
    ];

    public function buildForUser($user): array
    {
        $transactions = $user->transactions()
            ->where('type', 'expense')
            ->whereDate('date', '>=', now()->subMonths(18))
            ->orderBy('date')
            ->get(['title', 'description', 'amount', 'date']);

        $groups = $transactions
            ->groupBy(fn ($transaction) => $this->normalizeTitle($transaction->title));

        $subscriptions = $groups
            ->map(fn (Collection $group, string $key) => $this->analyzeGroup($group, $key))
            ->filter()
            ->sortByDesc('annual_cost')
            ->values();

        $totalAnnual = (float) $subscriptions->sum('annual_cost');
        $leakingAnnual = (float) $subscriptions
            ->where('unused_score', '>=', 60)
            ->sum('annual_cost');

        return [
            'subscriptions' => $subscriptions,
            'summary' => [
                'total_annual' => $totalAnnual,
                'leaking_annual' => $leakingAnnual,
                'detected_count' => $subscriptions->count(),
                'unused_count' => $subscriptions->where('unused_score', '>=', 60)->count(),
            ],
        ];
    }

    private function analyzeGroup(Collection $group, string $groupKey): ?array
    {
        if ($group->count() < 2) {
            return null;
        }

        $sorted = $group->sortBy('date')->values();
        $amounts = $sorted->pluck('amount')->map(fn ($amount) => (float) $amount)->values();

        $intervals = collect();
        for ($index = 1; $index < $sorted->count(); $index++) {
            $previous = Carbon::parse($sorted[$index - 1]->date);
            $current = Carbon::parse($sorted[$index]->date);
            $intervals->push($previous->diffInDays($current));
        }

        if ($intervals->isEmpty()) {
            return null;
        }

        $medianInterval = $this->median($intervals->all());
        $cadence = $this->resolveCadence($medianInterval);

        if ($cadence === null) {
            return null;
        }

        $amountMean = $amounts->avg();
        $amountStdDev = $this->stdDev($amounts->all());
        $amountConsistency = $amountMean > 0 ? max(0, 100 - (($amountStdDev / $amountMean) * 100)) : 0;
        $intervalStdDev = $this->stdDev($intervals->all());
        $intervalConsistency = max(0, 100 - (($intervalStdDev / max(1, $medianInterval)) * 100));

        $confidence = (int) round(min(
            99,
            max(
                35,
                ($amountConsistency * 0.4)
                + ($intervalConsistency * 0.45)
                + min(15, $sorted->count() * 2)
            )
        ));

        $annualCost = round($amountMean * self::CADENCE_DEFINITIONS[$cadence]['perYear'], 2);
        $lastPayment = Carbon::parse($sorted->last()->date);
        $daysSinceLast = $lastPayment->diffInDays(now());
        $unusedScore = $this->calculateUnusedScore($cadence, $daysSinceLast, $annualCost, $groupKey);

        return [
            'name' => $this->displayName($sorted->last()->title, $groupKey),
            'group_key' => $groupKey,
            'cadence' => $cadence,
            'annual_cost' => $annualCost,
            'average_amount' => round($amountMean, 2),
            'last_payment' => $lastPayment->toDateString(),
            'days_since_last' => $daysSinceLast,
            'confidence' => $confidence,
            'unused_score' => $unusedScore,
            'status' => $unusedScore >= 75 ? 'likely_unused' : ($unusedScore >= 60 ? 'review' : 'active'),
        ];
    }

    private function calculateUnusedScore(string $cadence, int $daysSinceLast, float $annualCost, string $groupKey): int
    {
        $expectedDays = self::CADENCE_DEFINITIONS[$cadence]['days'];
        $delayRatio = $daysSinceLast / max(1, $expectedDays);

        $score = 20;
        $score += min(45, max(0, ($delayRatio - 0.8) * 30));
        $score += min(20, $annualCost / 1000);

        $maybeDigital = [
            'netflix', 'spotify', 'youtube', 'prime', 'cloud', 'ai', 'pro', 'plus', 'subscription',
            'adobe', 'notion', 'canva', 'chatgpt', 'apple', 'google', 'microsoft', 'dropbox',
        ];

        foreach ($maybeDigital as $term) {
            if (str_contains($groupKey, $term)) {
                $score += 10;
                break;
            }
        }

        return (int) round(min(99, max(1, $score)));
    }

    private function resolveCadence(float $medianInterval): ?string
    {
        foreach (self::CADENCE_DEFINITIONS as $cadence => $definition) {
            if ($medianInterval >= $definition['min'] && $medianInterval <= $definition['max']) {
                return $cadence;
            }
        }

        return null;
    }

    private function normalizeTitle(string $title): string
    {
        $normalized = mb_strtolower(trim($title));
        $normalized = preg_replace('/\d+/', '', $normalized);
        $normalized = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $normalized);

        return trim(preg_replace('/\s+/', ' ', $normalized));
    }

    private function displayName(string $rawTitle, string $fallback): string
    {
        $title = trim($rawTitle);

        if ($title !== '') {
            return $title;
        }

        return ucwords($fallback);
    }

    private function median(array $values): float
    {
        sort($values);
        $count = count($values);

        if ($count === 0) {
            return 0;
        }

        $middle = intdiv($count, 2);

        if ($count % 2 === 0) {
            return ($values[$middle - 1] + $values[$middle]) / 2;
        }

        return (float) $values[$middle];
    }

    private function stdDev(array $values): float
    {
        $count = count($values);

        if ($count < 2) {
            return 0.0;
        }

        $mean = array_sum($values) / $count;
        $variance = array_reduce(
            $values,
            fn ($carry, $value) => $carry + (($value - $mean) ** 2),
            0.0
        ) / ($count - 1);

        return sqrt($variance);
    }
}
