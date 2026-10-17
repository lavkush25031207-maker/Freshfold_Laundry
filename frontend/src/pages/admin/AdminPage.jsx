import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../store/AuthContext';
import './admin.css';
import './admin-enhancements.css';

const incoming = ['BOOKED', 'PICKUP_ASSIGNED', 'OUT_FOR_PICKUP'];
const processing = ['PICKED_UP', 'AT_SHOP', 'CLEANING'];
const completed = ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'];

export default function AdminPage() {
  const { logout } = useAuth();
  const [section, setSection] = useState('orders');
  const [orderTab, setOrderTab] = useState('INCOMING');
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [editingAgent, setEditingAgent] = useState(null);
  const [agentForm, setAgentForm] = useState({ name: '', phone: '', vehicleNumber: '' });
  const [state, setState] = useState({ error: '', updating: '', saving: false });
  const loadOrders = () => api.orders().then(setOrders).catch((error) => setState((current) => ({ ...current, error: error.message })));
  const loadAgents = () => api.deliveryAgents().then(setAgents).catch((error) => setState((current) => ({ ...current, error: error.message })));
  useEffect(() => { loadOrders(); loadAgents(); }, []);

  const grouped = useMemo(() => ({
    INCOMING: orders.filter((order) => incoming.includes(order.status)),
    PROCESSING: orders.filter((order) => processing.includes(order.status)),
    COMPLETED: orders.filter((order) => completed.includes(order.status)),
    DELIVERED: orders.filter((order) => order.status === 'DELIVERED'),
    PAYMENT: orders,
    CANCELLED: orders.filter((order) => order.status === 'CANCELLED'),
  }), [orders]);

  const runOrderAction = async (order, action, nextTab) => {
    try { setState({ error: '', updating: order.orderNumber, saving: false }); await action(); await loadOrders(); if (nextTab) setOrderTab(nextTab); }
    catch (error) { setState({ error: error.message, updating: '', saving: false }); }
    finally { setState((current) => ({ ...current, updating: '' })); }
  };
  const moveOrder = (order, stage) => runOrderAction(order, () => api.updateStage(order.orderNumber, stage), stage);
  const updatePayment = (order, paymentStatus) => runOrderAction(order, () => api.updatePayment(order.orderNumber, paymentStatus));
  const cancelOrder = (order) => { if (window.confirm(`Cancel order ${order.orderNumber}?`)) runOrderAction(order, () => api.updateStatus(order.orderNumber, 'CANCELLED'), 'CANCELLED'); };

  const resetAgentForm = () => { setAgentForm({ name: '', phone: '', vehicleNumber: '' }); setEditingAgent(null); };
  const saveAgent = async (event) => {
    event.preventDefault();
    try { setState({ error: '', updating: '', saving: true }); if (editingAgent) await api.updateDeliveryAgent(editingAgent.id, agentForm); else await api.createDeliveryAgent(agentForm); resetAgentForm(); await loadAgents(); }
    catch (error) { setState({ error: error.message, updating: '', saving: false }); }
    finally { setState((current) => ({ ...current, saving: false })); }
  };
  const editAgent = (agent) => { setEditingAgent(agent); setAgentForm({ name: agent.name, phone: agent.phone, vehicleNumber: agent.vehicleNumber }); };
  const deleteAgent = async (agent) => { if (!window.confirm(`Delete ${agent.name} from delivery team?`)) return; try { await api.deleteDeliveryAgent(agent.id); if (editingAgent?.id === agent.id) resetAgentForm(); await loadAgents(); } catch (error) { setState((current) => ({ ...current, error: error.message })); } };

  return <div className="admin-shell"><aside className="admin-sidebar"><div className="brand brand-light"><span>F</span> FreshFold</div><nav><b>Management</b><button className={section === 'orders' ? 'active' : ''} onClick={() => setSection('orders')}><span>Customer orders</span><strong>{orders.length}</strong></button><button className={section === 'agents' ? 'active' : ''} onClick={() => setSection('agents')}><span>Delivery boys</span><strong>{agents.length}</strong></button></nav><button className="admin-logout" onClick={logout}>Logout</button></aside><main className="admin-main"><header><div><span className="eyebrow">FreshFold operations</span><h1>{section === 'orders' ? 'Customer orders' : 'Delivery boys'}</h1></div><div className="admin-avatar">AD</div></header>{state.error && <div className="error-message admin-page-error">{state.error}</div>}{section === 'orders' ? <OrdersWorkspace grouped={grouped} tab={orderTab} setTab={setOrderTab} updating={state.updating} moveOrder={moveOrder} cancelOrder={cancelOrder} updatePayment={updatePayment} refresh={loadOrders} /> : <AgentsWorkspace agents={agents} form={agentForm} setForm={setAgentForm} save={saveAgent} saving={state.saving} editing={editingAgent} edit={editAgent} remove={deleteAgent} cancelEdit={resetAgentForm} />}</main></div>;
}

function OrdersWorkspace({ grouped, tab, setTab, updating, moveOrder, cancelOrder, updatePayment, refresh }) {
  const tabs = ['INCOMING', 'PROCESSING', 'COMPLETED', 'DELIVERED', 'PAYMENT', 'CANCELLED'];
  const stages = ['INCOMING', 'PROCESSING', 'COMPLETED', 'DELIVERED'];
  return <><div className="order-stages four-stages">{stages.map((stage, index) => <div className="stage-summary" key={stage}><span>{index + 1}</span><div><small>{stage}</small><strong>{grouped[stage].length} orders</strong></div>{index < 3 && <i>→</i>}</div>)}</div><section className="admin-panel orders-panel"><div className="order-tabs">{tabs.map((stage) => <button className={tab === stage ? 'active' : ''} onClick={() => setTab(stage)} key={stage}>{stage === 'PAYMENT' ? 'Payment status' : stage.charAt(0) + stage.slice(1).toLowerCase()} <span>{grouped[stage].length}</span></button>)}<button className="refresh-action" onClick={refresh}>↻ Refresh</button></div><div className="order-list">{grouped[tab].map((order) => <article className="admin-order-card" key={order.orderNumber}><div className="order-primary"><span className={`stage-badge stage-${tab.toLowerCase()}`}>{tab === 'PAYMENT' ? order.paymentStatus : tab}</span><h3>{order.orderNumber}</h3><p><b>{order.customer.name}</b> · {order.customer.email}</p><small>Placed {new Date(order.createdAt).toLocaleString('en-IN')}</small></div><div className="order-detail"><small>PICKUP DETAILS</small><p>{order.address}, {order.pincode}</p><span>{order.pickupSlot}</span></div><div className="order-detail"><small>DELIVERY PARTNER</small><p>{order.deliveryAgent?.name || 'Not assigned'}</p><span>{order.deliveryAgent?.vehicleNumber || 'Assigns automatically'}</span></div><div className="order-price"><strong>₹{order.totalAmount}</strong><small>{order.items.map((item) => item.serviceName).join(', ')}</small><b className={`payment-badge payment-${order.paymentStatus.toLowerCase()}`}>{order.paymentStatus}</b></div><div className="order-actions">{tab === 'INCOMING' && <button className="advance-button" disabled={updating === order.orderNumber} onClick={() => moveOrder(order, 'PROCESSING')}>Start processing →</button>}{tab === 'PROCESSING' && <button className="advance-button complete-action" disabled={updating === order.orderNumber} onClick={() => moveOrder(order, 'COMPLETED')}>Mark completed ✓</button>}{tab === 'COMPLETED' && <button className="advance-button complete-action" disabled={updating === order.orderNumber} onClick={() => moveOrder(order, 'DELIVERED')}>Mark delivered ✓</button>}{tab === 'PAYMENT' && <button className="advance-button" disabled={updating === order.orderNumber || order.paymentStatus === 'PAID'} onClick={() => updatePayment(order, 'PAID')}>{order.paymentStatus === 'PAID' ? 'Payment received ✓' : 'Mark payment paid'}</button>}{!['DELIVERED','PAYMENT','CANCELLED'].includes(tab) && <button className="cancel-button" disabled={updating === order.orderNumber} onClick={() => cancelOrder(order)}>Cancel</button>}</div></article>)}{!grouped[tab].length && <div className="empty-table">No {tab.toLowerCase()} orders.</div>}</div></section></>;
}

function AgentsWorkspace({ agents, form, setForm, save, saving, editing, edit, remove, cancelEdit }) {
  return <div className="agents-layout"><form className="agent-form" onSubmit={save}><span className="eyebrow">{editing ? 'Update team member' : 'Add team member'}</span><h2>Delivery boy information</h2><p>Add or update the partner who collects and redelivers clothes.</p><label className="field"><span>Full name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label className="field"><span>Phone number</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+91 98765 43210" required /></label><label className="field"><span>Vehicle number</span><input value={form.vehicleNumber} onChange={(event) => setForm({ ...form, vehicleNumber: event.target.value.toUpperCase() })} required /></label><button className="button button-full" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update delivery boy' : 'Save delivery boy'}</button>{editing && <button className="cancel-edit" type="button" onClick={cancelEdit}>Cancel editing</button>}</form><section className="agents-list"><div><span className="eyebrow">Active team</span><h2>Delivery boys</h2><p>{agents.length} partners available for order assignment.</p></div><div className="agents-scroll">{agents.map((agent) => <article className="agent-card" key={agent.id}><div className="agent-avatar">{agent.name.charAt(0)}</div><div><h3>{agent.name}</h3><p>{agent.phone}</p><span>{agent.vehicleNumber}</span></div><div className="agent-controls"><b className="agent-active">Active</b><button onClick={() => edit(agent)}>Edit</button><button className="delete-agent" onClick={() => remove(agent)}>Delete</button></div></article>)}</div></section></div>;
}
