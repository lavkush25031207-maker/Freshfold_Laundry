import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';

const statuses = ['BOOKED', 'PICKUP_ASSIGNED', 'OUT_FOR_PICKUP', 'PICKED_UP', 'AT_SHOP', 'CLEANING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const titles = { BOOKED: 'Pickup request received', PICKUP_ASSIGNED: 'Pickup partner assigned', OUT_FOR_PICKUP: 'Partner coming for pickup', PICKED_UP: 'Clothes collected', AT_SHOP: 'Received at FreshFold shop', CLEANING: 'Cleaning in progress', READY_FOR_DELIVERY: 'Cleaned and packed', OUT_FOR_DELIVERY: 'Out for doorstep delivery', DELIVERED: 'Delivered fresh and clean' };
const formatDate = (value) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'To be confirmed';

export default function TrackingPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const load = () => api.trackOrder(orderNumber).then(setOrder).catch((err) => setError(err.message));
    load(); const timer = setInterval(load, 30000); return () => clearInterval(timer);
  }, [orderNumber]);
  if (error) return <div className="empty-state"><h2>Could not find that order</h2><p>{error}</p><Link className="button" to="/orders">My orders</Link></div>;
  if (!order) return <div className="page-loader">Loading order...</div>;
  const current = order.status === 'CANCELLED' ? -1 : statuses.indexOf(order.status);
  const eventFor = (status) => order.history.findLast?.((event) => event.status === status) || order.history.find((event) => event.status === status);
  return <section className="page-section"><div className="container tracking-container"><div className="page-title"><span className="eyebrow">Order {order.orderNumber}</span><h1>{order.status === 'DELIVERED' ? 'Delivered to your doorstep' : order.status === 'CANCELLED' ? 'Order cancelled' : titles[order.status]}</h1><p>Updates refresh automatically every 30 seconds.</p></div>
    <div className="tracking-layout"><div className="tracking-card"><div className="tracking-head"><div><small>Current status</small><h2>{order.status.replaceAll('_', ' ')}</h2></div><strong>₹{order.totalAmount}</strong></div>
      {order.status === 'CANCELLED' ? <div className="cancelled-box">This order has been cancelled.</div> : <div className="timeline">{statuses.map((status, index) => { const event = eventFor(status); return <div className={index <= current ? 'timeline-item done' : 'timeline-item'} key={status}><span>{index < current ? '✓' : index + 1}</span><div><b>{titles[status]}</b><small>{event ? `${event.note} · ${formatDate(event.createdAt)}` : index === current ? 'Current stage' : 'Upcoming'}</small></div></div>; })}</div>}
    </div><aside className="tracking-sidebar">
      {order.deliveryAgent && <article className="info-card rider-card"><span className="eyebrow">Delivery partner</span><div className="rider-avatar">{order.deliveryAgent.name.charAt(0)}</div><h3>{order.deliveryAgent.name}</h3><p>{order.deliveryAgent.vehicleNumber}</p><a href={`tel:${order.deliveryAgent.phone.replaceAll(' ', '')}`}>Call {order.deliveryAgent.phone}</a></article>}
      <article className="info-card"><h3>Order details</h3><p><span>Pickup slot</span>{order.pickupSlot}</p><p><span>Pickup & delivery address</span>{order.address}, {order.pincode}</p>{order.latitude && <a className="map-link" href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`} target="_blank" rel="noreferrer">View pickup pin on Google Maps ↗</a>}<p><span>Estimated delivery</span>{formatDate(order.estimatedDeliveryAt)}</p><p><span>Payment</span>Cash on delivery · {order.paymentStatus}</p></article>
      <article className="info-card"><h3>Items</h3>{order.items.map((item) => <div className="item-row" key={item.serviceName}><span>{item.serviceName}<small>{item.quantity} {item.unit === 'KG' ? 'kg' : 'item(s)'}</small></span><strong>₹{item.unitPrice}</strong></div>)}</article>
    </aside></div></div></section>;
}
