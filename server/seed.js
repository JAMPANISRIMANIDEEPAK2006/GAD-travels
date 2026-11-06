require('dotenv').config();
const m = require('mongoose'), bcrypt = require('bcryptjs'), { User, Bus } = require('./models'), { route } = require('./utils');
const C = { Guntur: { name: 'Guntur', lat: 16.3067, lng: 80.4365 }, Hyderabad: { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  Bengaluru: { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 }, Vijayawada: { name: 'Vijayawada', lat: 16.5062, lng: 80.648 },
  Chennai: { name: 'Chennai', lat: 13.0827, lng: 80.2707 }, Visakhapatnam: { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 } };
const mk = (name, f, t, type, layout, dep, arr, fare, up) => ({ name, operator: 'GAD Travels', type, layout, ac: /AC/.test(type) && !/Non/.test(type),
  fromLoc: C[f], toLoc: C[t], departure: dep, arrival: arr, fare, upperFare: up, amenities: ['Charging point', 'Water bottle', 'Blanket', 'Live tracking'],
  boarding: [{ name: C[f].name + ' Bus Stand', time: dep }, { name: C[f].name + ' Main Road', time: dep }],
  dropping: [{ name: C[t].name + ' Central', time: arr }, { name: C[t].name + ' Bypass', time: arr }],
  womenSeats: layout === 'sleeper' ? ['L1', 'L4', 'U1', 'U4'] : ['S1', 'S2', 'S5', 'S6'], rating: 4.2, ratingCount: 10 });
(async () => {
  await m.connect(process.env.MONGO_URI);
  await User.deleteMany({ email: 'admin@gad.com' });
  await User.create({ name: 'Admin', email: 'admin@gad.com', password: await bcrypt.hash('admin123', 10), role: 'admin' });
  await Bus.deleteMany({});
  const list = [mk('GAD Express', 'Guntur', 'Hyderabad', 'AC Sleeper (2+1)', 'sleeper', '21:30', '04:00', 750, 700),
    mk('GAD Super Deluxe', 'Guntur', 'Hyderabad', 'Non-AC Seater (2+2)', 'seater', '18:00', '00:30', 380),
    mk('GAD Night Rider', 'Hyderabad', 'Bengaluru', 'AC Sleeper (2+1)', 'sleeper', '20:00', '06:30', 1250, 1150),
    mk('GAD Coastal', 'Vijayawada', 'Chennai', 'AC Seater (2+2)', 'seater', '22:00', '06:00', 900),
    mk('GAD Sea Link', 'Guntur', 'Visakhapatnam', 'AC Sleeper (2+1)', 'sleeper', '22:30', '06:30', 850, 800)];
  for (const b of list) { const x = await route(b.fromLoc, b.toLoc); await Bus.create({ ...b, distanceKm: x.km, durationMin: x.min }); }
  console.log('Seeded. Admin login: admin@gad.com / admin123'); process.exit();
})();
