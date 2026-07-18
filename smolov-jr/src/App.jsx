import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Tracker from './components/Tracker'
import TrainingTracker from './components/TrainingTracker'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('smolov') // 'smolov' | 'training'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0D0D0D', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 3, color: '#6A6A6A'
      }}>
        LOADING…
      </div>
    )
  }

  if (!user) return <Auth />

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh' }}>
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #2A2A2A',
        maxWidth: 520,
        margin: '0 auto',
      }}>
        {[['smolov', 'SMOLOV JR.'], ['training', 'TRAINING']].map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              padding: '13px 8px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${mode === m ? '#F0EDE6' : 'transparent'}`,
              color: mode === m ? '#F0EDE6' : '#6A6A6A',
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: 3,
              cursor: 'pointer',
              transition: 'all 0.15s',
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',

            }}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === 'smolov' ? <Tracker user={user} /> : <TrainingTracker user={user} />}
    </div>
  )
}
