import React, { useState } from 'react'; import { useNavigate, Link } from 'react-router-dom';
import api, { errMsg } from '../api.js'; import { useAuth } from '../App.jsx';
function Form({ mode }) {
  const [f, setF] = useState({ gender: 'male' }), [err, setErr] = useState(''), { signIn } = useAuth(), nav = useNavigate();
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const go = async e => { e.preventDefault(); try { const { data } = await api.post('/auth/' + mode, f); signIn(data); nav(-1 > 0 ? -1 : '/'); } catch (x) { setErr(errMsg(x)); } };
  return <form className="card narrow" onSubmit={go}>
    <h2>{mode === 'login' ? 'Sign in' : 'Create your account'}</h2>{err && <p className="err">{err}</p>}
    {mode === 'register' && <><input placeholder="Full name" onChange={set('name')} required />
      <input placeholder="Mobile (+91…)" onChange={set('phone')} />
      <select onChange={set('gender')}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></>}
    <input type="email" placeholder="Email" onChange={set('email')} required />
    <input type="password" placeholder="Password (6+ characters)" onChange={set('password')} required />
    <button className="btn">{mode === 'login' ? 'Sign in' : 'Create account'}</button>
    <p className="muted">{mode === 'login' ? <>New here? <Link to="/register">Create an account</Link></> : <>Have an account? <Link to="/login">Sign in</Link></>}</p>
  </form>;
}
export const Login = () => <Form mode="login" />; export const Register = () => <Form mode="register" />;
