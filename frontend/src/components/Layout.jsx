import { useEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import ThreadBackground from './ThreadBackground'
import { onScroll, scrollToTop } from '../lib/motion'

function ScrollProgress() {
  const ref = useRef(null)
  useEffect(() => onScroll((y) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    if (ref.current) ref.current.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`
  }), [])
  return <span ref={ref} className="progress" />
}

export default function Layout() {
  const { user, isAdmin, signOut } = useAuth()
  const { cartCount } = useStore()
  const { pathname } = useLocation()
  useEffect(() => { scrollToTop() }, [pathname])
  return (
    <>
      <ThreadBackground />
      <div className="app">
        <header className="nav">
          <div className="container">
            <ul><li><Link to="/shop">Collection</Link></li>{isAdmin && <li><Link to="/admin">Admin</Link></li>}</ul>
            <Link to="/" className="logo">Easy Eye</Link>
            <ul className="right">
              {user ? <><li><Link to="/wishlist">Saved</Link></li><li><Link to="/account">Account</Link></li><li><button className="link" onClick={signOut}>Logout</button></li></>
                    : <li><Link to="/login">Sign in</Link></li>}
              <li><Link to="/cart">Cart <span key={cartCount} className="bump">({cartCount})</span></Link></li>
            </ul>
          </div>
          <ScrollProgress />
        </header>
        <main key={pathname} className="page"><Outlet /></main>
        <footer className="footer"><div className="container">
          <div className="footer-grid">
            <div><div className="logo">Easy Eye</div><p style={{ marginTop: '1rem', maxWidth: 320 }}>Considered eyewear in titanium and hand-polished acetate.</p></div>
            <div><h4>Shop</h4><Link to="/shop">All frames</Link><Link to="/shop?shape=Round">Round</Link><Link to="/shop?shape=Aviator">Aviator</Link></div>
            <div><h4>Account</h4><Link to="/account">Orders</Link><Link to="/wishlist">Saved frames</Link><Link to="/cart">Cart</Link></div>
          </div>
          <p className="footer-note">© 2026 Easy Eye · Course project. Payments are simulated.</p>
        </div></footer>
      </div>
    </>
  )
}
