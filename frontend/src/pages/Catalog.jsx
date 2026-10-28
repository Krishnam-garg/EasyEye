import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import Reveal from '../components/Reveal'

const SHAPES = ['Round', 'Square', 'Aviator', 'Rectangle', 'Cat-eye']
const MATERIALS = ['Titanium', 'Acetate', 'Metal']
const COLORS = ['Black', 'Gold', 'Silver', 'Tortoise']

function Group({ title, options, value, onChange }) {
  return (
    <>
      <h4>{title}</h4>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>{options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </>
  )
}

export default function Catalog() {
  const [params] = useSearchParams()
  const [f, setF] = useState({ q: '', shape: params.get('shape') || '', material: '', color: '', max: '', sort: 'new' })
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }))

  useEffect(() => {
    const t = setTimeout(async () => {   // debounce search typing
      let q = supabase.from('products').select('*')
      if (f.q) q = q.ilike('name', `%${f.q}%`)
      if (f.shape) q = q.eq('frame_shape', f.shape)
      if (f.material) q = q.eq('material', f.material)
      if (f.color) q = q.eq('color', f.color)
      if (f.max) q = q.lte('price', Number(f.max))
      const [col, asc] = { new: ['created_at', false], low: ['price', true], high: ['price', false] }[f.sort]
      const { data } = await q.order(col, { ascending: asc })
      setItems(data ?? []); setLoading(false)
    }, 250)
    return () => clearTimeout(t)
  }, [f])

  return (
    <div className="container section">
      <p className="eyebrow">Eyewear</p><h2 style={{ margin: '.4rem 0 3.5rem' }}>The Collection</h2>
      <div className="catalog">
        <aside className="filters">
          <h4 style={{ marginTop: 0 }}>Search</h4>
          <input placeholder="Frame name" value={f.q} onChange={(e) => set('q')(e.target.value)} />
          <Group title="Shape" options={SHAPES} value={f.shape} onChange={set('shape')} />
          <Group title="Material" options={MATERIALS} value={f.material} onChange={set('material')} />
          <Group title="Colour" options={COLORS} value={f.color} onChange={set('color')} />
          <h4>Max price (USD)</h4>
          <input type="number" min="0" placeholder="e.g. 400" value={f.max} onChange={(e) => set('max')(e.target.value)} />
          <h4>Sort</h4>
          <select value={f.sort} onChange={(e) => set('sort')(e.target.value)}>
            <option value="new">Newest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option>
          </select>
        </aside>
        <div>
          {loading ? <div className="grid">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skel" />)}</div> : items.length === 0 ? <p className="muted">No frames match your filters.</p>
            : <div className="grid">{items.map((p, i) => <Reveal key={p.id} delay={(i % 3) * 110}><ProductCard product={p} /></Reveal>)}</div>}
        </div>
      </div>
    </div>
  )
}
