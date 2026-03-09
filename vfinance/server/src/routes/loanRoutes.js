const express = require('express');
const Loan = require('../models/Loan');

const router = express.Router();

const normalizeMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, Math.round(amount * 100) / 100);
};

const normalizeRate = (value) => {
  const rate = Number(value);
  if (!Number.isFinite(rate)) return 0;
  return Math.min(100, Math.max(0, Math.round(rate * 100) / 100));
};

const monthlyInterest = (balance, annualRate) => (balance * (annualRate / 100)) / 12;

const buildPaymentMap = (loans) => {
  const map = new Map();
  for (const loan of loans) {
    map.set(String(loan._id), {
      ...loan,
      remainingPrincipal: normalizeMoney(loan.remainingPrincipal),
      emi: normalizeMoney(loan.emi),
      annualRate: normalizeRate(loan.annualRate),
    });
  }
  return map;
};

const buildSortKey = (item, strategy) => {
  if (strategy === 'snowball') {
    return [item.remainingPrincipal, -item.annualRate, item.name];
  }

  return [-item.annualRate, item.remainingPrincipal, item.name];
};

const sortCandidates = (items, strategy) => {
  return [...items].sort((a, b) => {
    const keyA = buildSortKey(a, strategy);
    const keyB = buildSortKey(b, strategy);
    for (let index = 0; index < keyA.length; index += 1) {
      if (keyA[index] < keyB[index]) return -1;
      if (keyA[index] > keyB[index]) return 1;
    }
    return 0;
  });
};

const simulatePlan = (loans, extraMonthly = 0, strategy = 'avalanche') => {
  if (!loans.length) {
    return {
      strategy,
      months: 0,
      totalInterest: 0,
      totalPaid: 0,
      payoffOrder: [],
      monthlyTimeline: [],
    };
  }

  const activeMap = buildPaymentMap(loans);
  const payoffOrder = [];
  const monthlyTimeline = [];

  let totalInterest = 0;
  let totalPaid = 0;
  let month = 0;
  const maxMonths = 1200;

  while (month < maxMonths) {
    month += 1;

    const activeLoans = [...activeMap.values()].filter((item) => item.remainingPrincipal > 0.0001);
    if (!activeLoans.length) break;

    for (const item of activeLoans) {
      const interest = monthlyInterest(item.remainingPrincipal, item.annualRate);
      item.remainingPrincipal = normalizeMoney(item.remainingPrincipal + interest);
      totalInterest += interest;
    }

    let paidThisMonth = 0;

    for (const item of activeLoans) {
      const minimumDue = Math.max(item.emi, monthlyInterest(item.remainingPrincipal, item.annualRate) + 1);
      const payment = Math.min(item.remainingPrincipal, minimumDue);
      item.remainingPrincipal = normalizeMoney(item.remainingPrincipal - payment);
      paidThisMonth += payment;
    }

    let extraLeft = normalizeMoney(extraMonthly);
    if (extraLeft > 0) {
      while (extraLeft > 0.0001) {
        const candidates = sortCandidates(
          [...activeMap.values()].filter((item) => item.remainingPrincipal > 0.0001),
          strategy
        );

        if (!candidates.length) break;

        const target = candidates[0];
        const extraPayment = Math.min(target.remainingPrincipal, extraLeft);
        target.remainingPrincipal = normalizeMoney(target.remainingPrincipal - extraPayment);
        paidThisMonth += extraPayment;
        extraLeft = normalizeMoney(extraLeft - extraPayment);
      }
    }

    for (const item of [...activeMap.values()]) {
      if (item.remainingPrincipal <= 0.0001 && !payoffOrder.find((entry) => entry.loanId === String(item._id))) {
        item.remainingPrincipal = 0;
        payoffOrder.push({
          loanId: String(item._id),
          name: item.name,
          annualRate: item.annualRate,
          month,
        });
      }
    }

    totalPaid += paidThisMonth;
    monthlyTimeline.push({
      month,
      paidThisMonth: normalizeMoney(paidThisMonth),
      totalInterest: normalizeMoney(totalInterest),
      activeLoans: [...activeMap.values()].filter((item) => item.remainingPrincipal > 0.0001).length,
    });
  }

  return {
    strategy,
    months: month,
    totalInterest: normalizeMoney(totalInterest),
    totalPaid: normalizeMoney(totalPaid),
    payoffOrder,
    monthlyTimeline,
  };
};

const interestBurdenByLoan = (loans) => {
  return loans
    .map((loan) => {
      const simulation = simulatePlan([loan], 0, 'avalanche');
      return {
        loanId: String(loan._id),
        name: loan.name,
        lender: loan.lender,
        annualRate: loan.annualRate,
        remainingPrincipal: loan.remainingPrincipal,
        emi: loan.emi,
        projectedInterest: simulation.totalInterest,
        projectedPayoffMonths: simulation.months,
      };
    })
    .sort((a, b) => b.projectedInterest - a.projectedInterest);
};

const validateLoanPayload = (body) => {
  const name = String(body.name || '').trim();
  const lender = String(body.lender || '').trim();
  const notes = String(body.notes || '').trim();
  const annualRate = normalizeRate(body.annualRate);
  const remainingPrincipal = normalizeMoney(body.remainingPrincipal);
  const emi = normalizeMoney(body.emi);
  const tenureMonths = body.tenureMonths == null || body.tenureMonths === ''
    ? null
    : Math.max(1, Number(body.tenureMonths));

  if (!name) return { error: 'Loan name is required' };
  if (!Number.isFinite(annualRate) || annualRate < 0 || annualRate > 100) return { error: 'Annual rate must be between 0 and 100' };
  if (!Number.isFinite(remainingPrincipal) || remainingPrincipal <= 0) return { error: 'Remaining principal must be greater than zero' };
  if (!Number.isFinite(emi) || emi <= 0) return { error: 'Monthly EMI must be greater than zero' };

  return {
    payload: {
      name,
      lender,
      notes,
      annualRate,
      remainingPrincipal,
      emi,
      tenureMonths: Number.isFinite(tenureMonths) ? Math.round(tenureMonths) : null,
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
    },
  };
};

router.get('/', async (req, res) => {
  const loans = await Loan.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.json(loans);
});

router.post('/', async (req, res) => {
  const { error, payload } = validateLoanPayload(req.body || {});
  if (error) return res.status(400).json({ message: error });

  const loan = await Loan.create({ ...payload, user: req.user._id });
  return res.status(201).json(loan);
});

router.put('/:id', async (req, res) => {
  const { error, payload } = validateLoanPayload(req.body || {});
  if (error) return res.status(400).json({ message: error });

  const updated = await Loan.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    payload,
    { new: true }
  );

  if (!updated) return res.status(404).json({ message: 'Loan not found' });
  return res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const removed = await Loan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!removed) return res.status(404).json({ message: 'Loan not found' });
  return res.json({ ok: true });
});

router.get('/optimizer/summary', async (req, res) => {
  const loans = await Loan.find({ user: req.user._id }).sort({ createdAt: 1 }).lean();
  const extraMonthly = normalizeMoney(req.query.extra || 0);

  const burden = interestBurdenByLoan(loans);

  const baseline = simulatePlan(loans, 0, 'avalanche');
  const snowball = simulatePlan(loans, extraMonthly, 'snowball');
  const avalanche = simulatePlan(loans, extraMonthly, 'avalanche');

  const closeFirst = sortCandidates(
    loans.map((loan) => ({
      ...loan,
      remainingPrincipal: normalizeMoney(loan.remainingPrincipal),
      annualRate: normalizeRate(loan.annualRate),
    })),
    'avalanche'
  ).map((item, index) => ({
    rank: index + 1,
    loanId: String(item._id),
    name: item.name,
    annualRate: item.annualRate,
    remainingPrincipal: item.remainingPrincipal,
    reason: index === 0
      ? 'Highest interest pressure. Closing this first usually saves the most interest.'
      : 'Lower urgency than higher APR loans.',
  }));

  const better = avalanche.totalInterest <= snowball.totalInterest ? 'avalanche' : 'snowball';
  const interestSaved = normalizeMoney(Math.max(0, baseline.totalInterest - (better === 'avalanche' ? avalanche.totalInterest : snowball.totalInterest)));

  const recommendation = {
    preferredMethod: better,
    reasoning: better === 'avalanche'
      ? 'Avalanche minimizes total interest by attacking the highest-rate loan first.'
      : 'Snowball gives faster psychological wins by closing smaller loans first.',
    interestSaved,
    monthsSaved: Math.max(0, baseline.months - (better === 'avalanche' ? avalanche.months : snowball.months)),
  };

  return res.json({
    loans,
    extraMonthly,
    overview: {
      totalLoans: loans.length,
      totalPrincipal: normalizeMoney(loans.reduce((sum, loan) => sum + Number(loan.remainingPrincipal || 0), 0)),
      weightedAverageRate: loans.length
        ? normalizeMoney(
          loans.reduce((sum, loan) => sum + (Number(loan.annualRate || 0) * Number(loan.remainingPrincipal || 0)), 0)
            / Math.max(1, loans.reduce((sum, loan) => sum + Number(loan.remainingPrincipal || 0), 0))
        )
        : 0,
      baselineInterest: baseline.totalInterest,
      baselineMonths: baseline.months,
    },
    burden,
    closeFirst,
    strategies: {
      baseline,
      snowball,
      avalanche,
    },
    recommendation,
  });
});

module.exports = router;
