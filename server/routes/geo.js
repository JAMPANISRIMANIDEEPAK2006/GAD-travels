const r = require('express').Router(), { route } = require('../utils');
// Road distance between two points: /api/geo/route?from=lat,lng&to=lat,lng
r.get('/route', async (req, res) => {
  const [a, b] = ['from', 'to'].map(k => { const [lat, lng] = (req.query[k] || '').split(',').map(Number); return { lat, lng }; });
  const x = await route(a, b); res.json({ km: x.km, min: x.min, source: x.source, coords: x.coords });
});
// Place name -> coordinates (OpenStreetMap Nominatim)
r.get('/geocode', async (req, res) => {
  const j = await (await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(req.query.q)}`, { headers: { 'User-Agent': 'GADTravels/1.0' } })).json();
  j[0] ? res.json({ lat: +j[0].lat, lng: +j[0].lon, name: j[0].display_name }) : res.status(404).json({ message: 'Place not found' });
});
// Coordinates -> city name
r.get('/reverse', async (req, res) => {
  const j = await (await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${req.query.lat}&lon=${req.query.lng}`, { headers: { 'User-Agent': 'GADTravels/1.0' } })).json();
  const a = j.address || {}; res.json({ city: a.city || a.town || a.village || a.county || a.state_district || '' });
});
module.exports = r;
