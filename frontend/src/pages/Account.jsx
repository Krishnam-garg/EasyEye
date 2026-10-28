import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { money } from '../lib/api'

export default function Account() {
  const { profile, refreshProfile } = useAuth()
  const [name, setName] = useState(profile?.full_name ?? '')
  const [addr, setAddr] = useState(profile?.saved_addresses?.[0] ?? { full_name: '', line1: '', line2: '', city: '', postal_code: '', country: '' })
  const [orders, setOrders] = useState([]); const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('orders').select('*, order_items(quantity, products(name))').order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data ?? []))
  }, [])
  const save = async (e) => {
    e.preventDefault()
    await supabase.from('profiles').update({ full_name: name, saved_addresses: [addr] }).eq('id', profile.id)
    await refreshProfile(); setMsg('Saved.'); setTimeout(() => setMsg(''), 2000)
  }
  const a = (k, label) => <><label>{label}</label><input value={addr[k]} onChange={(e) => setAddr({ ...addr, [k]: e.target.value })} /></>
  return (
    <div className="container section">
      <h2 style={{ marginBottom: '3rem' }}>Account</h2>
      <div className="row" style={{ gap: '5rem', alignItems: 'start' }}>
        <form onSubmit={save}>
          <h3>Details</h3>
          <label>Full name</label><input value={name} onChange={(e) => setName(e.target.value)} />
          <label>Email</label><input value={profile?.email ?? ''} disabled />
          <h3 style={{ marginTop: '3rem' }}>Saved address</h3>
          {a('full_name', 'Recipient')}{a('line1', 'Address')}{a('line2', 'Line 2')}{a('city', 'City')}{a('postal_code', 'Postal code')}{a('country', 'Country')}
          <button className="btn" style={{ marginTop: '2rem' }}>Save</button> <span className="muted">{msg}</span>
        </form>
        <div>
          <h3>Order history</h3>
          {orders.length === 0 ? <p className="muted" style={{ marginTop: '1rem' }}>No orders yet.</p> :
            <table><thead><tr><th>Order</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
              <tbody>{orders.map((o) => <tr key={o.id}><td>{new Date(o.created_at).toLocaleDateString()}<br /><span className="muted">{o.order_items.map((i) => `${i.products.name}×${i.quantity}`).join(', ')}</span></td>
                <td>{money(o.total_amount)}</td><td>{o.payment_status}</td><td>{o.order_status.replace('_', ' ')}</td></tr>)}</tbody></table>}
        </div>
      </div>
    </div>
  )
}
