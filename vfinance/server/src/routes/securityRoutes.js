const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const User = require('../models/User');

const router = express.Router();

const rpName = 'VFinance';
const rpID = process.env.RP_ID || 'localhost';
const configuredOrigin = process.env.RP_ORIGIN || 'http://localhost:5173';

const getExpectedOrigins = (req) => {
  const origins = new Set([configuredOrigin]);
  const requestOrigin = req.headers.origin;

  if (process.env.NODE_ENV !== 'production' && typeof requestOrigin === 'string') {
    if (/^http:\/\/localhost:\d+$/.test(requestOrigin)) {
      origins.add(requestOrigin);
    }
  }

  return Array.from(origins);
};

const registrationChallengeByUserId = new Map();
const authenticationChallengeByUserId = new Map();

const signPaymentToken = (userId, payload) =>
  jwt.sign(
    { id: String(userId), pay: true, ...payload },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '2m' }
  );

router.get('/webauthn/register-options', async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: String(user._id),
    userName: user.email,
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred',
    },
    timeout: 60000,
  });

  registrationChallengeByUserId.set(String(user._id), options.challenge);
  return res.json(options);
});

router.post('/webauthn/register', async (req, res) => {
  const expectedChallenge = registrationChallengeByUserId.get(String(req.user._id));
  if (!expectedChallenge) return res.status(400).json({ message: 'No registration challenge found' });

  const verification = await verifyRegistrationResponse({
    response: req.body,
    expectedChallenge,
    expectedOrigin: getExpectedOrigins(req),
    expectedRPID: rpID,
  });

  if (!verification.verified) {
    return res.status(400).json({ message: 'Fingerprint registration failed' });
  }

  const { registrationInfo } = verification;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.webauthnCredentialID = registrationInfo.credentialID;
  user.webauthnCredentialPublicKey = registrationInfo.credentialPublicKey;
  user.webauthnCounter = registrationInfo.counter;
  user.fingerprintEnabled = true;
  user.requirePaymentFingerprint = true;
  await user.save();

  registrationChallengeByUserId.delete(String(req.user._id));

  return res.json({ fingerprintEnabled: true, requirePaymentFingerprint: user.requirePaymentFingerprint });
});

router.get('/webauthn/auth-options', async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (!user.fingerprintEnabled || !user.webauthnCredentialID) {
    return res.status(400).json({ message: 'Fingerprint not enabled' });
  }

  const options = await generateAuthenticationOptions({
    rpID,
    timeout: 60000,
    userVerification: 'required',
    allowCredentials: [
      {
        id: user.webauthnCredentialID,
        type: 'public-key',
      },
    ],
  });

  authenticationChallengeByUserId.set(String(req.user._id), options.challenge);
  return res.json(options);
});

router.post('/verify-payment', async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const requirePin = Boolean(user.requirePaymentPin);
  const requireFp = Boolean(user.requirePaymentFingerprint);

  let pinVerified = false;
  let fingerprintVerified = false;

  if (requirePin) {
    if (!user.paymentPinEnabled || !user.paymentPinHash) {
      return res.status(400).json({ message: 'Payment PIN is not enabled' });
    }

    const pin = String(req.body.pin || '').trim();
    if (!/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({ message: 'PIN is required' });
    }

    pinVerified = await bcrypt.compare(pin, user.paymentPinHash);
    if (!pinVerified) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }
  }

  if (requireFp) {
    if (!user.fingerprintEnabled || !user.webauthnCredentialID || !user.webauthnCredentialPublicKey) {
      return res.status(400).json({ message: 'Fingerprint is not enabled' });
    }

    const expectedChallenge = authenticationChallengeByUserId.get(String(req.user._id));
    if (!expectedChallenge) {
      return res.status(400).json({ message: 'No fingerprint challenge found' });
    }

    const verification = await verifyAuthenticationResponse({
      response: req.body.assertion,
      expectedChallenge,
      expectedOrigin: getExpectedOrigins(req),
      expectedRPID: rpID,
      authenticator: {
        credentialID: user.webauthnCredentialID,
        credentialPublicKey: user.webauthnCredentialPublicKey,
        counter: user.webauthnCounter || 0,
      },
      requireUserVerification: true,
    });

    if (!verification.verified) {
      return res.status(401).json({ message: 'Fingerprint verification failed' });
    }

    user.webauthnCounter = verification.authenticationInfo.newCounter;
    await user.save();

    authenticationChallengeByUserId.delete(String(req.user._id));
    fingerprintVerified = true;
  }

  const paymentToken = signPaymentToken(user._id, {
    pinVerified,
    fingerprintVerified,
  });

  return res.json({
    paymentToken,
    pinVerified,
    fingerprintVerified,
    expiresInSeconds: 120,
  });
});

module.exports = router;
