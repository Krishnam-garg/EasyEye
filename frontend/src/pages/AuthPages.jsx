import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AuthForm({ mode }) {
  const { signIn, signUp } = useAuth()
  const nav = useNavigate()
  const from = useLocation().state?.from || '/'
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [err, setErr] = useState(''); const [info, setInfo] = useState('')
  const up = mode === 'signup'

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    const { data, error } = up ? await signUp(f.email, f.password, f.name) : await signIn(f.email, f.password)
    if (error) return setErr(error.message)
    if (up && !data.session) return setInfo('Check your email to confirm your account, then sign in.')
    nav(from, { replace: true })
  }
  return (
    <form className="narrow" onSubmit={submit}>
      <h2>{up ? 'Create account' : 'Welcome back'}</h2>
      {up && <><label>Full name</label><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></>}
      <label>Email</label><input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <label>Password</label><input type="password" minLength={6} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      {err && <p className="error">{err}</p>}{info && <p className="muted" style={{ marginTop: '1rem' }}>{info}</p>}
      <button className="btn" style={{ marginTop: '2rem', width: '100%' }}>{up ? 'Sign up' : 'Sign in'}</button>
      <p className="muted" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        {up ? <>Have an account? <Link to="/login" className="link">Sign in</Link></> : <>New here? <Link to="/signup" className="link">Create an account</Link></>}
      </p>
    </form>
  )
}
export const Login = () => <AuthForm mode="login" />
export const Signup = () => <AuthForm mode="signup" />
