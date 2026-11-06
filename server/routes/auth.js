const r = require('express').Router(), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const { User } = require('../models'), { auth } = require('../middleware');
const tok = u => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = u => ({ _id: u._id, name: u.name, email: u.email, phone: u.phone, gender: u.gender, role: u.role });
r.post('/register', async (req, res) => {
  const { name, email, phone, gender, password } = req.body;
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: 'Name, email and a 6+ character password are required' });
  if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
  const u = await User.create({ name, email, phone, gender, password: await bcrypt.hash(password, 10) });
  res.json({ token: tok(u), user: pub(u) });
});
r.post('/login', async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password))) return res.status(400).json({ message: 'Wrong email or password' });
  res.json({ token: tok(u), user: pub(u) });
});
r.get('/me', auth, (req, res) => res.json(pub(req.user)));
r.put('/me', auth, async (req, res) => {
  const { name, phone, gender } = req.body; Object.assign(req.user, { name, phone, gender });
  await req.user.save(); res.json(pub(req.user));
});
module.exports = r;
