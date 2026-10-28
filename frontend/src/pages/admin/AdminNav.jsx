import { Link, useLocation } from 'react-router-dom'
export default function AdminNav() {
  const { pathname } = useLocation()
  return <div className="admin-bar">
    <Link to="/admin" style={{ fontWeight: pathname === '/admin' ? 500 : 300 }}>Inventory</Link>
    <Link to="/admin/orders" style={{ fontWeight: pathname.includes('orders') ? 500 : 300 }}>Orders</Link>
  </div>
}
