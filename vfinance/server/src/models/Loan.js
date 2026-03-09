const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    lender: { type: String, default: '', trim: true, maxlength: 80 },
    annualRate: { type: Number, required: true, min: 0, max: 100 },
    remainingPrincipal: { type: Number, required: true, min: 0 },
    emi: { type: Number, required: true, min: 0 },
    startDate: { type: Date, default: Date.now },
    tenureMonths: { type: Number, default: null, min: 1 },
    notes: { type: String, default: '', trim: true, maxlength: 240 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Loan', loanSchema);
