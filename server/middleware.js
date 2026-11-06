const jwt = require('jsonwebtoken'), { User } = require('./models');
exports.auth = async (req, res, next) => {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '');
    req.user = await User.findById(jwt.verify(t, process.env.JWT_SECRET).id).select('-password');
    if (!req.user) throw 0; next();
  } catch { res.status(401).json({ message: 'Please sign in' }); }
};
exports.admin = (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Admins only' });
