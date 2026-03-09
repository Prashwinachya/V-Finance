const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require('../models/User');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
    cb(null, `avatar_${String(req.user._id)}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
});

router.put('/profile', async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ message: 'Name is required' });

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.name = name;
  await user.save();

  return res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      requirePaymentPin: user.requirePaymentPin,
      requirePaymentFingerprint: user.requirePaymentFingerprint,
      paymentPinEnabled: user.paymentPinEnabled,
      fingerprintEnabled: user.fingerprintEnabled,
      lastLoginAt: user.lastLoginAt,
      loginCount: user.loginCount,
    },
  });
});

router.post('/avatar', upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Avatar file is required' });

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.avatarUrl = `/uploads/${req.file.filename}`;
  await user.save();

  return res.json({ avatarUrl: user.avatarUrl });
});

router.put('/password', async (req, res) => {
  const currentPassword = String(req.body.currentPassword || '');
  const newPassword = String(req.body.newPassword || '');

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const ok = await user.comparePassword(currentPassword);
  if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });

  user.password = newPassword;
  await user.save();

  return res.json({ ok: true });
});

router.put('/security', async (req, res) => {
  const requirePaymentPin = Boolean(req.body.requirePaymentPin);
  const requirePaymentFingerprint = Boolean(req.body.requirePaymentFingerprint);

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Cannot require PIN/fingerprint unless enabled.
  if (requirePaymentPin && !user.paymentPinEnabled) {
    return res.status(400).json({ message: 'Enable a payment PIN before requiring it' });
  }

  if (requirePaymentFingerprint && !user.fingerprintEnabled) {
    return res.status(400).json({ message: 'Enable fingerprint before requiring it' });
  }

  user.requirePaymentPin = requirePaymentPin;
  user.requirePaymentFingerprint = requirePaymentFingerprint;
  await user.save();

  return res.json({
    requirePaymentPin: user.requirePaymentPin,
    requirePaymentFingerprint: user.requirePaymentFingerprint,
    paymentPinEnabled: user.paymentPinEnabled,
    fingerprintEnabled: user.fingerprintEnabled,
  });
});

router.put('/pin', async (req, res) => {
  const pin = String(req.body.pin || '').trim();
  const confirmPin = String(req.body.confirmPin || '').trim();

  if (!pin || !confirmPin) return res.status(400).json({ message: 'PIN and confirm PIN are required' });
  if (pin !== confirmPin) return res.status(400).json({ message: 'PINs do not match' });
  if (!/^\d{4,6}$/.test(pin)) return res.status(400).json({ message: 'PIN must be 4 to 6 digits' });

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.paymentPinHash = await bcrypt.hash(pin, 10);
  user.paymentPinEnabled = true;
  user.requirePaymentPin = true;
  await user.save();

  return res.json({ paymentPinEnabled: true, requirePaymentPin: user.requirePaymentPin });
});

module.exports = router;
