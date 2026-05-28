import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Tracker from './components/Tracker'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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

  return user ? <Tracker user={user} /> : <Auth />
}
