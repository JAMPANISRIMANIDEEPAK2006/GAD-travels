import React, { useEffect, useMemo, useState } from 'react'; import { useSearchParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet'; import api from '../api.js'; import { MiniBus } from '../components/BusArt.jsx'; import { coordQS, findCity } from '../cities.js';
const hm = m => `${Math.floor(m / 60)}h ${m % 60}m`;
function Fit({ coords }) { const map = useMap(); useEffect(() => { if (coords.length) map.fitBounds(coords, { padding: [30, 30] }); }, [coords, map]); return null; }
export default function Results() {
  const [q] = useSearchParams(), from = q.get('from'), to = q.get('to'), date = q.get('date');
  const [data, setData] = useState(null), [you, setYou] = useState(null), [flt, setFlt] = useState({ ac: 'any', layout: 'any', sort: 'departure' });
  useEffect(() => { setData(null); const a = findCity(from), b = findCity(to);
    api.get('/buses/search', { params: { from, to, date, ...(a && { fromLat: a.lat, fromLng: a.lng }), ...(b && { toLat: b.lat, toLng: b.lng }) } }).then(r => {
      setData(r.data); const loc = JSON.parse(sessionStorage.getItem('gad_loc') || 'null');
      if (loc && r.data.route) api.get('/geo/route', { params: { from: `${loc.lat},${loc.lng}`, to: `${r.data.route.to.lat},${r.data.route.to.lng}` } }).then(x => setYou(x.data)); })
      .catch(() => setData({ buses: [], route: null, error: 'Search failed. Is the server running?' })); }, [from, to, date]);
  const buses = data?.buses || [], rt = data?.route;
  const list = useMemo(() => buses.filter(b => (flt.ac === 'any' || b.ac === (flt.ac === 'ac')) && (flt.layout === 'any' || b.layout === flt.layout))
    .sort((a, b) => flt.sort === 'fare' ? a.fare - b.fare : flt.sort === 'rating' ? b.rating - a.rating : a.departure.localeCompare(b.departure)), [buses, flt]);
  const sel = k => e => setFlt({ ...flt, [k]: e.target.value }), min = buses.length ? Math.min(...buses.map(b => b.fare)) : 0;
  return <div className="wrap"><h2>{from} to {to} <small className="muted">{date}</small></h2>
    {!data ? <p>Finding buses and the road route…</p> : data.error ? <p className="card err">{data.error}</p> : <>
      {rt && <div className="card route"><div className="stats">
        <div><span className="muted">Road distance</span><b>{rt.km} km</b></div><div><span className="muted">Travel time</span><b>{hm(rt.min)}</b></div>
        <div><span className="muted">Fares from</span><b>₹{min}</b></div><div><span className="muted">Buses</span><b>{buses.length}</b></div></div>
        {you && <p className="note">From your current location to {to}: <b>{you.km} km</b> by road (about {hm(you.min)})</p>}
        <MapContainer center={[rt.from.lat, rt.from.lng]} zoom={6} style={{ height: 300, borderRadius: 10 }} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" /><Fit coords={rt.coords} />
          <Polyline positions={rt.coords} color="#0b7a75" weight={5} />
          {[rt.from, rt.to].map(p => <CircleMarker key={p.name} center={[p.lat, p.lng]} radius={8} pathOptions={{ color: '#0f2a43', fillColor: '#f2a900', fillOpacity: 1 }}><Tooltip permanent>{p.name}</Tooltip></CircleMarker>)}
        </MapContainer>{rt.source === 'estimate' && <p className="muted">Road routing was unavailable, so this is an estimate.</p>}</div>}
      <div className="filters"><select onChange={sel('ac')}><option value="any">AC and Non-AC</option><option value="ac">AC</option><option value="non">Non-AC</option></select>
        <select onChange={sel('layout')}><option value="any">Sleeper and Seater</option><option value="sleeper">Sleeper</option><option value="seater">Seater</option></select>
        <select onChange={sel('sort')}><option value="departure">Earliest departure</option><option value="fare">Lowest fare</option><option value="rating">Top rated</option></select></div>
      {!list.length ? <p className="card">No buses match these filters.</p> : list.map(b => <article className="card bus" key={b._id}>
        <div><MiniBus layout={b.layout} /><h3>{b.name}</h3><p className="muted">{b.type}</p><p>{b.amenities.join(' · ')}</p><p className="rate">★ {b.rating || 'New'} <span className="muted">({b.ratingCount})</span></p></div>
        <div><b>{b.departure}</b> → <b>{b.arrival}</b><p className="muted">{b.distanceKm} km by road · {hm(b.durationMin)}</p>{b.womenSeats.length > 0 && <span className="tag pink">Women-only seats</span>}</div>
        <div className="right"><div className="price">₹{b.fare}</div>{b.upperFare && <p className="muted">Upper deck ₹{b.upperFare}</p>}<p className="muted">{b.free} seats left</p>
          <Link className="btn" to={`/bus/${b._id}?date=${date}`}>Select seats</Link> <Link className="link" to={`/track/${b._id}`}>Track</Link></div></article>)}</>}</div>;
}
