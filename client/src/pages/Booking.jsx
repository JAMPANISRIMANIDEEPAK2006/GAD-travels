import React, { useEffect, useState } from 'react'; import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js'; import { useAuth } from '../App.jsx';
const loadRzp = () => new Promise(ok => { if (window.Razorpay) return ok(); const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = ok; document.body.appendChild(s); });
function Deck({ title, seats, picked, toggle }) {
  const cols = seats.some(s => s.type === 'seater') ? 5 : 4;
  return <div className="deck"><h4>{title}</h4><div className="grid" style={{ gridTemplateColumns: `repeat(${cols},46px)` }}>
    {seats.map(s => <button key={s.id} disabled={s.booked} title={`${s.id} · ₹${s.price}`} onClick={() => toggle(s)}
      className={`seat ${s.type} ${s.booked ? 'booked' : ''} ${s.women ? 'women' : ''} ${picked.includes(s.id) ? 'on' : ''}`}
      style={{ gridColumn: s.col + 1, gridRow: s.row + 1 }}>{s.id}</button>)}</div></div>;
}
export default function Booking() {
  const { id } = useParams(), [q] = useSearchParams(), date = q.get('date'), { user } = useAuth(), nav = useNavigate();
  const [bus, setBus] = useState(null), [pax, setPax] = useState([]), [bp, setBp] = useState(''), [dp, setDp] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const [reviews, setReviews] = useState([]);
  useEffect(() => { api.get('/buses/' + id, { params: { date } }).then(r => { setBus(r.data); setBp(r.data.boarding[0]?.name); setDp(r.data.dropping[0]?.name); });
    api.get('/reviews/' + id).then(r => setReviews(r.data)); }, [id, date]);
  if (!bus) return <p className="center">Loading seats…</p>;
  const toggle = s => setPax(p => p.find(x => x.seat === s.id) ? p.filter(x => x.seat !== s.id)
    : p.length >= 6 ? p : [...p, { seat: s.id, name: '', age: '', gender: s.women ? 'female' : 'male', women: s.women, price: s.price }]);
  const edit = (i, k, v) => setPax(p => p.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const total = pax.reduce((a, p) => a + p.price, 0);
  const pay = async () => { setErr(''); setBusy(true);
    try {
      const { data } = await api.post('/bookings/hold', { busId: id, date, boarding: bp, dropping: dp, passengers: pax.map(({ seat, name, age, gender }) => ({ seat, name, age: +age, gender })) });
      const done = async extra => { await api.post('/bookings/verify', { bookingId: data.booking._id, ...extra }); nav('/profile'); };
      if (data.mock) return done({});   // no Razorpay keys set: test mode
      await loadRzp();
      new window.Razorpay({ key: data.key, amount: data.order.amount, currency: 'INR', order_id: data.order.id, name: 'GAD Travels',
        prefill: { name: user.name, email: user.email, contact: user.phone }, handler: r => done(r).catch(e => setErr(errMsg(e))) }).open();
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); } };
  const picked = pax.map(p => p.seat), decks = ['lower', 'upper'].filter(d => bus.seats.some(s => s.deck === d));
  return <div className="wrap two"><section>
    <h2>{bus.name} <small className="muted">{bus.fromLoc.name} to {bus.toLoc.name} · {date}</small></h2>
    <p className="legend"><i className="seat sm" /> Available <i className="seat sm women" /> Women only <i className="seat sm booked" /> Booked <i className="seat sm on" /> Yours</p>
    <div className="decks">{decks.map(d => <Deck key={d} title={bus.layout === 'sleeper' ? (d === 'lower' ? 'Lower deck' : 'Upper deck') : 'Seats'} seats={bus.seats.filter(s => s.deck === d)} picked={picked} toggle={toggle} />)}</div>
    <h3>Reviews</h3>{reviews.length ? reviews.map(r => <p key={r._id} className="card sm">★ {r.rating} <b>{r.user?.name}</b><br />{r.comment}</p>) : <p className="muted">No reviews yet.</p>}
  </section>
  <aside className="card"><h3>Trip details</h3>
    <label>Boarding point<select value={bp} onChange={e => setBp(e.target.value)}>{bus.boarding.map(b => <option key={b.name} value={b.name}>{b.name} · {b.time}</option>)}</select></label>
    <label>Dropping point<select value={dp} onChange={e => setDp(e.target.value)}>{bus.dropping.map(b => <option key={b.name} value={b.name}>{b.name} · {b.time}</option>)}</select></label>
    <h3>Passengers</h3>{!pax.length && <p className="muted">Tap a seat to begin.</p>}
    {pax.map((p, i) => <div key={p.seat} className="pax"><b>Seat {p.seat}</b>{p.women && <span className="tag pink">Women only</span>}
      <input placeholder="Name" value={p.name} onChange={e => edit(i, 'name', e.target.value)} />
      <input placeholder="Age" type="number" value={p.age} onChange={e => edit(i, 'age', e.target.value)} />
      <select value={p.gender} disabled={p.women} onChange={e => edit(i, 'gender', e.target.value)}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>)}
    {err && <p className="err">{err}</p>}
    <button className="btn block" disabled={!pax.length || busy} onClick={pay}>{busy ? 'Please wait…' : `Pay ₹${total}`}</button></aside></div>;
}
