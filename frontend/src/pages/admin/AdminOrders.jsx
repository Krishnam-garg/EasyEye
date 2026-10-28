import { useEffect, useState } from 'react'
import { api, money } from '../../lib/api'
import AdminNav from './AdminNav'

const STAGES = ['processing', 'shipped', 'delivered', 'cancelled']

export default function AdminOrders() {
  const [orders, setOrders] = useState([]); const [err, setErr] = useState('')
  const load = () => api('/orders').then(setOrders).catch((e) => setErr(e.message))
  useEffect(() => { load() }, [])
  const update = async (id, order_status) => { await api(`/orders/${id}/status`, { method: 'PATCH', body: { order_status } }); load() }
  return (
    <div className="container section">
      <AdminNav /><h2 style={{ marginBottom: '1.5rem' }}>Orders</h2>{err && <p className="error">{err}</p>}
      <table><thead><tr><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Fulfilment</th></tr></thead>
        <tbody>{orders.map((o) => <tr key={o.id}>
          <td>{new Date(o.created_at).toLocaleDateString()}</td>
          <td>{o.profiles?.full_name || o.profiles?.email}</td>
          <td>{o.order_items.map((i) => `${i.products.name}×${i.quantity}`).join(', ')}</td>
          <td>{money(o.total_amount)}</td><td>{o.payment_status}</td>
          <td>{o.payment_status === 'paid'
            ? <select value={o.order_status} onChange={(e) => update(o.id, e.target.value)}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select>
            : <span className="muted">{o.order_status.replace('_', ' ')}</span>}</td>
        </tr>)}</tbody></table>
    </div>
  )
}
