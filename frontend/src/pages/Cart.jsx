import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { money } from '../lib/api'

export default function Cart() {
  const { user } = useAuth()
  const { cart, cartTotal, setQty, removeFromCart } = useStore()
  const nav = useNavigate()
  if (!user) return <div className="container section"><h2>Your cart</h2><p className="muted" style={{ margin: '1rem 0 2rem' }}>Sign in to save items to your cart.</p><Link to="/login" className="btn">Sign in</Link></div>
  return (
    <div className="container section">
      <h2 style={{ marginBottom: '2rem' }}>Your cart</h2>
      {cart.length === 0 ? <><p className="muted" style={{ marginBottom: '2rem' }}>Your cart is empty.</p><Link to="/shop" className="btn ghost">Browse frames</Link></> : <>
        <table>
          <thead><tr><th>Frame</th><th>Qty</th><th>Price</th><th /></tr></thead>
          <tbody>{cart.map((i) => (
            <tr key={i.id}>
              <td><Link to={`/product/${i.products.id}`}>{i.products.name}</Link></td>
              <td>
                <button className="link" onClick={() => setQty(i.id, i.quantity - 1)}>−</button>
                <span style={{ margin: '0 .8rem' }}>{i.quantity}</span>
                <button className="link" disabled={i.quantity >= i.products.stock_quantity} onClick={() => setQty(i.id, i.quantity + 1)}>+</button>
              </td>
              <td>{money(i.quantity * i.products.price)}</td>
              <td><button className="link" onClick={() => removeFromCart(i.id)}>Remove</button></td>
            </tr>))}</tbody>
        </table>
        <div style={{ textAlign: 'right', marginTop: '2rem' }}>
          <h3>Total {money(cartTotal)}</h3>
          <button className="btn" style={{ marginTop: '1.5rem' }} onClick={() => nav('/checkout')}>Checkout</button>
        </div>
      </>}
    </div>
  )
}
