import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const label = (status) => status.replaceAll('_', ' ').toLowerCase();

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [state, setState] = useState({ loading: true, error: '' });
  useEffect(() => { api.myOrders().then((data) => { setOrders(data); setState({ loading: false, error: '' }); }).catch((error) => setState({ loading: false, error: error.message })); }, []);
  return <section className="page-section"><div className="container"><div className="page-title"><span className="eyebrow">Your laundry journey</span><h1>My orders</h1><p>Track pickup, cleaning, and doorstep redelivery in real time.</p></div>
    {state.loading && <div className="page-loader compact">Loading orders...</div>}
    {state.error && <div className="error-message">{state.error}</div>}
    {!state.loading && !orders.length && <div className="empty-state compact"><h2>No orders yet</h2><p>Book your first doorstep pickup.</p><Link className="button" to="/book">Book pickup</Link></div>}
    <div className="orders-grid">{orders.map((order) => <Link to={`/track/${order.orderNumber}`} className="order-card" key={order.orderNumber}><div><span className={`status-pill status-${order.status.toLowerCase()}`}>{label(order.status)}</span><h2>{order.orderNumber}</h2><p>{order.items.map((item) => item.serviceName).join(', ')}</p></div><div className="order-card-side"><strong>₹{order.totalAmount}</strong><small>{order.createdAt?.slice(0, 10)}</small><span>View tracking →</span></div></Link>)}</div>
  </div></section>;
}
