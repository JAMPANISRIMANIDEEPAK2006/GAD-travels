import React, { useEffect, useState } from 'react'; import { useNavigate } from 'react-router-dom'; import api from '../api.js';
import { CITIES, findCity } from '../cities.js'; import { BusScene, MiniBus } from '../components/BusArt.jsx';
const today = () => new Date().toISOString().slice(0, 10);
const POP = [['Guntur', 'Hyderabad', 'sleeper', 'g1'], ['Hyderabad', 'Bengaluru', 'sleeper', 'g2'], ['Vijayawada', 'Chennai', 'seater', 'g3'],
  ['Guntur', 'Visakhapatnam', 'sleeper', 'g4'], ['Chennai', 'Bengaluru', 'seater', 'g5'], ['Delhi', 'Jaipur', 'seater', 'g6']];
const FEATS = [['👩', 'Women-only seats', 'Pink seats are reserved and enforced at booking.'], ['📍', 'Live bus tracking', 'Watch your bus move on the map in real time.'],
  ['🛏️', 'Lower and upper deck', 'Pick the exact sleeper berth you want.'], ['💳', 'Secure payments', 'Pay with UPI, cards or net banking.'],
  ['🎫', 'Instant e-ticket', 'Your ticket arrives by email right after payment.'], ['⭐', 'Real passenger reviews', 'Only people who travelled can rate a bus.']];
export default function Home() {
  const [f, setF] = useState({ from: '', to: '', date: today() }), [cities, setCities] = useState([]), [msg, setMsg] = useState(''), nav = useNavigate();
  useEffect(() => { api.get('/buses/cities').then(r => setCities([...new Set([...CITIES.map(c => c.name), ...r.data])].sort())).catch(() => setCities(CITIES.map(c => c.name))); }, []);
  const locate = () => { setMsg('Finding your location…');
    navigator.geolocation.getCurrentPosition(async p => {
      const { latitude: lat, longitude: lng } = p.coords; sessionStorage.setItem('gad_loc', JSON.stringify({ lat, lng }));
      const { data } = await api.get('/geo/reverse', { params: { lat, lng } });
      setF(x => ({ ...x, from: findCity(data.city)?.name || data.city })); setMsg('You are near ' + data.city);
    }, () => setMsg('Location blocked. Type your city instead.')); };
  const go = e => { e.preventDefault(); nav(`/results?from=${f.from}&to=${f.to}&date=${f.date}`); };
  const quick = (a, b) => nav(`/results?from=${a}&to=${b}&date=${f.date}`);
  return <>
    <section className="hero">
      <div className="hero-text"><h1>Your next journey starts here</h1><p>Sleeper and seater buses across India, with women-only seats, live tracking and instant tickets.</p></div>
      <form className="search" onSubmit={go}>
        <label>From<input list="c" placeholder="Leaving from" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} required /></label>
        <label>To<input list="c" placeholder="Going to" value={f.to} onChange={e => setF({ ...f, to: e.target.value })} required /></label>
        <label>Date<input type="date" min={today()} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} required /></label>
        <datalist id="c">{cities.map(c => <option key={c} value={c} />)}</datalist>
        <button className="btn">Search buses</button></form>
      <p className="locrow"><button type="button" className="link light" onClick={locate}>Use my current location</button> <span>{msg}</span></p>
      <BusScene /></section>
    <section className="wrap">
      <h2>Popular routes</h2>
      <div className="routes">{POP.map(([a, b, l, g]) => <button key={a + b} className={'route-card ' + g} onClick={() => quick(a, b)}>
        <MiniBus layout={l} /><span className="rt">{a} <i>to</i> {b}</span><span className="go">View buses</span></button>)}</div>
      <h2>Why travel with GAD</h2>
      <div className="feats">{FEATS.map(([i, t, d]) => <div className="feat" key={t}><span className="ico">{i}</span><h3>{t}</h3><p className="muted">{d}</p></div>)}</div>
    </section></>;
}
