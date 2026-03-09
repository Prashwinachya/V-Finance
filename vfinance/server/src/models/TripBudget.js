const mongoose = require('mongoose');

const breakdownSchema = new mongoose.Schema(
  {
    accommodation: { type: Number, default: 0 },
    transportation: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    activities: { type: Number, default: 0 },
    miscellaneous: { type: Number, default: 0 },
  },
  { _id: false }
);

const tripBudgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    budgetName: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    period: { type: String, enum: ['weekly', 'monthly', 'custom'], default: 'custom' },
    category: { type: String, default: 'Travel' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    peopleCount: { type: Number, default: 1, min: 1 },
    breakdown: { type: breakdownSchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TripBudget', tripBudgetSchema);
