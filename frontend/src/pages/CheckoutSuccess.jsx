import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'

export default function CheckoutSuccess() {
  const { reload } = useStore()
  useEffect(() => { reload() }, [])   // payment already cleared the cart server-side
  return (
    <div className="container section" style={{ textAlign: 'center' }}>
      <p className="eyebrow">Thank you</p>
      <h2 style={{ margin: '1rem 0' }}>Your order is confirmed.</h2>
      <p className="muted" style={{ marginBottom: '2rem' }}>We'll update you as it moves through fulfilment.</p>
      <Link to="/account" className="btn">View orders</Link>
    </div>
  )
}
