const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const TripBudget = require('../models/TripBudget');

const router = express.Router();

const SUPER_ADMIN_EMAIL = String(process.env.SUPER_ADMIN_EMAIL || 'vaishnavi@icloud.com').toLowerCase();
const isSuperAdminUser = (user) =>
  Boolean(user) && (user.role === 'super_admin' || String(user.email || '').toLowerCase() === SUPER_ADMIN_EMAIL);
const isSuperAdminTarget = (targetUser) =>
  Boolean(targetUser) && (targetUser.role === 'super_admin' || String(targetUser.email || '').toLowerCase() === SUPER_ADMIN_EMAIL);

router.get('/stats', async (_req, res) => {
  const [totalUsers, adminUsers, totalTransactions, totalBudgets] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: { $in: ['admin', 'super_admin'] } }),
    Transaction.countDocuments(),
    TripBudget.countDocuments(),
  ]);

  res.json({ totalUsers, adminUsers, totalTransactions, totalBudgets });
});

router.get('/users', async (_req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();

  const [txCounts, budgetCounts] = await Promise.all([
    Transaction.aggregate([{ $group: { _id: '$user', count: { $sum: 1 } } }]),
    TripBudget.aggregate([{ $group: { _id: '$user', count: { $sum: 1 } } }]),
  ]);

  const txMap = new Map(txCounts.map((row) => [String(row._id), row.count]));
  const budgetMap = new Map(budgetCounts.map((row) => [String(row._id), row.count]));

  res.json(
    users.map((user) => ({
      ...user,
      transactionsCount: txMap.get(String(user._id)) || 0,
      budgetsCount: budgetMap.get(String(user._id)) || 0,
    }))
  );
});

router.patch('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;

  if (String(req.user?._id) === String(id) && role && role !== req.user.role) {
    return res.status(400).json({ message: 'Cannot change your own role' });
  }

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const requesterIsSuperAdmin = isSuperAdminUser(req.user);
  const targetIsSuperAdmin = isSuperAdminTarget(user);
  const hasRoleUpdate = typeof role === 'string' && role.length > 0;

  if (targetIsSuperAdmin && hasRoleUpdate && role !== user.role) {
    return res.status(403).json({ message: 'Cannot change Super Admin role' });
  }

  if (hasRoleUpdate) {
    if (!requesterIsSuperAdmin) {
      return res.status(403).json({ message: 'Only Super Admin can change roles' });
    }

    if (role === 'super_admin') {
      return res.status(400).json({ message: 'Cannot assign Super Admin role' });
    }
  }

  if (email && String(email).toLowerCase() !== user.email) {
    if (targetIsSuperAdmin) {
      return res.status(403).json({ message: 'Super Admin email is locked' });
    }
    const exists = await User.findOne({ email: String(email).toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Email already exists' });
    user.email = String(email).toLowerCase();
  }

  if (name) user.name = String(name);

  if (hasRoleUpdate) {
    user.role = role === 'admin' ? 'admin' : 'user';
  }

  await user.save();

  const [transactionsCount, budgetsCount] = await Promise.all([
    Transaction.countDocuments({ user: user._id }),
    TripBudget.countDocuments({ user: user._id }),
  ]);

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
    loginCount: user.loginCount,
    transactionsCount,
    budgetsCount,
  });
});

router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  if (String(req.user?._id) === String(id)) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (isSuperAdminTarget(user)) {
    return res.status(403).json({ message: 'Cannot delete Super Admin account' });
  }

  await Promise.all([
    Transaction.deleteMany({ user: id }),
    TripBudget.deleteMany({ user: id }),
  ]);

  await user.deleteOne();
  res.json({ ok: true });
});

router.post('/users', async (req, res) => {
  const { name, email, password, role } = req.body;

  const requesterIsSuperAdmin = isSuperAdminUser(req.user);

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  const normalizedEmail = String(email).toLowerCase();

  if (normalizedEmail === SUPER_ADMIN_EMAIL) {
    return res.status(403).json({ message: 'Cannot create Super Admin account' });
  }

  if (role === 'admin' && !requesterIsSuperAdmin) {
    return res.status(403).json({ message: 'Only Super Admin can create admins' });
  }

  if (role === 'super_admin') {
    return res.status(400).json({ message: 'Cannot assign Super Admin role' });
  }

  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: role === 'admin' ? 'admin' : 'user',
  });
  return res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
});

router.get('/transactions', async (_req, res) => {
  const transactions = await Transaction.find().populate('user', 'name email').sort({ date: -1 });
  res.json(transactions);
});

router.get('/budgets', async (_req, res) => {
  const budgets = await TripBudget.find().populate('user', 'name email').sort({ createdAt: -1 });
  res.json(budgets);
});

module.exports = router;
