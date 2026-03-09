const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    walletType: {
      type: String,
      enum: ['travelling_wallet', 'medical_emergency_wallet', 'pocket_saver_wallet', 'personal_wallet'],
      required: true,
      default: 'travelling_wallet',
    },
    balance: { type: Number, default: 0 },
    lastWithdrawalDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wallet', walletSchema);
