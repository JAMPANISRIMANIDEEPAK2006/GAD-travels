import React, { useEffect, useState } from 'react'; import api, { errMsg } from '../api.js';
const blank = { name: '', operator: 'GAD Travels', type: 'AC Sleeper (2+1)', layout: 'sleeper', ac: true, from: '', fromLat: '', fromLng: '', to: '', toLat: '', toLng: '',
  departure: '21:00', arrival: '05:00', fare: '', upperFare: '', amenities: 'Charging point, Blanket', boarding: '', dropping: '', womenSeats: 'L1,L4,U1,U4' };
export default function Admin() {
  const [f, setF] = useState(blank), [buses, setBuses] = useState([]), [msg, setMsg] = useState('');
  const load = () => api.get('/buses').then(r => setBuses(r.data));
  useEffect(() => { load(); }, []);
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const list = s => s.split(',').map(x => x.trim()).filter(Boolean);
  const stops = (s, t) => list(s).map(n => ({ name: n, time: t }));
  const geo = async k => { try { const { data } = await api.get('/geo/geocode', { params: { q: f[k] } }); setF(x => ({ ...x, [k + 'Lat']: data.lat, [k + 'Lng']: data.lng })); } catch (e) { setMsg(errMsg(e)); } };
  const add = async e => { e.preventDefault();
    try { await api.post('/buses', { name: f.name, operator: f.operator, type: f.type, layout: f.layout, ac: f.ac,
      fromLoc: { name: f.from, lat: +f.fromLat, lng: +f.fromLng }, toLoc: { name: f.to, lat: +f.toLat, lng: +f.toLng },
      departure: f.departure, arrival: f.arrival, fare: +f.fare, upperFare: +f.upperFare || undefined, amenities: list(f.amenities),
      boarding: stops(f.boarding || f.from + ' Bus Stand', f.departure), dropping: stops(f.dropping || f.to + ' Central', f.arrival), womenSeats: list(f.womenSeats) });
      setMsg('Bus added. Road distance was calculated automatically.'); setF(blank); load(); } catch (x) { setMsg(errMsg(x)); } };
  const del = async id => { if (confirm('Delete this bus?')) { await api.delete('/buses/' + id); load(); } };
  return <div className="wrap two"><form className="card" onSubmit={add}><h3>Add bus and route</h3>{msg && <p className="ok">{msg}</p>}
    <input placeholder="Bus name" value={f.name} onChange={set('name')} required />
    <input placeholder="Type, e.g. AC Sleeper (2+1)" value={f.type} onChange={set('type')} />
    <select value={f.layout} onChange={set('layout')}><option value="sleeper">Sleeper (lower + upper deck)</option><option value="seater">Seater (2+2)</option></select>
    <label className="row"><input type="checkbox" checked={f.ac} onChange={set('ac')} /> AC</label>
    <div className="row"><input placeholder="From city" value={f.from} onChange={set('from')} required /><button type="button" className="btn sm" onClick={() => geo('from')}>Find</button></div>
    <div className="row"><input placeholder="Lat" value={f.fromLat} onChange={set('fromLat')} required /><input placeholder="Lng" value={f.fromLng} onChange={set('fromLng')} required /></div>
    <div className="row"><input placeholder="To city" value={f.to} onChange={set('to')} required /><button type="button" className="btn sm" onClick={() => geo('to')}>Find</button></div>
    <div className="row"><input placeholder="Lat" value={f.toLat} onChange={set('toLat')} required /><input placeholder="Lng" value={f.toLng} onChange={set('toLng')} required /></div>
    <div className="row"><input type="time" value={f.departure} onChange={set('departure')} /><input type="time" value={f.arrival} onChange={set('arrival')} /></div>
    <div className="row"><input placeholder="Fare ₹" type="number" value={f.fare} onChange={set('fare')} required /><input placeholder="Upper deck ₹" type="number" value={f.upperFare} onChange={set('upperFare')} /></div>
    <input placeholder="Boarding points (comma separated)" value={f.boarding} onChange={set('boarding')} />
    <input placeholder="Dropping points (comma separated)" value={f.dropping} onChange={set('dropping')} />
    <input placeholder="Women-only seat ids (L1,L4,U1…)" value={f.womenSeats} onChange={set('womenSeats')} />
    <input placeholder="Amenities" value={f.amenities} onChange={set('amenities')} /><button className="btn">Add bus</button></form>
    <section><h3>All buses ({buses.length})</h3>{buses.map(b => <div className="card sm" key={b._id}><b>{b.name}</b> · {b.fromLoc.name} to {b.toLoc.name} · {b.distanceKm} km · ₹{b.fare}
      <button className="link danger" onClick={() => del(b._id)}>Delete</button></div>)}</section></div>;
}
