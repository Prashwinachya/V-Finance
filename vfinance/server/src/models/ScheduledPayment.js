const mongoose = require('mongoose');

const scheduledPaymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 90 },
    payee: { type: String, default: '', trim: true, maxlength: 90 },
    kind: {
      type: String,
      enum: ['subscription', 'loan_repayment', 'bill', 'other'],
      default: 'subscription',
    },
    amount: { type: Number, required: true, min: 0 },
    dueDay: { type: Number, required: true, min: 1, max: 31 },
    alertDaysBefore: { type: Number, default: 3, min: 0, max: 15 },
    notes: { type: String, default: '', trim: true, maxlength: 240 },
    isActive: { type: Boolean, default: true },
    lastPaidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ScheduledPayment', scheduledPaymentSchema);
