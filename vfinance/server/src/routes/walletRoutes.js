const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const router = express.Router();

const MAX_WALLETS_PER_USER = 3;
const POCKET_SAVER_LOCK_DAYS = 14;
const walletTypeSet = new Set(['travelling_wallet', 'medical_emergency_wallet', 'pocket_saver_wallet']);

const walletTypeDefaultName = {
  travelling_wallet: 'Travelling Wallet',
  medical_emergency_wallet: 'Medical Emergency Wallet',
  pocket_saver_wallet: 'Pocket Saver Wallet',
};

const normalizeWalletType = (walletType) => {
  if (walletType === 'personal_wallet') return 'travelling_wallet';
  return walletType;
};

const getWalletNameByType = (walletType) => walletTypeDefaultName[normalizeWalletType(walletType)] || 'Travelling Wallet';

const inferWalletTypeFromName = (name = '') => {
  const value = String(name).toLowerCase();
  if (/(medical|emergency|health|hospital)/.test(value)) return 'medical_emergency_wallet';
  if (/(pocket|saver|save|piggy)/.test(value)) return 'pocket_saver_wallet';
  if (/(travel|trip|journey|tour)/.test(value)) return 'travelling_wallet';
  return null;
};

const ensureUserWalletTypes = async (userId) => {
  const wallets = await Wallet.find({ user: userId }).sort({ createdAt: 1 });
  if (!wallets.length) return wallets;

  const requiredTypes = ['travelling_wallet', 'medical_emergency_wallet', 'pocket_saver_wallet'];
  const assignedIds = new Set();
  const assignments = new Map();

  for (const type of requiredTypes) {
    const matched = wallets.find((wallet) => !assignedIds.has(String(wallet._id)) && inferWalletTypeFromName(wallet.name) === type);
    if (matched) {
      assignedIds.add(String(matched._id));
      assignments.set(String(matched._id), type);
    }
  }

  const remainingWallets = wallets.filter((wallet) => !assignedIds.has(String(wallet._id)));
  const missingTypes = requiredTypes.filter((type) => ![...assignments.values()].includes(type));

  for (let index = 0; index < remainingWallets.length; index += 1) {
    const wallet = remainingWallets[index];
    const fallbackType = missingTypes[index] || 'travelling_wallet';
    assignments.set(String(wallet._id), fallbackType);
  }

  const updates = wallets
    .filter((wallet) => {
      const assignedType = assignments.get(String(wallet._id));
      const expectedName = getWalletNameByType(assignedType);
      return normalizeWalletType(wallet.walletType) !== assignedType || String(wallet.name || '').trim() !== expectedName;
    })
    .map((wallet) => ({
      updateOne: {
        filter: { _id: wallet._id },
        update: {
          $set: {
            walletType: assignments.get(String(wallet._id)),
            name: getWalletNameByType(assignments.get(String(wallet._id))),
          },
        },
      },
    }));

  if (updates.length) {
    await Wallet.bulkWrite(updates);
    return Wallet.find({ user: userId }).sort({ createdAt: -1 });
  }

  return wallets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const isValidMoney = (value) => Number.isFinite(value) && value > 0;

const normalizeWalletDescription = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 80);
};

const getUserLeftoverBalance = async (userId, session = null) => {
  const query = Transaction.find({ user: userId }).select('type amount');
  if (session) query.session(session);

  const transactions = await query;
  return transactions.reduce((sum, item) => (item.type === 'income' ? sum + Number(item.amount || 0) : sum - Number(item.amount || 0)), 0);
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const nextPocketSaverEligibleDate = (wallet) => {
  if (wallet.walletType !== 'pocket_saver_wallet' || !wallet.lastWithdrawalDate) return null;
  return addDays(wallet.lastWithdrawalDate, POCKET_SAVER_LOCK_DAYS);
};

const toWalletResponse = (wallet, metrics = null) => {
  const nextEligible = nextPocketSaverEligibleDate(wallet);
  const canWithdrawNow = !nextEligible || nextEligible <= new Date();
  const normalizedType = normalizeWalletType(wallet.walletType);

  return {
    ...wallet.toObject(),
    walletType: normalizedType,
    canWithdrawNow,
    nextEligibleWithdrawalDate: nextEligible,
    totalCredits: Number(metrics?.totalCredits || 0),
    totalDebits: Number(metrics?.totalDebits || 0),
    transactionsCount: Number(metrics?.transactionsCount || 0),
  };
};

const buildWalletMetricsMap = async (userId, walletIds) => {
  if (!walletIds.length) return {};

  const totals = await Transaction.aggregate([
    { $match: { user: userId, wallet: { $in: walletIds } } },
    {
      $group: {
        _id: '$wallet',
        totalCredits: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $eq: ['$transactionType', 'credit'] },
                  { $and: [{ $eq: ['$transactionType', null] }, { $eq: ['$type', 'income'] }] },
                ],
              },
              '$amount',
              0,
            ],
          },
        },
        totalDebits: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $eq: ['$transactionType', 'debit'] },
                  { $and: [{ $eq: ['$transactionType', null] }, { $eq: ['$type', 'expense'] }] },
                ],
              },
              '$amount',
              0,
            ],
          },
        },
        transactionsCount: { $sum: 1 },
      },
    },
  ]);

  return Object.fromEntries(totals.map((entry) => [String(entry._id), entry]));
};

const runWithAtomicSession = async (operation) => {
  const session = await mongoose.startSession();

  try {
    let output = null;
    await session.withTransaction(async () => {
      output = await operation(session);
    });
    return output;
  } catch (error) {
    const message = String(error?.message || '');
    const transactionUnsupported =
      message.includes('Transaction numbers are only allowed')
      || message.includes('does not support transactions');

    if (transactionUnsupported) {
      return operation(null);
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

router.get('/', async (req, res) => {
  const wallets = await ensureUserWalletTypes(req.user._id);

  const walletIds = wallets.map((wallet) => wallet._id);
  const metricsMap = await buildWalletMetricsMap(req.user._id, walletIds);
  const response = wallets.map((wallet) => toWalletResponse(wallet, metricsMap[String(wallet._id)]));

  res.json(response);
});

router.post('/', async (req, res) => {
  const walletType = normalizeWalletType(String(req.body.walletType || '').trim());
  const openingBalance = Number(req.body.balance || 0);

  if (!walletTypeSet.has(walletType)) {
    return res.status(400).json({ message: 'Invalid wallet type selected' });
  }

  if (openingBalance < 0 || !Number.isFinite(openingBalance)) {
    return res.status(400).json({ message: 'Invalid opening balance' });
  }

  const currentCount = await Wallet.countDocuments({ user: req.user._id });
  if (currentCount >= MAX_WALLETS_PER_USER) {
    return res.status(400).json({ message: 'Maximum 3 wallets allowed per user' });
  }

  const existingWallets = await Wallet.find({ user: req.user._id }).select('walletType');
  const existingTypes = new Set(existingWallets.map((item) => normalizeWalletType(item.walletType)));
  if (existingTypes.has(walletType)) {
    return res.status(400).json({ message: 'Only one wallet is allowed for each type' });
  }

  const wallet = await Wallet.create({
    user: req.user._id,
    name: getWalletNameByType(walletType),
    walletType,
    balance: openingBalance,
  });

  if (openingBalance > 0) {
    await Transaction.create({
      user: req.user._id,
      wallet: wallet._id,
      title: 'Wallet Opening Balance',
      category: 'Wallet',
      type: 'income',
      transactionType: 'credit',
      amount: openingBalance,
      date: new Date(),
      timestamp: new Date(),
    });
  }

  res.status(201).json(toWalletResponse(wallet));
});

router.put('/:id', async (req, res) => {
  const wallet = await Wallet.findOne({ _id: req.params.id, user: req.user._id });

  if (!wallet) {
    return res.status(404).json({ message: 'Wallet not found' });
  }

  return res.status(400).json({ message: 'Wallet names are fixed by type and cannot be changed' });
});

router.get('/:id', async (req, res) => {
  await ensureUserWalletTypes(req.user._id);
  const wallet = await Wallet.findOne({ _id: req.params.id, user: req.user._id });

  if (!wallet) {
    return res.status(404).json({ message: 'Wallet not found' });
  }

  const transactions = await Transaction.find({
    wallet: wallet._id,
    user: req.user._id,
    userDeleted: { $ne: true },
  }).sort({ date: -1 });
  const metricsMap = await buildWalletMetricsMap(req.user._id, [wallet._id]);
  return res.json({
    wallet: toWalletResponse(wallet, metricsMap[String(wallet._id)]),
    transactions,
  });
});

router.post('/:id/add-money', async (req, res) => {
  const amount = Number(req.body.amount || 0);
  if (!isValidMoney(amount)) {
    return res.status(400).json({ message: 'Amount should be greater than zero' });
  }
  const description = normalizeWalletDescription(req.body.description);

  const now = new Date();

  try {
    const result = await runWithAtomicSession(async (session) => {
      const leftoverBalance = await getUserLeftoverBalance(req.user._id, session);
      if (leftoverBalance < amount) {
        throw new Error('INSUFFICIENT_LEFTOVER_BALANCE');
      }

      const query = Wallet.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { $inc: { balance: amount } },
        { new: true }
      );

      if (session) query.session(session);

      const wallet = await query;
      if (!wallet) {
        throw new Error('WALLET_NOT_FOUND');
      }

      const txPayload = {
        user: req.user._id,
        wallet: wallet._id,
        title: description ? `Wallet Top-up • ${description}` : 'Wallet Top-up',
        category: 'Wallet',
        type: 'income',
        transactionType: 'credit',
        amount,
        date: now,
        timestamp: now,
      };

      const sourceDebitPayload = {
        user: req.user._id,
        title: description ? `Wallet Funding Transfer • ${description}` : 'Wallet Funding Transfer',
        category: 'Wallet Transfer',
        type: 'expense',
        transactionType: 'debit',
        amount,
        date: now,
        timestamp: now,
      };

      if (session) {
        await Transaction.create([txPayload, sourceDebitPayload], { session });
      } else {
        await Transaction.create(txPayload);
        await Transaction.create(sourceDebitPayload);
      }

      return wallet;
    });

    return res.json(toWalletResponse(result));
  } catch (error) {
    if (String(error.message) === 'INSUFFICIENT_LEFTOVER_BALANCE') {
      return res.status(400).json({ message: 'Not enough leftover balance after expenses to fund this wallet' });
    }
    if (String(error.message) === 'WALLET_NOT_FOUND') {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    return res.status(500).json({ message: 'Unable to add money right now' });
  }
});

router.post('/:id/withdraw-money', async (req, res) => {
  const actor = await User.findById(req.user._id).select('requirePaymentPin requirePaymentFingerprint');
  if (!actor) return res.status(404).json({ message: 'User not found' });

  const needsVerification = actor.requirePaymentPin || actor.requirePaymentFingerprint;
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

  const amount = Number(req.body.amount || 0);
  if (!isValidMoney(amount)) {
    return res.status(400).json({ message: 'Amount should be greater than zero' });
  }
  const description = normalizeWalletDescription(req.body.description);

  const now = new Date();
  const pocketSaverCutoff = addDays(now, -POCKET_SAVER_LOCK_DAYS);

  try {
    const baseWalletQuery = Wallet.findOne({ _id: req.params.id, user: req.user._id });
    const walletBase = await baseWalletQuery;
    if (!walletBase) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    let result = null;

    if (walletBase.walletType === 'pocket_saver_wallet') {
      const query = Wallet.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user._id,
          walletType: 'pocket_saver_wallet',
          balance: { $gte: amount },
          $or: [
            { lastWithdrawalDate: null },
            { lastWithdrawalDate: { $lte: pocketSaverCutoff } },
          ],
        },
        {
          $inc: { balance: -amount },
          $set: { lastWithdrawalDate: now },
        },
        { new: true }
      );

      result = await query;
    } else {
      const query = Wallet.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user._id,
          walletType: { $in: ['travelling_wallet', 'personal_wallet', 'medical_emergency_wallet'] },
          balance: { $gte: amount },
        },
        {
          $inc: { balance: -amount },
        },
        { new: true }
      );

      result = await query;
    }

    if (!result) {
      throw new Error('WITHDRAW_BLOCKED');
    }

    await Transaction.create({
      user: req.user._id,
      wallet: result._id,
      title: description ? `Wallet Withdrawal • ${description}` : 'Wallet Withdrawal',
      category: 'Wallet',
      type: 'expense',
      transactionType: 'debit',
      amount,
      date: now,
      timestamp: now,
    });

    return res.json(toWalletResponse(result));
  } catch (error) {
    if (String(error.message) !== 'WITHDRAW_BLOCKED') {
      return res.status(500).json({ message: 'Unable to withdraw right now' });
    }

    const wallet = await Wallet.findOne({ _id: req.params.id, user: req.user._id });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    if (wallet.walletType === 'pocket_saver_wallet') {
      const nextEligibleDate = nextPocketSaverEligibleDate(wallet);
      if (nextEligibleDate && nextEligibleDate > now) {
        const formatted = nextEligibleDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        return res.status(400).json({
          message: `Withdrawal not allowed. Next eligible withdrawal on ${formatted}.`,
          nextEligibleWithdrawalDate: nextEligibleDate,
        });
      }
    }

    return res.status(400).json({ message: 'Withdrawal not allowed right now' });
  }
});

module.exports = router;
