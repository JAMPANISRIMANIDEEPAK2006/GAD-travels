const r = require('express').Router(), { Review, Booking, Bus } = require('../models'), { auth } = require('../middleware');
r.get('/:busId', async (req, res) => res.json(await Review.find({ bus: req.params.busId }).populate('user', 'name').sort('-createdAt')));
r.post('/', auth, async (req, res) => {
  const { busId, rating, comment } = req.body;
  if (!(await Booking.exists({ user: req.user._id, bus: busId, status: 'confirmed' }))) return res.status(403).json({ message: 'Only passengers who booked this bus can review it' });
  await Review.findOneAndUpdate({ user: req.user._id, bus: busId }, { rating, comment }, { upsert: true });
  const all = await Review.find({ bus: busId });
  await Bus.findByIdAndUpdate(busId, { rating: +(all.reduce((a, x) => a + x.rating, 0) / all.length).toFixed(1), ratingCount: all.length });
  res.json({ ok: true });
});
module.exports = r;
