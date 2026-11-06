import React, { createContext, useContext, useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import api from './api.js';
import Home from './pages/Home.jsx'; import Results from './pages/Results.jsx'; import Booking from './pages/Booking.jsx';
import { Login, Register } from './pages/Auth.jsx'; import Profile from './pages/Profile.jsx';
import Admin from './pages/Admin.jsx'; import Track from './pages/Track.jsx';

const Ctx = createContext(); export const useAuth = () => useContext(Ctx);
export default function App() {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false), nav = useNavigate();
  useEffect(() => { if (!localStorage.getItem('gad_token')) return setReady(true);
    api.get('/auth/me').then(r => setUser(r.data)).catch(() => localStorage.removeItem('gad_token')).finally(() => setReady(true)); }, []);
  const signIn = (d) => { localStorage.setItem('gad_token', d.token); setUser(d.user); };
  const signOut = () => { localStorage.removeItem('gad_token'); setUser(null); nav('/'); };
  if (!ready) return <p className="center">Loading…</p>;
  const need = (el, adminOnly) => !user ? <Navigate to="/login" /> : adminOnly && user.role !== 'admin' ? <Navigate to="/" /> : el;
  return <Ctx.Provider value={{ user, setUser, signIn, signOut }}>
    <header className="bar"><Link to="/" className="logo">🚌 GAD<span>Travels</span></Link>
      <nav>{user ? <>
        {user.role === 'admin' && <Link to="/admin">Admin</Link>}
        <Link to="/profile">{user.name}</Link><button className="link" onClick={signOut}>Sign out</button></>
        : <><Link to="/login">Sign in</Link><Link to="/register" className="btn sm">Create account</Link></>}</nav></header>
    <main>
      <Routes>
        <Route path="/" element={<Home />} /><Route path="/results" element={<Results />} />
        <Route path="/bus/:id" element={need(<Booking />)} /><Route path="/track/:id" element={<Track />} />
        <Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} />
        <Route path="/profile" element={need(<Profile />)} /><Route path="/admin" element={need(<Admin />, true)} />
      </Routes>
    </main></Ctx.Provider>;
}
