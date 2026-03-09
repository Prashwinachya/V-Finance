const express = require('express');
const Transaction = require('../models/Transaction');

const router = express.Router();

const cadenceMap = {
  monthly: { days: 30, perYear: 12, min: 24, max: 37 },
  quarterly: { days: 91, perYear: 4, min: 76, max: 105 },
  yearly: { days: 365, perYear: 1, min: 320, max: 410 },
};

const toINR = (value) => Math.round(Number(value || 0) * 100) / 100;

const normalizeTitle = (title = '') => {
  return String(title)
    .toLowerCase()
    .replace(/\d+/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const median = (values) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[middle - 1] + sorted[middle]) / 2;
  return sorted[middle];
};

const stdDev = (values) => {
  if (!values || values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
};

const resolveCadence = (intervalMedian) => {
  const entry = Object.entries(cadenceMap).find(([, definition]) => {
    return intervalMedian >= definition.min && intervalMedian <= definition.max;
  });
  return entry ? entry[0] : null;
};

const statusFromScore = (score) => {
  if (score >= 75) return 'likely_unused';
  if (score >= 60) return 'review';
  return 'active';
};

router.get('/radar', async (req, res) => {
  try {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 18);

    const expenses = await Transaction.find({
      user: req.user._id,
      type: 'expense',
      date: { $gte: cutoff },
      amount: { $gt: 0 },
    })
      .sort({ date: 1 })
      .select('title amount date category');

    const grouped = expenses.reduce((accumulator, item) => {
      const key = normalizeTitle(item.title);
      if (!key) return accumulator;
      if (!accumulator[key]) accumulator[key] = [];
      accumulator[key].push(item);
      return accumulator;
    }, {});

    const now = new Date();
    const subscriptions = Object.entries(grouped)
      .map(([groupKey, entries]) => {
        if (!entries || entries.length < 2) return null;

        const amounts = entries.map((entry) => Number(entry.amount || 0));
        const intervals = [];
        for (let index = 1; index < entries.length; index += 1) {
          const prev = new Date(entries[index - 1].date);
          const current = new Date(entries[index].date);
          const diff = Math.round((current - prev) / (1000 * 60 * 60 * 24));
          if (diff > 0) intervals.push(diff);
        }

        if (!intervals.length) return null;

        const intervalMedian = median(intervals);
        const cadence = resolveCadence(intervalMedian);
        if (!cadence) return null;

        const amountAverage = amounts.reduce((sum, value) => sum + value, 0) / amounts.length;
        const annualCost = amountAverage * cadenceMap[cadence].perYear;

        const amountConsistency = amountAverage > 0
          ? Math.max(0, 100 - ((stdDev(amounts) / amountAverage) * 100))
          : 0;
        const intervalConsistency = Math.max(0, 100 - ((stdDev(intervals) / Math.max(1, intervalMedian)) * 100));
        const confidence = Math.round(Math.min(99, Math.max(35,
          (amountConsistency * 0.4) + (intervalConsistency * 0.45) + Math.min(15, entries.length * 2)
        )));

        const lastPayment = new Date(entries[entries.length - 1].date);
        const daysSinceLast = Math.floor((now - lastPayment) / (1000 * 60 * 60 * 24));
        const expectedDays = cadenceMap[cadence].days;
        const delayRatio = daysSinceLast / Math.max(1, expectedDays);

        const digitalHints = [
          'netflix', 'spotify', 'youtube', 'prime', 'adobe', 'notion', 'canva', 'chatgpt',
          'apple', 'google', 'microsoft', 'dropbox', 'subscription', 'pro', 'plus', 'cloud',
        ];

        let unusedScore = 20;
        unusedScore += Math.min(45, Math.max(0, (delayRatio - 0.8) * 30));
        unusedScore += Math.min(20, annualCost / 1000);
        if (digitalHints.some((term) => groupKey.includes(term))) {
          unusedScore += 10;
        }
        unusedScore = Math.round(Math.min(99, Math.max(1, unusedScore)));

        const status = statusFromScore(unusedScore);

        return {
          id: groupKey,
          name: entries[entries.length - 1].title,
          cadence,
          averageAmount: toINR(amountAverage),
          annualCost: toINR(annualCost),
          confidence,
          unusedScore,
          status,
          category: entries[entries.length - 1].category,
          transactionsCount: entries.length,
          lastPayment: lastPayment.toISOString(),
          daysSinceLast,
          expectedDays,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.annualCost - a.annualCost);

    const totalAnnualCost = subscriptions.reduce((sum, item) => sum + item.annualCost, 0);
    const likelyUnused = subscriptions.filter((item) => item.status === 'likely_unused');
    const reviewNeeded = subscriptions.filter((item) => item.status === 'review');
    const leakingAnnualCost = [...likelyUnused, ...reviewNeeded]
      .reduce((sum, item) => sum + item.annualCost, 0);

    return res.json({
      summary: {
        detectedRecurringCount: subscriptions.length,
        totalAnnualCost: toINR(totalAnnualCost),
        likelyUnusedCount: likelyUnused.length,
        reviewCount: reviewNeeded.length,
        moneyLeakingAnnualCost: toINR(leakingAnnualCost),
        alert: leakingAnnualCost > 0
          ? `Money leaking here: ₹${Math.round(leakingAnnualCost).toLocaleString('en-IN')} yearly on underused apps`
          : 'No major leak detected right now. Keep tracking your subscriptions.',
      },
      subscriptions,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to build subscription radar' });
  }
});

module.exports = router;
