import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const StoreCtx = createContext(null)
export const useStore = () => useContext(StoreCtx)

// Cart + wishlist, persisted in Supabase (RLS scopes rows to the user).
export function StoreProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState([])
  const [wishlist, setWishlist] = useState([])

  const load = useCallback(async () => {
    if (!user) { setCart([]); setWishlist([]); return }
    const [c, w] = await Promise.all([
      supabase.from('cart_items').select('id, quantity, products(*)').order('id'),
      supabase.from('wishlist_items').select('id, products(*)'),
    ])
    setCart(c.data ?? []); setWishlist(w.data ?? [])
  }, [user])
  useEffect(() => { load() }, [load])

  const addToCart = async (product, qty = 1) => {
    if (!user) return false
    const existing = cart.find((i) => i.products.id === product.id)
    const quantity = Math.min((existing?.quantity ?? 0) + qty, product.stock_quantity)
    await supabase.from('cart_items').upsert({ user_id: user.id, product_id: product.id, quantity }, { onConflict: 'user_id,product_id' })
    await load(); return true
  }
  const setQty = async (id, quantity) => {
    if (quantity < 1) return removeFromCart(id)
    await supabase.from('cart_items').update({ quantity }).eq('id', id); load()
  }
  const removeFromCart = async (id) => { await supabase.from('cart_items').delete().eq('id', id); load() }

  const inWishlist = (pid) => wishlist.some((w) => w.products.id === pid)
  const toggleWishlist = async (pid) => {
    if (!user) return false
    const hit = wishlist.find((w) => w.products.id === pid)
    if (hit) await supabase.from('wishlist_items').delete().eq('id', hit.id)
    else await supabase.from('wishlist_items').insert({ user_id: user.id, product_id: pid })
    await load(); return true
  }

  const cartCount = cart.reduce((n, i) => n + i.quantity, 0)
  const cartTotal = cart.reduce((n, i) => n + i.quantity * Number(i.products.price), 0)
  return <StoreCtx.Provider value={{ cart, wishlist, cartCount, cartTotal, addToCart, setQty, removeFromCart, inWishlist, toggleWishlist, reload: load }}>{children}</StoreCtx.Provider>
}
