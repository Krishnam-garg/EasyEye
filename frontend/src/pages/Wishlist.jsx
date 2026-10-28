import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import ProductCard from '../components/ProductCard'
import Reveal from '../components/Reveal'

export default function Wishlist() {
  const { wishlist } = useStore()
  return (
    <div className="container section">
      <h2 style={{ marginBottom: '3rem' }}>Saved frames</h2>
      {wishlist.length === 0 ? <><p className="muted" style={{ marginBottom: '2rem' }}>Nothing saved yet.</p><Link to="/shop" className="btn ghost">Browse frames</Link></>
        : <div className="grid">{wishlist.map((w, i) => <Reveal key={w.id} delay={(i % 3) * 110}><ProductCard product={w.products} /></Reveal>)}</div>}
    </div>
  )
}
