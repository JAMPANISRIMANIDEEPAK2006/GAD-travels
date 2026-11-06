const r = require('express').Router(), { Bus, Booking } = require('../models');
const { auth, admin } = require('../middleware'), { genSeats, route, geocode, ensureBuses, title } = require('../utils');
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const taken = async (bus, date) => (await Booking.find({ bus, date, $or: [{ status: 'confirmed' },
  { status: 'pending', createdAt: { $gt: new Date(Date.now() - 10 * 60000) } }] })).flatMap(b => b.passengers.map(p => p.seat));

r.get('/cities', async (req, res) => res.json([...new Set([...await Bus.distinct('fromLoc.name'), ...await Bus.distinct('toLoc.name')])].sort()));

r.get('/search', async (req, res) => {
  const { from = '', to = '', date } = req.query, rx = k => new RegExp('^' + esc(k.trim()) + '$', 'i');
  const find = () => Bus.find({ 'fromLoc.name': rx(from), 'toLoc.name': rx(to) }).lean();
  let buses = await find();
  if (!buses.length && from.trim() && to.trim() && from.trim().toLowerCase() !== to.trim().toLowerCase()) {
    const pt = (n, lat, lng) => lat && lng ? { name: title(n), lat: +lat, lng: +lng } : geocode(n);
    const A = await pt(from, req.query.fromLat, req.query.fromLng), B = await pt(to, req.query.toLat, req.query.toLng);
    if (!A || !B) return res.json({ buses: [], route: null, error: 'Could not find one of these places in India' });
    await ensureBuses(Bus, A, B); buses = await find();
  }
  for (const b of buses) b.free = genSeats(b.layout).length - (await taken(b._id, date)).length;
  const x = buses[0] ? await route(buses[0].fromLoc, buses[0].toLoc) : null;
  res.json({ buses, route: x && { km: x.km, min: x.min, coords: x.coords, source: x.source, from: buses[0].fromLoc, to: buses[0].toLoc } });
});
r.get('/', auth, admin, async (req, res) => res.json(await Bus.find().sort('-createdAt')));

r.get('/:id', async (req, res) => {
  const bus = await Bus.findById(req.params.id).lean(); if (!bus) return res.status(404).json({ message: 'Bus not found' });
  const t = await taken(bus._id, req.query.date);
  bus.seats = genSeats(bus.layout).map(s => ({ ...s, booked: t.includes(s.id), women: bus.womenSeats.includes(s.id),
    price: s.deck === 'upper' && bus.upperFare ? bus.upperFare : bus.fare }));
  res.json(bus);
});

// ---- Admin: add / remove buses and routes (road distance auto-calculated) ----
r.post('/', auth, admin, async (req, res) => {
  const b = req.body, x = await route(b.fromLoc, b.toLoc);
  res.json(await Bus.create({ ...b, distanceKm: x.km, durationMin: x.min }));
});
r.delete('/:id', auth, admin, async (req, res) => { await Bus.findByIdAndDelete(req.params.id); res.json({ ok: true }); });

// ---- Live tracking ----
// Demo: simulates a bus driving along the real road route. For real GPS, have the driver app POST /:id/location.
const sims = new Map();
r.post('/:id/track/start', async (req, res) => {
  const bus = await Bus.findById(req.params.id), io = req.app.get('io');
  if (sims.has(bus.id)) return res.json({ running: true });
  const { coords } = await route(bus.fromLoc, bus.toLoc); let i = 0; const step = Math.max(1, Math.floor(coords.length / 200));
  const t = setInterval(() => {
    if (i >= coords.length) { clearInterval(t); sims.delete(bus.id); return; }
    io.to('bus:' + bus.id).emit('pos', { lat: coords[i][0], lng: coords[i][1], progress: i / coords.length }); i += step;
  }, 1500);
  sims.set(bus.id, t); res.json({ running: true });
});
r.post('/:id/location', auth, admin, (req, res) => { req.app.get('io').to('bus:' + req.params.id).emit('pos', req.body); res.json({ ok: true }); });
module.exports = r;
