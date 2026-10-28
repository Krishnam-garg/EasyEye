import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api, money } from '../lib/api'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'

// Step 1: shipping  →  Step 2: review (creates pending order)  →  Step 3: mock card payment
export default function Checkout() {
  const { cart, cartTotal } = useStore()
  const { profile } = useAuth()
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [orderId, setOrderId] = useState(null)
  const [a, setA] = useState({ full_name: '', line1: '', line2: '', city: '', postal_code: '', country: '' })
  const [card, setCard] = useState({ name: '', card_number: '', expiry: '', cvc: '' })
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const saved = profile?.saved_addresses?.[0]
  useEffect(() => { if (saved) setA((s) => ({ ...s, ...saved })) }, [saved])

  if (cart.length === 0 && !orderId) return <Navigate to="/cart" replace />
  const f = (k, label, req = true) => <><label>{label}</label><input required={req} value={a[k]} onChange={(e) => setA({ ...a, [k]: e.target.value })} /></>
  const c = (k, label, ph = '') => <><label>{label}</label><input required placeholder={ph} value={card[k]} onChange={(e) => setCard({ ...card, [k]: e.target.value })} /></>

  const toPayment = async () => {
    setBusy(true); setErr('')
    try {
      if (!orderId) { const r = await api('/orders/checkout', { method: 'POST', body: a }); setOrderId(r.order_id) }
      setStep(3)
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  const pay = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { await api(`/payments/${orderId}/pay`, { method: 'POST', body: card }); nav(`/checkout/success?order=${orderId}`, { replace: true }) }
    catch (e) { setErr(e.message); setBusy(false) }
  }

  return (
    <div className="container section" style={{ maxWidth: 720 }}>
      <div className="steps">{['Shipping', 'Review', 'Payment'].map((s, i) => <span key={s} className={step === i + 1 ? 'on' : ''}>{i + 1}. {s}</span>)}</div>
      {step === 1 && <form onSubmit={(e) => { e.preventDefault(); setStep(2) }}>
        <h2>Shipping address</h2>{f('full_name', 'Full name')}{f('line1', 'Address')}{f('line2', 'Apartment, suite (optional)', false)}
        <div className="row"><div>{f('city', 'City')}</div><div>{f('postal_code', 'Postal code')}</div></div>{f('country', 'Country')}
        <button className="btn" style={{ marginTop: '2rem' }}>Continue</button>
      </form>}
      {step === 2 && <div>
        <h2>Review</h2>
        <table><tbody>{cart.map((i) => <tr key={i.id}><td>{i.products.name} × {i.quantity}</td><td style={{ textAlign: 'right' }}>{money(i.quantity * i.products.price)}</td></tr>)}</tbody></table>
        <p style={{ margin: '1.5rem 0' }} className="muted">Ship to: {a.full_name}, {a.line1}, {a.city} {a.postal_code}, {a.country}</p>
        <h3>Total {money(cartTotal)}</h3>
        {err && <p className="error">{err}</p>}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button className="btn ghost" onClick={() => { setOrderId(null); setStep(1) }}>Back</button>
          <button className="btn" disabled={busy} onClick={toPayment}>{busy ? 'Please wait…' : 'Continue to payment'}</button>
        </div>
      </div>}
      {step === 3 && <form onSubmit={pay}>
        <h2>Payment</h2>
        <p className="muted" style={{ margin: '.5rem 0 1rem' }}>Demo gateway: no real payment is taken. Test cards: <b>4242 4242 4242 4242</b> (approved), <b>4000 0000 0000 0002</b> (declined), <b>4000 0000 0000 9995</b> (insufficient funds). Any future expiry, any 3-digit CVC.</p>
        {c('name', 'Name on card')}{c('card_number', 'Card number', '4242 4242 4242 4242')}
        <div className="row"><div>{c('expiry', 'Expiry (MM/YY)', '12/30')}</div><div>{c('cvc', 'CVC', '123')}</div></div>
        {err && <p className="error">{err}</p>}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button type="button" className="btn ghost" disabled={busy} onClick={() => setStep(2)}>Back</button>
          <button className="btn" disabled={busy}>{busy ? 'Processing…' : `Pay ${money(cartTotal)}`}</button>
        </div>
      </form>}
    </div>
  )
}
