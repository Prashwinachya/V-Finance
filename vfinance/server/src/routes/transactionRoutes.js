const express = require('express');
const jwt = require('jsonwebtoken');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const User = require('../models/User');

const router = express.Router();

const allowedRecurrence = new Set(['none', 'daily', 'weekly', 'monthly', 'yearly']);
const userVisibleQuery = { userDeleted: { $ne: true } };

const normalizeRecurrence = (value, fallback = 'none') => {
  const normalized = String(value ?? fallback).toLowerCase();
  return allowedRecurrence.has(normalized) ? normalized : 'none';
};

const buildRecurringFields = (body, fallback = 'none') => {
  const recurrenceFromFlag = body?.isRecurring ? (body?.recurrence || fallback || 'monthly') : 'none';
  const recurrence = normalizeRecurrence(body?.recurrence ?? recurrenceFromFlag, fallback);
  return {
    recurrence,
    isRecurring: recurrence !== 'none',
  };
};

const syncWalletBalance = async (walletId, userId) => {
  if (!walletId) return;

  const transactions = await Transaction.find({ wallet: walletId, user: userId, ...userVisibleQuery });
  const balance = transactions.reduce((total, item) => {
    return item.type === 'income' ? total + item.amount : total - item.amount;
  }, 0);

  await Wallet.findOneAndUpdate({ _id: walletId, user: userId }, { balance });
};

router.get('/', async (req, res) => {
  const sort = req.query.sort === 'asc' ? 1 : -1;
  const transactions = await Transaction.find({ user: req.user._id, ...userVisibleQuery })
    .populate('wallet', 'name')
    .sort({ date: sort });

  res.json(transactions);
});

router.post('/', async (req, res) => {
  const actor = await User.findById(req.user._id).select('requirePaymentPin requirePaymentFingerprint');
  if (!actor) return res.status(404).json({ message: 'User not found' });

  const isExpense = String(req.body.type) === 'expense';
  const needsVerification = isExpense && (actor.requirePaymentPin || actor.requirePaymentFingerprint);

  if (needsVerification) {
    const token = req.headers['x-payment-token'];
    if (!token || typeof token !== 'string') {
      return res.status(403).json({ message: 'Payment verification required' });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      if (!payload || payload.pay !== true || String(payload.id) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Invalid payment verification' });
      }
      if (actor.requirePaymentPin && payload.pinVerified !== true) {
        return res.status(403).json({ message: 'PIN verification required' });
      }
      if (actor.requirePaymentFingerprint && payload.fingerprintVerified !== true) {
        return res.status(403).json({ message: 'Fingerprint verification required' });
      }
    } catch (_err) {
      return res.status(403).json({ message: 'Invalid or expired payment verification' });
    }
  }

  const payload = {
    ...req.body,
    ...buildRecurringFields(req.body),
    user: req.user._id,
  };
  const transaction = await Transaction.create(payload);
  await syncWalletBalance(transaction.wallet, req.user._id);

  res.status(201).json(transaction);
});

router.put('/:id', async (req, res) => {
  const previous = await Transaction.findOne({ _id: req.params.id, user: req.user._id, ...userVisibleQuery });

  if (!previous) {
    return res.status(404).json({ message: 'Transaction not found' });
  }

  const updatePayload = { ...req.body };
  if (Object.prototype.hasOwnProperty.call(req.body, 'recurrence') || Object.prototype.hasOwnProperty.call(req.body, 'isRecurring')) {
    Object.assign(updatePayload, buildRecurringFields(req.body, previous.recurrence || 'none'));
  }

  const updated = await Transaction.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, ...userVisibleQuery },
    updatePayload,
    { new: true }
  );

  await syncWalletBalance(previous.wallet, req.user._id);
  if (String(previous.wallet) !== String(updated.wallet)) {
    await syncWalletBalance(updated.wallet, req.user._id);
  }

  return res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const existing = await Transaction.findOne({ _id: req.params.id, user: req.user._id, ...userVisibleQuery });

  if (!existing) {
    return res.status(404).json({ message: 'Transaction not found' });
  }

  await Transaction.updateOne(
    { _id: req.params.id, user: req.user._id, ...userVisibleQuery },
    {
      $set: {
        userDeleted: true,
        userDeletedAt: new Date(),
      },
    }
  );

  return res.json({ success: true });
});

module.exports = router;
