const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    transactionType: { type: String, enum: ['credit', 'debit'], default: null },
    isRecurring: { type: Boolean, default: false },
    recurrence: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'none',
    },
    userDeleted: { type: Boolean, default: false },
    userDeletedAt: { type: Date, default: null },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
