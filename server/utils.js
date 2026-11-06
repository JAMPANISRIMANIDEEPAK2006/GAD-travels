const nodemailer = require('nodemailer');
const hav = (a, b, c, d) => { const r = x => x * Math.PI / 180, R = 6371, dl = r(c - a), dn = r(d - b);
  return 2 * R * Math.asin(Math.sqrt(Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dn / 2) ** 2)); };
// Road distance via OSRM (free). Falls back to straight-line x1.3 if OSRM is unreachable.
exports.route = async (a, b) => {
  try {
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`);
    const x = (await r.json()).routes[0];
    return { km: +(x.distance / 1000).toFixed(1), min: Math.round(x.duration / 60), source: 'osrm',
      coords: x.geometry.coordinates.map(([lng, lat]) => [lat, lng]) };
  } catch {
    const km = +(hav(a.lat, a.lng, b.lat, b.lng) * 1.3).toFixed(1);
    return { km, min: Math.round(km / 50 * 60), source: 'estimate', coords: [[a.lat, a.lng], [b.lat, b.lng]] };
  }
};
// Seat layouts. sleeper = lower + upper deck, 2+1 (cols 0 | aisle 1 | 2,3). seater = 2+2.
exports.genSeats = layout => {
  const s = [];
  if (layout === 'sleeper') for (const [deck, p] of [['lower', 'L'], ['upper', 'U']]) {
    let n = 1; for (let row = 0; row < 5; row++) for (const col of [0, 2, 3]) s.push({ id: p + n++, deck, row, col, type: 'sleeper' });
  } else { let n = 1; for (let row = 0; row < 10; row++) for (const col of [0, 1, 3, 4]) s.push({ id: 'S' + n++, deck: 'lower', row, col, type: 'seater' }); }
  return s;
};
exports.sendTicket = async (user, b, bus) => {
  const text = `GAD Travels e-ticket\nPNR: ${b._id}\n${bus.name}: ${bus.fromLoc.name} -> ${bus.toLoc.name}\nDate: ${b.date}  Departs: ${bus.departure}\nSeats: ${b.passengers.map(p => p.seat).join(', ')}\nBoarding: ${b.boarding}\nDropping: ${b.dropping}\nPaid: Rs ${b.amount}`;
  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      await nodemailer.createTransport({ host: process.env.SMTP_HOST, port: +process.env.SMTP_PORT || 587,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } })
        .sendMail({ from: `GAD Travels <${process.env.SMTP_USER}>`, to: user.email, subject: 'Your GAD Travels ticket', text });
    } else console.log('\n[MAIL not configured - ticket below]\n' + text + '\n');
    if (process.env.TWILIO_SID && user.phone)
      await require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN).messages.create({ body: text, from: process.env.TWILIO_FROM, to: user.phone });
  } catch (e) { console.log('Ticket send failed:', e.message); }
};

// ---- Any place in India + auto-created GAD services for any route ----
exports.title = s => s.trim().replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
exports.geocode = async q => {
  try {
    const j = await (await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`, { headers: { 'User-Agent': 'GADTravels/1.0' } })).json();
    return j[0] ? { name: exports.title(q), lat: +j[0].lat, lng: +j[0].lon } : null;
  } catch { return null; }
};
const addMin = (t, m) => { const [h, mi] = t.split(':').map(Number), x = (h * 60 + mi + m) % 1440; return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); };
// Fare = road km x rate per km (AC sleeper 1.7, AC seater 1.3, non-AC seater 0.9), rounded to Rs 10
exports.ensureBuses = async (Bus, a, b) => {
  const x = await exports.route(a, b), dur = Math.round(x.min * 1.15), short = x.km < 250;
  const T = [['GAD Express', 'AC Sleeper (2+1)', 'sleeper', 1.7, short ? '21:00' : '21:30'],
    ['GAD Super Deluxe', 'Non-AC Seater (2+2)', 'seater', 0.9, short ? '07:00' : '18:00'],
    ['GAD Night Rider', 'AC Sleeper (2+1)', 'sleeper', 1.7, short ? '15:30' : '22:30'],
    ['GAD Day Cruiser', 'AC Seater (2+2)', 'seater', 1.3, short ? '11:00' : '06:30']];
  for (const [name, type, layout, rate, dep] of T) {
    const fare = Math.max(150, Math.round(x.km * rate / 10) * 10);
    await Bus.create({ name, operator: 'GAD Travels', type, layout, ac: !/Non/.test(type), fromLoc: a, toLoc: b, distanceKm: x.km, durationMin: dur,
      departure: dep, arrival: addMin(dep, dur), fare, upperFare: layout === 'sleeper' ? Math.round(fare * 0.93 / 10) * 10 : undefined,
      amenities: ['Charging point', 'Water bottle', 'Live tracking'].concat(/Sleeper/.test(type) ? ['Blanket'] : []),
      boarding: [{ name: a.name + ' Bus Stand', time: dep }, { name: a.name + ' Bypass', time: addMin(dep, 20) }],
      dropping: [{ name: b.name + ' Bus Stand', time: addMin(dep, dur - 20) }, { name: b.name + ' Bypass', time: addMin(dep, dur) }],
      womenSeats: layout === 'sleeper' ? ['L1', 'L4', 'U1', 'U4'] : ['S1', 'S2', 'S5', 'S6'], rating: 4.1, ratingCount: 0 });
  }
};
