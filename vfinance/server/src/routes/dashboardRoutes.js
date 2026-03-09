const express = require('express');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');

const router = express.Router();

router.get('/', async (req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 });
  const visibleTransactions = transactions.filter((item) => item.userDeleted !== true);
  const nonWalletTransactions = transactions.filter((item) => !item.wallet);
  const monthlyTransactions = nonWalletTransactions.filter((item) => new Date(item.date) >= monthStart);

  const totalIncome = nonWalletTransactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpenses = nonWalletTransactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  const monthlyIncome = monthlyTransactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);

  const monthlyExpenses = monthlyTransactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const previousMonthNet = nonWalletTransactions
    .filter((item) => {
      const date = new Date(item.date);
      return date >= previousMonthStart && date <= previousMonthEnd;
    })
    .reduce((sum, item) => sum + (item.type === 'income' ? item.amount : -item.amount), 0);

  const currentMonthNet = monthlyIncome - monthlyExpenses;
  const trendPercentage = previousMonthNet === 0
    ? 100
    : ((currentMonthNet - previousMonthNet) / Math.abs(previousMonthNet)) * 100;

  const wallets = await Wallet.find({ user: req.user._id });
  const walletSavings = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  const categoryAgg = await Transaction.aggregate([
    {
      $match: {
        user: req.user._id,
        type: 'expense',
        $or: [{ wallet: { $exists: false } }, { wallet: null }],
      },
    },
    { $group: { _id: '$category', value: { $sum: '$amount' } } },
  ]);

  const monthlyAgg = await Transaction.aggregate([
    {
      $match: {
        user: req.user._id,
        $or: [{ wallet: { $exists: false } }, { wallet: null }],
      },
    },
    {
      $group: {
        _id: {
          month: { $month: '$date' },
          year: { $year: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const monthMap = {};
  monthlyAgg.forEach((entry) => {
    const key = `${entry._id.year}-${entry._id.month}`;
    if (!monthMap[key]) {
      monthMap[key] = {
        month: new Date(entry._id.year, entry._id.month - 1).toLocaleString('en-IN', {
          month: 'short',
        }),
        income: 0,
        expense: 0,
      };
    }

    monthMap[key][entry._id.type] = entry.total;
  });

  res.json({
    totalBalance: totalIncome - totalExpenses,
    monthlyIncome,
    monthlyExpenses,
    totalIncome,
    totalExpenses,
    trendPercentage,
    walletSavings,
    recentTransactions: visibleTransactions.slice(0, 5),
    categoryData: categoryAgg.map((entry) => ({ name: entry._id, value: entry.value })),
    monthlyOverview: Object.values(monthMap).slice(-6),
  });
});

module.exports = router;
