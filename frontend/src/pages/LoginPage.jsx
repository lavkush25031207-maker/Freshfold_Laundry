import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [state, setState] = useState({ loading: false, error: '' });
  const { user, login, signup } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const destination = location.state?.from || '/orders';

  if (user) return <Navigate to={destination} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: '' });
    try {
      const authenticatedUser = await (mode === 'login' ? login({ email: form.email, password: form.password }) : signup(form));
      navigate(authenticatedUser.role === 'ADMIN' ? '/admin' : destination, { replace: true });
    } catch (error) {
      setState({ loading: false, error: error.message });
    }
  };

  return <section className="page-section"><div className="container auth-wrap"><form className="auth-card" onSubmit={submit}>
    <span className="eyebrow">Doorstep laundry account</span><h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
    <p>{mode === 'login' ? 'Login to book, manage, and track your orders.' : 'An account is required for secure pickup and delivery.'}</p>
    <div className="auth-tabs"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button><button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Sign up</button></div>
    {mode === 'signup' && <label className="field"><span>Full name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoComplete="name" required maxLength="100" /></label>}
    <label className="field"><span>Email</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required /></label>
    <label className="field"><span>Password</span><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="8" required /></label>
    {state.error && <div className="error-message">{state.error}</div>}
    <button className="button button-full" disabled={state.loading}>{state.loading ? 'Please wait...' : mode === 'login' ? 'Login securely' : 'Create account'}</button>
    <small>Your orders are private and linked to this account.</small>
  </form></div></section>;
}
