import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Tracker from './components/Tracker'
import TrainingTracker from './components/TrainingTracker'
import ProgressLog from './components/ProgressLog'

const FONT_MONO = "'DM Mono', monospace"
const FONT_DISPLAY = "'Bebas Neue', sans-serif"

const SECTIONS = [
  {
    id: 'smolov',
    title: 'SMOLOV JR.',
    sub: '3-WEEK SQUAT CYCLE',
    accent: '#D9775C',
  },
  {
    id: 'training',
    title: 'TRAINING',
    sub: 'PUSH / PULL / SQUAT / HINGE',
    accent: '#7FA8C9',
  },
  {
    id: 'progress',
    title: 'PROGRESS LOG',
    sub: 'MAIN LIFT NUMBERS OVER TIME',
    accent: '#9BC97F',
  },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('home')

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
        fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 3, color: '#6A6A6A',
      }}>
        LOADING…
      </div>
    )
  }

  if (!user) return <Auth />

  const section = SECTIONS.find(s => s.id === mode)

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh' }}>

      {/* top bar (only inside a section) */}
      {mode !== 'home' && (
        <div style={{
          display: 'flex', alignItems: 'center',
          borderBottom: '1px solid #2A2A2A',
          maxWidth: 520, margin: '0 auto',
        }}>
          <button
            onClick={() => setMode('home')}
            style={{
              padding: '13px 16px',
              background: 'transparent', border: 'none',
              color: '#6A6A6A',
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 3,
              cursor: 'pointer', outline: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            ← HOME
          </button>
          <div style={{
            flex: 1, textAlign: 'center',
            paddingRight: 76, // balance the back button width
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 3,
            color: section?.accent ?? '#F0EDE6',
          }}>
            {section?.title}
          </div>
        </div>
      )}

      {/* home / landing */}
      <div style={{
        opacity: mode === 'home' ? 1 : 0,
        position: mode === 'home' ? 'relative' : 'absolute',
        width: '100%',
        pointerEvents: mode === 'home' ? 'auto' : 'none',
        transition: 'opacity 0.15s ease',
      }}>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '48px 16px 60px' }}>
          <div style={{
            fontFamily: FONT_DISPLAY, fontSize: 56, lineHeight: 0.95,
            color: '#F0EDE6', letterSpacing: 2,
          }}>
            TRAINING
            <br />
            SYSTEM
          </div>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 3,
            color: '#6A6A6A', marginTop: 12, marginBottom: 36,
          }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', month: 'short', day: 'numeric',
            }).toUpperCase()}
          </div>

          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setMode(s.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: '#141414',
                border: '1px solid #2A2A2A',
                borderLeft: `3px solid ${s.accent}`,
                padding: '22px 18px',
                marginBottom: 10,
                cursor: 'pointer', outline: 'none',
                WebkitTapHighlightColor: 'transparent',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              }}>
                <span style={{
                  fontFamily: FONT_DISPLAY, fontSize: 30, lineHeight: 1,
                  color: '#F0EDE6', letterSpacing: 1,
                }}>
                  {s.title}
                </span>
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 14, color: s.accent,
                }}>
                  →
                </span>
              </div>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 3,
                color: '#6A6A6A', marginTop: 8,
              }}>
                {s.sub}
              </div>
            </button>
          ))}

          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              marginTop: 28,
              background: 'transparent', border: 'none',
              color: '#3A3A3A',
              fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 3,
              cursor: 'pointer', outline: 'none', padding: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            SIGN OUT
          </button>
        </div>
      </div>

      {/* sections stay mounted, fade between them (no remount flash) */}
      <div style={{ position: 'relative' }}>
        <div style={{
          opacity: mode === 'smolov' ? 1 : 0,
          position: mode === 'smolov' ? 'relative' : 'absolute',
          width: '100%',
          pointerEvents: mode === 'smolov' ? 'auto' : 'none',
          transition: 'opacity 0.15s ease',
        }}>
          <Tracker user={user} />
        </div>
        <div style={{
          opacity: mode === 'training' ? 1 : 0,
          position: mode === 'training' ? 'relative' : 'absolute',
          width: '100%',
          pointerEvents: mode === 'training' ? 'auto' : 'none',
          transition: 'opacity 0.15s ease',
        }}>
          <TrainingTracker user={user} />
        </div>
        <div style={{
          opacity: mode === 'progress' ? 1 : 0,
          position: mode === 'progress' ? 'relative' : 'absolute',
          width: '100%',
          pointerEvents: mode === 'progress' ? 'auto' : 'none',
          transition: 'opacity 0.15s ease',
        }}>
          <ProgressLog user={user} />
        </div>
      </div>
    </div>
  )
}
