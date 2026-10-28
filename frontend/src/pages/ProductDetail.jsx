import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { money } from '../lib/api'
import Reveal from '../components/Reveal'

export default function ProductDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const { addToCart, inWishlist, toggleWishlist } = useStore()
  const [p, setP] = useState(null)
  const [idx, setIdx] = useState(0)
  const [origin, setOrigin] = useState('50% 50%')
  const [zoom, setZoom] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => { setIdx(0); supabase.from('products').select('*').eq('id', id).single().then(({ data }) => setP(data)) }, [id])
  if (!p) return <div className="container section"><div className="skel" style={{ maxWidth: 560 }} /></div>

  const imgs = p.image_urls ?? []
  const stockLabel = p.stock_quantity === 0 ? ['out', 'Out of stock'] : p.stock_quantity <= 3 ? ['low', `Only ${p.stock_quantity} left`] : ['', 'In stock']
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`)
  }
  const add = async () => {
    if (!user) return nav('/login', { state: { from: `/product/${id}` } })
    await addToCart(p); setAdded(true); setTimeout(() => setAdded(false), 2000)
  }
  const d = p.frame_details ?? {}

  return (
    <div className="container section">
      <div className="pdp">
        <Reveal>
          <div className="zoombox" onMouseMove={onMove} onMouseEnter={() => setZoom(true)} onMouseLeave={() => setZoom(false)}>
            <img key={imgs[idx]} src={imgs[idx]} alt={p.name} className="zimg" style={{ transformOrigin: origin, transform: zoom ? 'scale(2.1)' : 'scale(1)' }} />
          </div>
          <div className="thumbs">{imgs.map((u, i) => <img key={u} src={u} className={i === idx ? 'on' : ''} onClick={() => setIdx(i)} alt="" />)}</div>
        </Reveal>
        <Reveal delay={180}>
          <p className="eyebrow">{[p.frame_shape, p.material, p.color].filter(Boolean).join(' · ')}</p>
          <h1 style={{ fontSize: 'clamp(2.6rem, 5vw, 3.8rem)', margin: '.6rem 0 1rem' }}>{p.name}</h1>
          <div className="gold-rule" />
          <h3 className="pdp-price">{money(p.price)}</h3>
          <p className={`stock ${stockLabel[0]}`} style={{ margin: '1rem 0' }}>{stockLabel[1]}</p>
          <p>{p.description}</p>
          <div className="specs">
            {d.lens && <div><span className="muted">Lens</span><span>{d.lens}</span></div>}
            {d.width_mm && <div><span className="muted">Dimensions</span><span>{d.width_mm} · {d.bridge_mm} · {d.temple_mm} mm</span></div>}
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn" disabled={p.stock_quantity === 0} onClick={add}>{added ? 'Added ✓' : 'Add to cart'}</button>
            <button className="btn ghost" onClick={() => user ? toggleWishlist(p.id) : nav('/login')}>{inWishlist(p.id) ? 'Saved ♥' : 'Save ♡'}</button>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
