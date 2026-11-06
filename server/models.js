const m = require('mongoose'), S = m.Schema;
const loc = { name: String, lat: Number, lng: Number };
const stop = { name: String, time: String };
exports.User = m.model('User', new S({
  name: String, email: { type: String, unique: true, lowercase: true }, phone: String,
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
  password: String, role: { type: String, default: 'user' }
}, { timestamps: true }));
exports.Bus = m.model('Bus', new S({
  name: String, operator: String, type: String,            // e.g. "AC Sleeper (2+1)"
  layout: { type: String, enum: ['sleeper', 'seater'], default: 'sleeper' },
  ac: { type: Boolean, default: true },
  fromLoc: loc, toLoc: loc, distanceKm: Number, durationMin: Number,
  departure: String, arrival: String, fare: Number, upperFare: Number,
  amenities: [String], boarding: [stop], dropping: [stop], womenSeats: [String],
  rating: { type: Number, default: 0 }, ratingCount: { type: Number, default: 0 }
}, { timestamps: true }));
exports.Booking = m.model('Booking', new S({
  user: { type: S.Types.ObjectId, ref: 'User' }, bus: { type: S.Types.ObjectId, ref: 'Bus' }, date: String,
  passengers: [{ seat: String, name: String, age: Number, gender: String }],
  boarding: String, dropping: String, amount: Number,
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  orderId: String, paymentId: String
}, { timestamps: true }));
exports.Review = m.model('Review', new S({
  user: { type: S.Types.ObjectId, ref: 'User' }, bus: { type: S.Types.ObjectId, ref: 'Bus' },
  rating: Number, comment: String
}, { timestamps: true }));
