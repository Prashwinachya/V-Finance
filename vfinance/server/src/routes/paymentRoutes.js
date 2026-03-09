const express = require('express');
const ScheduledPayment = require('../models/ScheduledPayment');
const Transaction = require('../models/Transaction');

const router = express.Router();

const normalizeMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, Math.round(amount * 100) / 100);
};

const monthKey = (date) => {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
};

const getDaysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

const dueDateForMonth = (referenceDate, dueDay) => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = Math.min(Number(dueDay || 1), getDaysInMonth(year, month));
  return new Date(year, month, day, 23, 59, 59, 999);
};

const getUserLeftoverBalance = async (userId) => {
  const transactions = await Transaction.find({
    user: userId,
    userDeleted: { $ne: true },
    $or: [{ wallet: { $exists: false } }, { wallet: null }],
  }).select('type amount');

  return transactions.reduce((sum, tx) => {
    const amount = normalizeMoney(tx.amount);
    return tx.type === 'income' ? sum + amount : sum - amount;
  }, 0);
};

const getPaymentStatus = (payment, now = new Date()) => {
  const dueDate = dueDateForMonth(now, payment.dueDay);
  const paidThisCycle = payment.lastPaidAt && monthKey(payment.lastPaidAt) === monthKey(now);

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysToDue = Math.ceil((dueDate.getTime() - now.getTime()) / millisecondsPerDay);

  if (paidThisCycle) {
    return {
      status: 'paid',
      dueDate,
      daysToDue,
      alert: false,
      message: 'Paid for current cycle',
    };
  }

  if (daysToDue < 0) {
    return {
      status: 'overdue',
      dueDate,
      daysToDue,
      alert: true,
      message: `Overdue by ${Math.abs(daysToDue)} day(s)`,
    };
  }

  const alert = daysToDue <= Number(payment.alertDaysBefore || 0);
  return {
    status: 'upcoming',
    dueDate,
    daysToDue,
    alert,
    message: alert ? `Due in ${daysToDue} day(s)` : 'Scheduled',
  };
};

const parsePayeeFromCode = (code) => {
  const raw = String(code || '').trim();
  if (!raw) return '';

  if (raw.startsWith('upi://pay')) {
    try {
      const url = new URL(raw);
      const name = url.searchParams.get('pn');
      const payeeAddress = url.searchParams.get('pa');
      return String(name || payeeAddress || 'QR Payee').trim();
    } catch (_error) {
      return 'QR Payee';
    }
  }

  if (raw.includes('@')) return raw.split('?')[0].slice(0, 60);

  return raw.slice(0, 60);
};

const buildPayload = (body) => {
  const title = String(body.title || '').trim();
  const payee = String(body.payee || '').trim();
  const kind = String(body.kind || 'subscription');
  const amount = normalizeMoney(body.amount);
  const dueDay = Number(body.dueDay || 1);
  const alertDaysBefore = Number(body.alertDaysBefore ?? 3);
  const notes = String(body.notes || '').trim();
  const isActive = body.isActive !== false;

  if (!title) return { error: 'Payment title is required' };
  if (!['subscription', 'loan_repayment', 'bill', 'other'].includes(kind)) return { error: 'Invalid payment type' };
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Amount should be greater than zero' };
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) return { error: 'Due day must be between 1 and 31' };
  if (!Number.isInteger(alertDaysBefore) || alertDaysBefore < 0 || alertDaysBefore > 15) return { error: 'Alert days should be between 0 and 15' };

  return {
    payload: {
      title,
      payee,
      kind,
      amount,
      dueDay,
      alertDaysBefore,
      notes,
      isActive,
    },
  };
};

router.get('/overview', async (req, res) => {
  const now = new Date();
  const [payments, leftoverBalance] = await Promise.all([
    ScheduledPayment.find({ user: req.user._id, isActive: true }).sort({ dueDay: 1, createdAt: -1 }),
    getUserLeftoverBalance(req.user._id),
  ]);

  const decorated = payments.map((item) => {
    const meta = getPaymentStatus(item, now);
    return {
      ...item.toObject(),
      ...meta,
    };
  });

  const alerts = decorated.filter((item) => item.alert);
  const monthlyOutflow = decorated.reduce((sum, item) => sum + normalizeMoney(item.amount), 0);

  return res.json({
    leftoverBalance: normalizeMoney(leftoverBalance),
    summary: {
      totalScheduled: decorated.length,
      alertCount: alerts.length,
      overdueCount: decorated.filter((item) => item.status === 'overdue').length,
      monthlyOutflow: normalizeMoney(monthlyOutflow),
    },
    payments: decorated,
  });
});

router.get('/', async (req, res) => {
  const items = await ScheduledPayment.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.json(items);
});

router.post('/', async (req, res) => {
  const { error, payload } = buildPayload(req.body || {});
  if (error) return res.status(400).json({ message: error });

  const created = await ScheduledPayment.create({ ...payload, user: req.user._id });
  return res.status(201).json(created);
});

router.put('/:id', async (req, res) => {
  const { error, payload } = buildPayload(req.body || {});
  if (error) return res.status(400).json({ message: error });

  const updated = await ScheduledPayment.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    payload,
    { new: true }
  );

  if (!updated) return res.status(404).json({ message: 'Scheduled payment not found' });
  return res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const removed = await ScheduledPayment.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!removed) return res.status(404).json({ message: 'Scheduled payment not found' });
  return res.json({ ok: true });
});

router.post('/:id/pay-now', async (req, res) => {
  const payment = await ScheduledPayment.findOne({ _id: req.params.id, user: req.user._id });
  if (!payment) return res.status(404).json({ message: 'Scheduled payment not found' });

  const amount = normalizeMoney(req.body?.amount || payment.amount);
  if (amount <= 0) return res.status(400).json({ message: 'Amount should be greater than zero' });

  const leftover = await getUserLeftoverBalance(req.user._id);
  if (leftover < amount) {
    return res.status(400).json({ message: 'Insufficient leftover balance in account' });
  }

  const kindLabel = payment.kind === 'loan_repayment' ? 'Loan Repayment' : 'Subscription Payment';
  const title = `${kindLabel} • ${payment.title}`;

  await Transaction.create({
    user: req.user._id,
    title,
    category: 'Payments',
    type: 'expense',
    transactionType: 'debit',
    amount,
    date: new Date(),
    timestamp: new Date(),
  });

  payment.lastPaidAt = new Date();
  await payment.save();

  return res.json({
    ok: true,
    message: 'Payment completed',
    payment,
    leftoverBalance: normalizeMoney(leftover - amount),
  });
});

router.post('/scan-pay', async (req, res) => {
  const code = String(req.body?.code || '').trim();
  const amount = normalizeMoney(req.body?.amount);

  if (!code) return res.status(400).json({ message: 'Scanned code is required' });
  if (amount <= 0) return res.status(400).json({ message: 'Amount should be greater than zero' });

  const leftover = await getUserLeftoverBalance(req.user._id);
  if (leftover < amount) {
    return res.status(400).json({ message: 'Insufficient leftover balance in account' });
  }

  const payee = parsePayeeFromCode(code) || 'Scan Pay Recipient';

  const transaction = await Transaction.create({
    user: req.user._id,
    title: `Scan Pay • ${payee}`,
    category: 'Payments',
    type: 'expense',
    transactionType: 'debit',
    amount,
    date: new Date(),
    timestamp: new Date(),
  });

  return res.json({
    ok: true,
    message: 'Scan payment completed',
    payee,
    transaction,
    leftoverBalance: normalizeMoney(leftover - amount),
  });
});

module.exports = router;
