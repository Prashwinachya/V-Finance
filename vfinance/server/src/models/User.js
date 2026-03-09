const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'admin', 'super_admin'], default: 'user' },
    lastLoginAt: { type: Date, default: null },
    loginCount: { type: Number, default: 0 },

    avatarUrl: { type: String, default: '' },

    requirePaymentPin: { type: Boolean, default: false },
    requirePaymentFingerprint: { type: Boolean, default: false },

    paymentPinEnabled: { type: Boolean, default: false },
    paymentPinHash: { type: String, default: '' },

    fingerprintEnabled: { type: Boolean, default: false },
    webauthnCredentialID: { type: Buffer },
    webauthnCredentialPublicKey: { type: Buffer },
    webauthnCounter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(rawPassword) {
  return bcrypt.compare(rawPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
