import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handle = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account, then log in.')
    } else if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) setError(error.message)
      else setMessage('Password reset link sent — check your email.')
    }
    setLoading(false)
  }

  return (
    <div style={S.root}>
      <div style={S.card}>
        <div style={S.brand}>SMOLOV JR.</div>
        <div style={S.title}>
          {mode === 'login' ? 'SIGN IN' : mode === 'signup' ? 'CREATE ACCOUNT' : 'RESET PASSWORD'}
        </div>

        <form onSubmit={handle} style={S.form}>
          <div>
            <label style={S.label}>EMAIL</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required style={S.input}
              autoComplete="email"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label style={S.label}>PASSWORD</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6} style={S.input}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          )}

          {error && <div style={S.error}>{error}</div>}
          {message && <div style={S.success}>{message}</div>}

          <button type="submit" disabled={loading} style={S.btn}>
            {loading ? 'LOADING…' : mode === 'login' ? 'SIGN IN' : mode === 'signup' ? 'CREATE ACCOUNT' : 'SEND RESET LINK'}
          </button>
        </form>

        <div style={S.footer}>
          {mode === 'login' && <>
            <button style={S.link} onClick={() => { setMode('signup'); setError(''); setMessage('') }}>
              Create account
            </button>
            <span style={{ color: '#2A2A2A' }}>·</span>
            <button style={S.link} onClick={() => { setMode('reset'); setError(''); setMessage('') }}>
              Forgot password
            </button>
          </>}
          {mode !== 'login' && (
            <button style={S.link} onClick={() => { setMode('login'); setError(''); setMessage('') }}>
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const S = {
  root: {
    minHeight: '100vh', background: '#0D0D0D',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px', fontFamily: "'DM Mono', monospace",
  },
  card: {
    width: '100%', maxWidth: 380,
    background: '#161616', border: '1px solid #2A2A2A',
    borderRadius: 6, padding: '32px 28px',
  },
  brand: {
    fontSize: 10, letterSpacing: 4, color: '#6A6A6A', marginBottom: 6,
  },
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 36, letterSpacing: 3, marginBottom: 28,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  label: { display: 'block', fontSize: 9, letterSpacing: 2, color: '#6A6A6A', marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 12px',
    background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 3,
    color: '#F0EDE6', fontFamily: "'DM Mono', monospace", fontSize: 14,
  },
  error: {
    fontSize: 11, color: '#E84747', padding: '8px 12px',
    border: '1px solid #E84747', borderRadius: 3, letterSpacing: 0.3,
  },
  success: {
    fontSize: 11, color: '#5CBA4A', padding: '8px 12px',
    border: '1px solid #5CBA4A', borderRadius: 3, letterSpacing: 0.3,
  },
  btn: {
    padding: '12px', background: '#F0EDE6', border: 'none', borderRadius: 3,
    color: '#0D0D0D', fontFamily: "'DM Mono', monospace",
    fontSize: 11, letterSpacing: 2, fontWeight: 500, cursor: 'pointer',
    marginTop: 4, transition: 'opacity 0.15s',
  },
  footer: {
    display: 'flex', gap: 12, justifyContent: 'center',
    marginTop: 20, flexWrap: 'wrap',
  },
  link: {
    background: 'none', border: 'none', color: '#6A6A6A',
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    cursor: 'pointer', letterSpacing: 0.5, textDecoration: 'underline',
  },
}
