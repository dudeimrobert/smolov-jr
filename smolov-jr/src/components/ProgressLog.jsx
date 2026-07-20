import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ---------------------------------------------------------------------------
// PROGRESS LOG
// Tracks working numbers over time for the main lifts.
// Same single-row-per-user JSONB sync pattern as the other trackers,
// stored in the `progress_data` table.
// ---------------------------------------------------------------------------

const FONT_MONO = "'DM Mono', monospace"
const FONT_DISPLAY = "'Bebas Neue', sans-serif"

const C = {
  bg: '#0D0D0D',
  panel: '#141414',
  border: '#2A2A2A',
  text: '#F0EDE6',
  muted: '#6A6A6A',
  dim: '#3A3A3A',
}

const DEFAULT_LIFTS = [
  { id: 'squat', name: 'SQUAT', accent: '#D9775C' },
  { id: 'bench', name: 'BENCH', accent: '#7FA8C9' },
  { id: 'deadlift', name: 'DEADLIFT', accent: '#9BC97F' },
  { id: 'ohp', name: 'OHP', accent: '#C9A85C' },
]

const CUSTOM_ACCENTS = ['#B08CC9', '#C97FA8', '#7FC9B8', '#C9C27F']

// ---- auto-import from training_data.history -------------------------------
// Maps training tracker exercise keys -> progress log lift ids.
// Accessories are intentionally excluded, only 1RM-relevant mains.
const AUTO_LIFT_MAP = {
  backsquat: 'squat',
  bench: 'bench',
  deadlift: 'deadlift',
  ohp: 'ohp',
}

// Fallback reps for history entries logged before the tracker stored reps.
// New entries carry their own reps (main lifts 5, ohp accessory 10-15 -> 10).
const AUTO_REPS = {
  backsquat: 5,
  bench: 5,
  deadlift: 5,
  ohp: 10,
}

const emptyState = () => ({
  lifts: DEFAULT_LIFTS.map(l => ({ ...l, entries: [] })),
  ignoredAuto: [],
})

// Epley estimated 1RM
const e1rm = (weight, reps) =>
  reps === 1 ? weight : Math.round(weight * (1 + reps / 30))

const today = () => new Date().toISOString().slice(0, 10)

const fmtDate = iso => {
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y.slice(2)}`
}

// ---------------------------------------------------------------------------

export default function ProgressLog({ user }) {
  const [state, setState] = useState(emptyState)
  const [loaded, setLoaded] = useState(false)
  const [activeLift, setActiveLift] = useState('squat')
  const [form, setForm] = useState({ weight: '', reps: '', date: today(), note: '' })
  const [addingLift, setAddingLift] = useState(false)
  const [newLiftName, setNewLiftName] = useState('')
  const [autoByLift, setAutoByLift] = useState({})
  const saveTimer = useRef(null)
  const skipNextSave = useRef(true)

  // ---- load --------------------------------------------------------------
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const local = localStorage.getItem('progress-log')
      if (local) {
        try { setState(JSON.parse(local)) } catch {}
      }
      const [progRes, trainRes] = await Promise.all([
        supabase.from('progress_data').select('data').eq('user_id', user.id).maybeSingle(),
        supabase.from('training_data').select('data').eq('user_id', user.id).maybeSingle(),
      ])
      if (!cancelled && !progRes.error && progRes.data?.data?.lifts) {
        skipNextSave.current = true
        setState({ ignoredAuto: [], ...progRes.data.data })
      }
      if (!cancelled && !trainRes.error && trainRes.data?.data?.history) {
        setAutoByLift(buildAutoEntries(trainRes.data.data.history))
      }
      if (!cancelled) setLoaded(true)
    }
    load()
    return () => { cancelled = true }
  }, [user.id])

  // ---- debounced save ----------------------------------------------------
  useEffect(() => {
    if (!loaded) return
    if (skipNextSave.current) { skipNextSave.current = false; return }
    localStorage.setItem('progress-log', JSON.stringify(state))
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await supabase.from('progress_data').upsert(
        { user_id: user.id, data: state, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    }, 800)
    return () => clearTimeout(saveTimer.current)
  }, [state, loaded, user.id])

  // ---- derived -----------------------------------------------------------
  const lift = state.lifts.find(l => l.id === activeLift) || state.lifts[0]

  const manual = lift ? lift.entries : []
  const ignored = state.ignoredAuto || []

  // auto entries: skip ignored ones, and skip any that duplicate a manual
  // entry on the same date at the same weight
  const auto = (autoByLift[lift?.id] || []).filter(a =>
    !ignored.includes(a.id) &&
    !manual.some(m => m.date === a.date && m.weight === a.weight)
  )

  const sorted = lift
    ? [...manual, ...auto].sort((a, b) => (a.date < b.date ? 1 : -1))
    : []

  const best = sorted.reduce(
    (acc, e) => (e1rm(e.weight, e.reps) > (acc ? e1rm(acc.weight, acc.reps) : 0) ? e : acc),
    null
  )
  const latest = sorted[0] || null

  // chronological e1RM series for the sparkline
  const series = [...sorted].reverse().map(e => e1rm(e.weight, e.reps))

  // ---- actions -----------------------------------------------------------
  const addEntry = () => {
    const w = parseFloat(form.weight)
    const r = parseInt(form.reps, 10)
    if (!w || !r) return
    const entry = {
      id: Date.now().toString(36),
      date: form.date || today(),
      weight: w,
      reps: r,
      note: form.note.trim(),
    }
    setState(s => ({
      ...s,
      lifts: s.lifts.map(l =>
        l.id === lift.id ? { ...l, entries: [...l.entries, entry] } : l
      ),
    }))
    setForm({ weight: '', reps: '', date: today(), note: '' })
  }

  const deleteEntry = (id, isAuto) => {
    if (isAuto) {
      // auto entries are derived, not stored - hide via persistent ignore list
      setState(s => ({ ...s, ignoredAuto: [...(s.ignoredAuto || []), id] }))
      return
    }
    setState(s => ({
      ...s,
      lifts: s.lifts.map(l =>
        l.id === lift.id ? { ...l, entries: l.entries.filter(e => e.id !== id) } : l
      ),
    }))
  }

  const addLift = () => {
    const name = newLiftName.trim().toUpperCase()
    if (!name) return
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    if (state.lifts.some(l => l.id === id)) { setAddingLift(false); return }
    const accent = CUSTOM_ACCENTS[(state.lifts.length - DEFAULT_LIFTS.length) % CUSTOM_ACCENTS.length]
    setState(s => ({ ...s, lifts: [...s.lifts, { id, name, accent, entries: [] }] }))
    setNewLiftName('')
    setAddingLift(false)
    setActiveLift(id)
  }

  // ---- ui bits -----------------------------------------------------------
  const label = { fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 3, color: C.muted }

  const input = {
    background: C.panel,
    border: `1px solid ${C.border}`,
    color: C.text,
    fontFamily: FONT_MONO,
    fontSize: 13,
    letterSpacing: 1,
    padding: '10px 10px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    borderRadius: 0,
    WebkitAppearance: 'none',
  }

  if (!loaded) {
    return (
      <div style={{
        padding: 40, textAlign: 'center',
        fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 3, color: C.muted,
      }}>
        LOADING…
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px 60px' }}>

      {/* lift selector */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {state.lifts.map(l => (
          <button
            key={l.id}
            onClick={() => setActiveLift(l.id)}
            style={{
              padding: '8px 12px',
              background: activeLift === l.id ? C.panel : 'transparent',
              border: `1px solid ${activeLift === l.id ? l.accent : C.border}`,
              color: activeLift === l.id ? l.accent : C.muted,
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 2,
              cursor: 'pointer', outline: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {l.name}
          </button>
        ))}
        {addingLift ? (
          <div style={{ display: 'flex', gap: 6, width: '100%' }}>
            <input
              autoFocus
              value={newLiftName}
              onChange={e => setNewLiftName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addLift()}
              placeholder="LIFT NAME"
              style={{ ...input, flex: 1 }}
            />
            <button onClick={addLift} style={{
              padding: '8px 14px', background: 'transparent',
              border: `1px solid ${C.text}`, color: C.text,
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 2,
              cursor: 'pointer', outline: 'none',
            }}>ADD</button>
            <button onClick={() => setAddingLift(false)} style={{
              padding: '8px 10px', background: 'transparent',
              border: `1px solid ${C.border}`, color: C.muted,
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 2,
              cursor: 'pointer', outline: 'none',
            }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setAddingLift(true)} style={{
            padding: '8px 12px', background: 'transparent',
            border: `1px dashed ${C.dim}`, color: C.dim,
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 2,
            cursor: 'pointer', outline: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}>+</button>
        )}
      </div>

      {/* headline numbers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
        background: C.border, border: `1px solid ${C.border}`, marginBottom: 20,
      }}>
        <div style={{ background: C.bg, padding: '16px 14px' }}>
          <div style={label}>BEST EST. 1RM</div>
          <div style={{
            fontFamily: FONT_DISPLAY, fontSize: 42, lineHeight: 1,
            color: lift.accent, marginTop: 8,
          }}>
            {best ? e1rm(best.weight, best.reps) : '—'}
          </div>
          {best && (
            <div style={{ ...label, marginTop: 6 }}>
              {best.weight}×{best.reps} · {fmtDate(best.date)}
            </div>
          )}
        </div>
        <div style={{ background: C.bg, padding: '16px 14px' }}>
          <div style={label}>LATEST</div>
          <div style={{
            fontFamily: FONT_DISPLAY, fontSize: 42, lineHeight: 1,
            color: C.text, marginTop: 8,
          }}>
            {latest ? `${latest.weight}×${latest.reps}` : '—'}
          </div>
          {latest && (
            <div style={{ ...label, marginTop: 6 }}>
              E1RM {e1rm(latest.weight, latest.reps)} · {fmtDate(latest.date)}
            </div>
          )}
        </div>
      </div>

      {/* sparkline */}
      {series.length >= 2 && (
        <div style={{ border: `1px solid ${C.border}`, padding: '14px 14px 10px', marginBottom: 20 }}>
          <div style={{ ...label, marginBottom: 10 }}>EST. 1RM TREND</div>
          <Sparkline data={series} color={lift.accent} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={label}>{fmtDate([...sorted].reverse()[0].date)}</span>
            <span style={label}>{fmtDate(sorted[0].date)}</span>
          </div>
        </div>
      )}

      {/* add entry */}
      <div style={{ border: `1px solid ${C.border}`, padding: 14, marginBottom: 20 }}>
        <div style={{ ...label, marginBottom: 10 }}>LOG SET · {lift.name}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
          <input
            type="number" inputMode="decimal" placeholder="WEIGHT"
            value={form.weight}
            onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
            style={input}
          />
          <input
            type="number" inputMode="numeric" placeholder="REPS"
            value={form.reps}
            onChange={e => setForm(f => ({ ...f, reps: e.target.value }))}
            style={input}
          />
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            style={{ ...input, fontSize: 11 }}
          />
        </div>
        <input
          placeholder="NOTE (OPTIONAL)"
          value={form.note}
          onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && addEntry()}
          style={{ ...input, marginBottom: 8 }}
        />
        <button
          onClick={addEntry}
          disabled={!form.weight || !form.reps}
          style={{
            width: '100%', padding: '12px 0',
            background: form.weight && form.reps ? lift.accent : C.panel,
            border: 'none',
            color: form.weight && form.reps ? '#0D0D0D' : C.dim,
            fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 3,
            cursor: form.weight && form.reps ? 'pointer' : 'default',
            outline: 'none', WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.15s',
          }}
        >
          LOG ENTRY
          {form.weight && form.reps
            ? ` · E1RM ${e1rm(parseFloat(form.weight) || 0, parseInt(form.reps, 10) || 1)}`
            : ''}
        </button>
      </div>

      {/* history */}
      <div style={{ ...label, marginBottom: 10 }}>
        HISTORY · {sorted.length} {sorted.length === 1 ? 'ENTRY' : 'ENTRIES'}
      </div>
      {sorted.length === 0 && (
        <div style={{
          border: `1px dashed ${C.dim}`, padding: 24, textAlign: 'center',
          fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 2, color: C.dim,
        }}>
          NO ENTRIES YET
        </div>
      )}
      {sorted.map(e => {
        const isBest = best && e.id === best.id
        return (
          <div key={e.id} style={{
            display: 'flex', alignItems: 'center',
            border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${isBest ? lift.accent : C.border}`,
            padding: '10px 12px', marginBottom: 6,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 13, letterSpacing: 1, color: C.text,
              }}>
                {e.weight}×{e.reps}
                <span style={{ color: C.muted, marginLeft: 10, fontSize: 10, letterSpacing: 2 }}>
                  E1RM {e1rm(e.weight, e.reps)}{isBest ? ' · PR' : ''}
                </span>
              </div>
              <div style={{ ...label, marginTop: 3 }}>
                {fmtDate(e.date)}
                {e.auto ? ' · AUTO · TRAINING' : ''}
                {e.note ? ` · ${e.note.toUpperCase()}` : ''}
              </div>
            </div>
            <button
              onClick={() => deleteEntry(e.id, e.auto)}
              style={{
                background: 'transparent', border: 'none', color: C.dim,
                fontFamily: FONT_MONO, fontSize: 12, cursor: 'pointer',
                padding: '4px 6px', outline: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
              aria-label="delete entry"
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------

// Converts training_data.history into progress log entries, grouped by lift id.
// One entry per (exercise, date), keeping the heaviest weight if a date repeats.
function buildAutoEntries(history) {
  const byLift = {}
  for (const [ex, liftId] of Object.entries(AUTO_LIFT_MAP)) {
    const items = Array.isArray(history[ex]) ? history[ex] : []
    const byDate = {}
    for (const item of items) {
      if (!item?.date || !item?.weight) continue
      const w = parseFloat(item.weight)
      if (!w) continue
      const r = parseInt(item.reps, 10) || AUTO_REPS[ex] || 5
      const cand = { weight: w, reps: r }
      if (!byDate[item.date] || e1rm(w, r) > e1rm(byDate[item.date].weight, byDate[item.date].reps)) {
        byDate[item.date] = cand
      }
    }
    const entries = Object.entries(byDate).map(([date, { weight, reps }]) => ({
      id: `auto-${ex}-${date}-${weight}`,
      date,
      weight,
      reps,
      note: '',
      auto: true,
    }))
    if (entries.length) {
      byLift[liftId] = [...(byLift[liftId] || []), ...entries]
    }
  }
  return byLift
}

function Sparkline({ data, color }) {
  const w = 460, h = 60, pad = 4
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 60, display: 'block' }}>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p, i) => {
        const [x, y] = p.split(',')
        return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />
      })}
    </svg>
  )
}
