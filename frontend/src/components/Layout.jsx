import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import Icon from './Icon';

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const close = () => setOpen(false);
  return (
    <div className="site-shell">
      <header className="navbar">
        <div className="container nav-inner">
          <Link to="/" className="brand" onClick={close}><span><Icon name="sparkle" size={18} /></span> FreshFold</Link>
          <button className="menu-button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}><Icon name="menu" size={25} /></button>
          <nav className={open ? 'nav-links open' : 'nav-links'}>
            <NavLink to="/" onClick={close}>Home</NavLink>
            {user?.role !== 'ADMIN' && <NavLink to="/book" onClick={close}>Book Pickup</NavLink>}
            {user?.role !== 'ADMIN' && <NavLink to="/orders" onClick={close}>My Orders</NavLink>}
            {user?.role === 'ADMIN' && <NavLink to="/admin" onClick={close}>Admin Dashboard</NavLink>}
            {user ? <button className="nav-user" onClick={() => { logout(); close(); }}><Icon name="logout" size={16} /> Hi, {user.name.split(' ')[0]}</button> : <NavLink to="/login" onClick={close}>Login</NavLink>}
            {user?.role !== 'ADMIN' && <Link className="button button-small" to="/book" onClick={close}>Schedule now <Icon name="arrowRight" size={16} /></Link>}
          </nav>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="footer">
        <div className="container footer-grid">
          <div><div className="brand brand-light"><span><Icon name="sparkle" size={18} /></span> FreshFold</div><p>Fresh clothes, more free time.</p></div>
          <div><strong>Quick links</strong><Link to="/book">Book pickup</Link><Link to="/orders">Track order</Link></div>
          <div><strong>Support</strong><p>support@freshfold.in</p><p>+91 98765 43210</p></div>
        </div>
      </footer>
    </div>
  );
}
