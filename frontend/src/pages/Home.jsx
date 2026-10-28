import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { onScroll } from '../lib/motion'
import ProductCard from '../components/ProductCard'
import Reveal from '../components/Reveal'

const SHAPES = [['Round', 'Soft, timeless'], ['Aviator', 'Bold, confident'], ['Square', 'Structured, modern'], ['Rectangle', 'Clean, understated']]
const Ornament = () => <Reveal className="ornament"><i /></Reveal>

export default function Home() {
  const [featured, setFeatured] = useState(null)
  const inner = useRef(null)
  useEffect(() => {
    supabase.from('products').select('*').gt('stock_quantity', 0).order('created_at', { ascending: false }).limit(3)
      .then(({ data }) => setFeatured(data ?? []))
  }, [])
  // Hero text drifts slower than the page and fades as you scroll away.
  useEffect(() => onScroll((y) => {
    if (!inner.current) return
    inner.current.style.transform = `translate3d(0, ${(y * 0.22).toFixed(1)}px, 0)`
    inner.current.style.opacity = Math.max(0, 1 - y / 650).toFixed(2)
  }), [])
  return (
    <>
      <section className="hero">
        <div className="container hero-inner" ref={inner}>
          <p className="eyebrow fade-in">The 2026 Collection</p>
          <h1 className="fade-in" style={{ animationDelay: '.2s' }}>See <em>beautifully.</em></h1>
          <p className="hero-sub fade-in" style={{ animationDelay: '.4s' }}>Titanium, hand-polished acetate, and nothing superfluous.</p>
          <div className="fade-in" style={{ animationDelay: '.6s' }}><Link to="/shop" className="btn">Explore the collection</Link></div>
        </div>
        <span className="scroll-cue">Scroll</span>
      </section>

      <section className="section container">
        <Reveal className="section-head"><div><p className="eyebrow">Shop by shape</p><h2>Find your frame</h2></div></Reveal>
        <div className="shape-grid">
          {SHAPES.map(([s, d], i) => (
            <Reveal key={s} delay={i * 110}><Link to={`/shop?shape=${s}`} className="shape-tile"><h3>{s}</h3><span className="muted small">{d}</span><span className="arrow">→</span></Link></Reveal>
          ))}
        </div>
      </section>

      <Ornament />

      <section className="section container">
        <Reveal className="section-head"><div><p className="eyebrow">Trending</p><h2>New arrivals</h2></div><Link to="/shop" className="link">View all</Link></Reveal>
        {featured === null
          ? <div className="grid">{[0, 1, 2].map((i) => <div key={i} className="skel" />)}</div>
          : <div className="grid">{featured.map((p, i) => <Reveal key={p.id} delay={i * 130}><ProductCard product={p} /></Reveal>)}</div>}
      </section>

      <section className="story">
        <div className="container story-grid">
          <Reveal><p className="eyebrow">Unspoken Splendor.</p><h2>Luxury<br /><em>Without the Noise.</em></h2></Reveal>
          <Reveal delay={200}>
            <p>An effortless statement of elegance that elevates your vision without ever demanding attention. This is luxury without the noise: thoughtful, minimal, and designed to be felt, not just seen.</p>
            <div className="values">
              <div><h4>Lightweight</h4><span>Frames from 14 g</span></div>
              <div><h4>Considered</h4><span>Minimal, durable detail</span></div>
              <div><h4>Complimentary</h4><span>Shipping and returns</span></div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
