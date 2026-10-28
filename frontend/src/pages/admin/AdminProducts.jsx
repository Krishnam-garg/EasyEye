import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { api, money } from '../../lib/api'
import AdminNav from './AdminNav'

const BUCKET = 'product-images'
const MAX_MB = 5
const EMPTY = { name: '', description: '', price: '', stock_quantity: 0, frame_shape: '', material: '', color: '', lens: '', images: [] }

// Returns the storage path if the URL points at our bucket, else null (e.g. external placeholder URLs).
const storagePath = (url) => { const m = url.match(new RegExp(`/${BUCKET}/(.+)$`)); return m ? decodeURIComponent(m[1]) : null }
const removeFromStorage = async (urls) => {
  const paths = urls.map(storagePath).filter(Boolean)
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths)
}

export default function AdminProducts() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(null)
  const [editId, setEditId] = useState(null)
  const [removed, setRemoved] = useState([])     // images removed in this edit; deleted from storage on save
  const [uploaded, setUploaded] = useState([])   // images uploaded in this edit; deleted from storage on cancel
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef()

  const load = () => supabase.from('products').select('*').order('created_at', { ascending: false }).then(({ data }) => setItems(data ?? []))
  useEffect(() => { load() }, [])

  const reset = () => { setForm(null); setEditId(null); setRemoved([]); setUploaded([]); setUrlInput(''); setErr('') }
  const edit = (p) => { reset(); setEditId(p.id); setForm({ ...EMPTY, ...p, lens: p.frame_details?.lens ?? '', images: p.image_urls ?? [] }) }
  const cancel = async () => { await removeFromStorage(uploaded); reset() }   // don't leave orphan uploads behind

  const onFiles = async (e) => {
    const files = [...e.target.files]; e.target.value = ''
    if (!files.length) return
    setUploading(true); setErr('')
    const urls = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) { setErr(`${file.name} is not an image.`); continue }
      if (file.size > MAX_MB * 1024 * 1024) { setErr(`${file.name} is over ${MAX_MB} MB.`); continue }
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })
      if (error) { setErr(`Upload failed: ${error.message}`); continue }
      urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl)
    }
    setForm((f) => ({ ...f, images: [...f.images, ...urls] }))
    setUploaded((u) => [...u, ...urls])
    setUploading(false)
  }
  const addUrl = () => {
    const u = urlInput.trim(); if (!u) return
    setForm((f) => ({ ...f, images: [...f.images, u] })); setUrlInput('')
  }
  const dropImage = (url) => {
    setForm((f) => ({ ...f, images: f.images.filter((x) => x !== url) }))
    if (uploaded.includes(url)) { removeFromStorage([url]); setUploaded((u) => u.filter((x) => x !== url)) }  // never saved, safe to delete now
    else setRemoved((r) => [...r, url])                                                                       // saved earlier, delete only once the product is saved
  }
  const makeMain = (url) => setForm((f) => ({ ...f, images: [url, ...f.images.filter((x) => x !== url)] }))

  const save = async (e) => {
    e.preventDefault(); setErr('')
    const body = {
      name: form.name, description: form.description, price: Number(form.price), stock_quantity: Number(form.stock_quantity),
      frame_shape: form.frame_shape || null, material: form.material || null, color: form.color || null,
      frame_details: { ...(form.frame_details ?? {}), lens: form.lens },
      image_urls: form.images,
    }
    try {
      await api(editId ? `/products/${editId}` : '/products', { method: editId ? 'PUT' : 'POST', body })
      await removeFromStorage(removed)
      reset(); load()
    } catch (e) { setErr(e.message) }
  }
  const del = async (p) => {
    if (!confirm(`Delete ${p.name}?`)) return
    await api(`/products/${p.id}`, { method: 'DELETE' })
    await removeFromStorage(p.image_urls ?? [])
    load()
  }
  const f = (k, label, type = 'text') => <><label>{label}</label><input type={type} value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></>

  return (
    <div className="container section">
      <AdminNav />
      {form ? (
        <form onSubmit={save} style={{ maxWidth: 560 }}>
          <h2>{editId ? 'Edit frame' : 'New frame'}</h2>
          {f('name', 'Name')}{f('description', 'Description')}
          <div className="row"><div>{f('price', 'Price', 'number')}</div><div>{f('stock_quantity', 'Stock', 'number')}</div></div>
          <div className="row"><div>{f('frame_shape', 'Shape')}</div><div>{f('material', 'Material')}</div></div>
          {f('color', 'Colour')}{f('lens', 'Lens technology')}

          <label>Images</label>
          <div className="imgs">
            {form.images.map((u, i) => (
              <div key={u} className="imgbox">
                <img src={u} alt="" />
                {i === 0 && <span className="tag">Main</span>}
                <div className="imgactions">
                  {i !== 0 && <button type="button" onClick={() => makeMain(u)}>Make main</button>}
                  <button type="button" onClick={() => dropImage(u)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
            <button type="button" className="btn ghost" disabled={uploading} onClick={() => fileRef.current.click()}>{uploading ? 'Uploading…' : 'Upload images'}</button>
            <span className="muted" style={{ fontSize: '.8rem' }}>JPG/PNG/WebP, up to {MAX_MB} MB each</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
            <input placeholder="…or paste an image URL" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
            <button type="button" className="link" onClick={addUrl}>Add</button>
          </div>

          {err && <p className="error">{err}</p>}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button className="btn" disabled={uploading}>Save</button><button type="button" className="btn ghost" onClick={cancel}>Cancel</button>
          </div>
        </form>
      ) : <>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>Inventory</h2><button className="btn" onClick={() => { reset(); setForm(EMPTY) }}>Add frame</button>
        </div>
        <table><thead><tr><th /><th>Name</th><th>Price</th><th>Stock</th><th /></tr></thead>
          <tbody>{items.map((p) => <tr key={p.id}>
            <td style={{ width: 64 }}>{p.image_urls?.[0] && <img src={p.image_urls[0]} alt="" style={{ width: 48, height: 48, objectFit: 'cover' }} />}</td>
            <td>{p.name}</td><td>{money(p.price)}</td><td>{p.stock_quantity}</td>
            <td style={{ textAlign: 'right' }}><button className="link" onClick={() => edit(p)}>Edit</button> · <button className="link" onClick={() => del(p)}>Delete</button></td></tr>)}</tbody></table>
      </>}
    </div>
  )
}
