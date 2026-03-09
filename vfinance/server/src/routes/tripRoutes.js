const express = require('express');
const TripBudget = require('../models/TripBudget');

const router = express.Router();

router.get('/', async (req, res) => {
  const trips = await TripBudget.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(trips);
});

router.post('/', async (req, res) => {
  const trip = await TripBudget.create({ ...req.body, user: req.user._id });
  res.status(201).json(trip);
});

router.put('/:id', async (req, res) => {
  const trip = await TripBudget.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true }
  );

  if (!trip) {
    return res.status(404).json({ message: 'Trip budget not found' });
  }

  return res.json(trip);
});

router.delete('/:id', async (req, res) => {
  const deleted = await TripBudget.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!deleted) {
    return res.status(404).json({ message: 'Trip budget not found' });
  }

  return res.json({ success: true });
});

module.exports = router;
