import React, { useEffect, useState } from 'react'; import { Link } from 'react-router-dom'; import api, { errMsg } from '../api.js'; import { useAuth } from '../App.jsx';
export default function Profile() {
  const { user, setUser } = useAuth(), [f, setF] = useState(user), [list, setList] = useState([]), [msg, setMsg] = useState('');
  const load = () => api.get('/bookings/mine').then(r => setList(r.data)); useEffect(() => { load(); }, []);
  const save = async e => { e.preventDefault(); const { data } = await api.put('/auth/me', f); setUser(data); setMsg('Profile saved'); };
  const cancel = async id => { if (confirm('Cancel this booking?')) { try { await api.post(`/bookings/${id}/cancel`); load(); } catch (e) { alert(errMsg(e)); } } };
  const review = async b => { const rating = +prompt('Rating 1-5'); if (!rating) return; const comment = prompt('Your review') || '';
    try { await api.post('/reviews', { busId: b.bus._id, rating, comment }); alert('Thanks for your review'); } catch (e) { alert(errMsg(e)); } };
  return <div className="wrap two"><form className="card" onSubmit={save}><h3>Your profile</h3>
    <input value={f.name || ''} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Name" />
    <input value={f.email} disabled /><input value={f.phone || ''} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="Mobile" />
    <select value={f.gender} onChange={e => setF({ ...f, gender: e.target.value })}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select>
    <button className="btn">Save profile</button>{msg && <p className="ok">{msg}</p>}</form>
    <section><h3>My trips</h3>{!list.length && <p className="muted">No trips yet. <Link to="/">Find a bus</Link></p>}
      {list.map(b => <div className="card sm" key={b._id}><b>{b.bus?.name}</b> · {b.bus?.fromLoc.name} to {b.bus?.toLoc.name}<br />
        {b.date} · Seats {b.passengers.map(p => p.seat).join(', ')} · ₹{b.amount} · <span className={'tag ' + (b.status === 'confirmed' ? 'ok' : '')}>{b.status}</span><br />
        Board: {b.boarding} · Drop: {b.dropping}<br />
        {b.status === 'confirmed' && <><Link className="link" to={`/track/${b.bus._id}`}>Track bus</Link> <button className="link" onClick={() => review(b)}>Rate this trip</button> <button className="link danger" onClick={() => cancel(b._id)}>Cancel</button></>}</div>)}</section></div>;
}
