import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { money } from '../lib/api'

export default function ProductCard({ product: p }) {
  const { user } = useAuth()
  const { inWishlist, toggleWishlist } = useStore()
  const nav = useNavigate()
  const [ready, setReady] = useState(false)
  const saved = inWishlist(p.id)
  const tag = p.stock_quantity === 0 ? 'Sold out' : p.stock_quantity <= 3 ? 'Low stock' : null
  return (
    <div className="card">
      <div className="img">
        <Link to={`/product/${p.id}`}>
          <img className={`main ${ready ? 'ready' : ''}`} src={p.image_urls?.[0]} alt={p.name} loading="lazy"
            ref={(el) => { if (el?.complete && !ready) setReady(true) }} onLoad={() => setReady(true)} />
          {p.image_urls?.[1] && <img className="alt" src={p.image_urls[1]} alt="" loading="lazy" />}
        </Link>
        {tag && <span className="tag">{tag}</span>}
        <button className={`heart ${saved ? 'on' : ''}`} aria-label="Save to wishlist" onClick={() => user ? toggleWishlist(p.id) : nav('/login')}>
          {saved ? '♥' : '♡'}
        </button>
      </div>
      <div className="card-info">
        <h3><Link to={`/product/${p.id}`}>{p.name}</Link></h3>
        <span className="price">{money(p.price)}</span>
      </div>
      <p className="muted small">{[p.frame_shape, p.material, p.color].filter(Boolean).join(' · ')}</p>
    </div>
  )
}
