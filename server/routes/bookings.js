const r = require('express').Router(), crypto = require('crypto');
const { Bus, Booking } = require('../models'), { auth } = require('../middleware'), { genSeats, sendTicket } = require('../utils');
const rz = () => process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new (require('razorpay'))({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET }) : null;

// Step 1: hold seats (10 min) and create a payment order
r.post('/hold', auth, async (req, res) => {
  const { busId, date, passengers, boarding, dropping } = req.body;
  const bus = await Bus.findById(busId); if (!bus) return res.status(404).json({ message: 'Bus not found' });
  if (!passengers?.length || passengers.length > 6) return res.status(400).json({ message: 'Choose 1 to 6 seats' });
  const all = genSeats(bus.layout), busy = (await Booking.find({ bus: busId, date, $or: [{ status: 'confirmed' },
    { status: 'pending', createdAt: { $gt: new Date(Date.now() - 10 * 60000) } }] })).flatMap(b => b.passengers.map(p => p.seat));
  let amount = 0;
  for (const p of passengers) {
    const s = all.find(x => x.id === p.seat);
    if (!s) return res.status(400).json({ message: 'Invalid seat ' + p.seat });
    if (busy.includes(p.seat)) return res.status(409).json({ message: `Seat ${p.seat} was just taken. Pick another.` });
    if (bus.womenSeats.includes(p.seat) && p.gender !== 'female') return res.status(400).json({ message: `Seat ${p.seat} is reserved for women` });
    if (!p.name || !p.age) return res.status(400).json({ message: 'Fill name and age for every passenger' });
    amount += s.deck === 'upper' && bus.upperFare ? bus.upperFare : bus.fare;
  }
  const b = await Booking.create({ user: req.user._id, bus: busId, date, passengers, boarding, dropping, amount });
  const inst = rz();
  if (!inst) return res.json({ booking: b, mock: true });
  const order = await inst.orders.create({ amount: amount * 100, currency: 'INR', receipt: b.id });
  b.orderId = order.id; await b.save();
  res.json({ booking: b, order, key: process.env.RAZORPAY_KEY_ID });
});

// Step 2: verify payment signature, confirm, send ticket
r.post('/verify', auth, async (req, res) => {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const b = await Booking.findOne({ _id: bookingId, user: req.user._id }); if (!b) return res.status(404).json({ message: 'Booking not found' });
  if (rz()) {
    const sig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex');
    if (sig !== razorpay_signature) return res.status(400).json({ message: 'Payment verification failed' });
    b.paymentId = razorpay_payment_id;
  } else b.paymentId = 'MOCK-' + Date.now();
  b.status = 'confirmed'; await b.save();
  sendTicket(req.user, b, await Bus.findById(b.bus));
  res.json(b);
});

r.get('/mine', auth, async (req, res) => res.json(await Booking.find({ user: req.user._id, status: { $ne: 'pending' } }).populate('bus').sort('-createdAt')));
r.post('/:id/cancel', auth, async (req, res) => {
  const b = await Booking.findOneAndUpdate({ _id: req.params.id, user: req.user._id, status: 'confirmed' }, { status: 'cancelled' }, { new: true });
  b ? res.json(b) : res.status(400).json({ message: 'Cannot cancel this booking' });
});
module.exports = r;
