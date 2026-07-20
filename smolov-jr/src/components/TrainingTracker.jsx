import { useState } from 'react'
import { useTrainingSync } from '../hooks/useTrainingSync'

// ─── PROGRAM DATA ─────────────────────────────────────────────────────────────

const SESSIONS = [
  {
    id: 'push', label: 'PUSH', sub: 'UPPER', color: '#E8C547',
    exercises: [
      { id: 'bench',   label: 'BENCH PRESS',    sets: 5, reps: '5',     rest: '2-3 MIN', isMain: true },
      { id: 'ohp',     label: 'OVERHEAD PRESS', sets: 3, reps: '10-15', rest: '60-90S' },
      { id: 'dips',    label: 'WEIGHTED DIPS',  sets: 3, reps: '10-15', rest: '60-90S' },
      { id: 'lateral', label: 'LATERAL RAISES', sets: 3, reps: '10-15', rest: '60-90S' },
    ],
    finisher: 'PUSH-UPS TO FAILURE — 3 ROUNDS — 30S REST',
  },
  {
    id: 'pull', label: 'PULL', sub: 'UPPER', color: '#E87447',
    exercises: [
      { id: 'pullup',   label: 'PULL-UPS',      sets: 5, reps: '3',     rest: '2-3 MIN', isMain: true },
      { id: 'row',      label: 'BARBELL ROWS',  sets: 3, reps: '10-15', rest: '60-90S' },
      { id: 'facepull', label: 'FACE PULLS',    sets: 3, reps: '10-15', rest: '60-90S' },
      { id: 'curl',     label: 'CURLS',         sets: 3, reps: '10-15', rest: '60-90S' },
    ],
    finisher: 'INVERTED ROWS — 3 ROUNDS — 30S REST',
  },
  {
    id: 'squat', label: 'SQUAT', sub: 'LOWER', color: '#5CBA4A',
    plyo: { id: 'boxjump', label: 'BOX JUMPS', sets: 4, reps: '3-4', rest: '60-90S' },
    exercises: [
      { id: 'backsquat', label: 'BACK SQUAT',      sets: 5, reps: '5',      rest: '2-3 MIN', isMain: true },
      { id: 'rdl',       label: 'ROM. DEADLIFT',   sets: 3, reps: '10-15',  rest: '60-90S' },
      { id: 'lunge',     label: 'WALK. LUNGES',    sets: 3, reps: '12/LEG', rest: '60-90S' },
      { id: 'calf',      label: 'CALF RAISES',     sets: 3, reps: '15',     rest: '60-90S' },
    ],
  },
  {
    id: 'hinge', label: 'HINGE', sub: 'LOWER', color: '#47B8E8',
    plyo: { id: 'broad', label: 'BROAD JUMPS', sets: 4, reps: '3-4', rest: '60-90S' },
    exercises: [
      { id: 'deadlift',  label: 'DEADLIFT',         sets: 5, reps: '5',      rest: '2-3 MIN', isMain: true },
      { id: 'bss',       label: 'BULG. SPLIT SQ.',  sets: 3, reps: '10/LEG', rest: '60-90S' },
      { id: 'legcurl',   label: 'LEG CURLS',        sets: 3, reps: '10-15',  rest: '60-90S' },
      { id: 'hangraise', label: 'HANG. LEG RAISE',  sets: 3, reps: '12',     rest: '60-90S' },
    ],
  },
]

const WEEKS = [
  { label: 'WK 1', tag: 'BASELINE', note: 'ESTABLISH WEIGHTS — ACCESSORIES 10 REPS', deload: false },
  { label: 'WK 2', tag: 'LOAD',     note: 'ADD 5-10LB MAIN LIFTS — ACCESSORIES 12 REPS', deload: false },
  { label: 'WK 3', tag: 'PEAK',     note: 'ADD 5-10LB AGAIN — ACCESSORIES 15 REPS', deload: false },
  { label: 'WK 4', tag: 'DELOAD',   note: 'MAIN LIFT 3×5 AT WK1 WEIGHT — LIGHT ACCESSORIES — NO FINISHERS', deload: true },
]

const SCHEDULE = [
  { dow: 'MON', label: 'PUSH',  color: '#E8C547' },
  { dow: 'TUE', label: 'SQUAT', color: '#5CBA4A' },
  { dow: 'WED', label: 'REST',  color: '#6A6A6A' },
  { dow: 'THU', label: 'PULL',  color: '#E87447' },
  { dow: 'FRI', label: 'HINGE', color: '#47B8E8' },
  { dow: 'SAT', label: '+',     color: '#6A6A6A' },
  { dow: 'SUN', label: 'REST',  color: '#6A6A6A' },
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function effectiveSets(ex, weekIdx) {
  return WEEKS[weekIdx].deload && ex.isMain ? 3 : ex.sets
}

function allExForSession(session) {
  return session.plyo ? [session.plyo, ...session.exercises] : session.exercises
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function TrainingTracker({ user }) {
  const { data: S, setData, syncing, lastSynced } = useTrainingSync(user)
  const [histModal, setHistModal] = useState(null)

  const week      = S.week ?? 0
  const sessionId = S.session ?? 'push'
  const session   = SESSIONS.find(s => s.id === sessionId)
  const wi        = WEEKS[week]
  const allEx     = allExForSession(session)

  // ── Counting helpers ──
  const setKey = (sId, exId, si) => `${week}-${sId}-${exId}-${si}`

  const countDone = (sId, exId, total) => {
    let n = 0
    for (let i = 0; i < total; i++) if (S.completed[setKey(sId, exId, i)]) n++
    return n
  }

  const sessionProg = (sId) => {
    const s   = SESSIONS.find(x => x.id === sId)
    const exs = allExForSession(s)
    const total = exs.reduce((a, ex) => a + effectiveSets(ex, week), 0)
    const done  = exs.reduce((a, ex) => a + countDone(sId, ex.id, effectiveSets(ex, week)), 0)
    return { done, total, pct: total > 0 ? Math.round(done / total * 100) : 0 }
  }

  const sessionDone = (sId) => {
    const p = sessionProg(sId)
    return p.total > 0 && p.done >= p.total
  }

  const weekProg = SESSIONS.reduce((a, s) => {
    const p = sessionProg(s.id)
    return { done: a.done + p.done, total: a.total + p.total }
  }, { done: 0, total: 0 })
  const weekPct = weekProg.total > 0 ? Math.round(weekProg.done / weekProg.total * 100) : 0

  // ── Actions ──
  const toggle = (exId, si) => {
    const k = setKey(sessionId, exId, si)
    setData(prev => {
      const newCompleted = { ...prev.completed, [k]: !prev.completed[k] }
      const ex    = allEx.find(e => e.id === exId)
      const total = effectiveSets(ex, week)
      const wt    = (prev.weights || {})[`${sessionId}-${exId}`]
      let newHistory = prev.history || {}

      if (wt) {
        const allDone = Array.from({ length: total }, (_, i) =>
          newCompleted[setKey(sessionId, exId, i)]
        ).every(Boolean)

        if (allDone) {
          const today    = new Date().toISOString().split('T')[0]
          const curr     = newHistory[exId] || []
          const filtered = curr.filter(h => h.date !== today)
          newHistory = {
            ...newHistory,
            [exId]: [{ date: today, weight: parseFloat(wt), reps: parseInt(ex.reps, 10) || 5, setsCompleted: total }, ...filtered].slice(0, 20),
          }
        }
      }

      return { ...prev, completed: newCompleted, history: newHistory }
    })
  }

  const setWeight = (exId, val) =>
    setData(p => ({ ...p, weights: { ...p.weights, [`${sessionId}-${exId}`]: val } }))

  const getWeight  = (exId) => (S.weights  || {})[`${sessionId}-${exId}`] || ''
  const getHistory = (exId) => (S.history  || {})[exId] || []

  const syncLabel = syncing
    ? '↑ SYNCING…'
    : lastSynced
    ? `✓ SYNCED ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '● LOCAL ONLY'

  const currentProg = sessionProg(sessionId)
  const isDone      = sessionDone(sessionId)

  return (
    <div style={Sc.root}>
      <style>{CSS}</style>

      {/* HEADER */}
      <div style={Sc.header}>
        <div>
          <div style={Sc.brand}>PUSH / PULL / SQUAT / HINGE</div>
          <div style={Sc.mainTitle}>{wi.tag}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div>
            <div style={Sc.overallLabel}>WEEK {week + 1} OF 4</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 80, height: 2, background: '#2A2A2A', borderRadius: 1 }}>
                <div style={{ width: `${weekPct}%`, height: '100%', background: session.color, borderRadius: 1, transition: 'width 0.4s' }} />
              </div>
              <span style={Sc.progPct}>{weekPct}%</span>
            </div>
          </div>
          <span style={{ fontSize: 9, letterSpacing: 1, color: syncing ? '#E8C547' : lastSynced ? '#5CBA4A' : '#6A6A6A' }}>
            {syncLabel}
          </span>
        </div>
      </div>

      {/* WEEK NOTE */}
      <div style={Sc.weekNote}>{wi.note}</div>

      {/* SCHEDULE STRIP */}
      <div style={Sc.scheduleRow}>
        {SCHEDULE.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '4px 0' }}>
            <div style={{ fontSize: 8, letterSpacing: 1, color: '#6A6A6A', marginBottom: 2 }}>{d.dow}</div>
            <div style={{ fontSize: 11, letterSpacing: 0.5, color: d.color, fontFamily: "'Bebas Neue', sans-serif" }}>{d.label}</div>
          </div>
        ))}
      </div>

      {/* WEEK TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid #2A2A2A', padding: '0 20px' }}>
        {WEEKS.map((w, wi2) => (
          <button key={wi2}
            className={`week-tab${week === wi2 ? ' active' : ''}`}
            style={week === wi2 ? { borderBottomColor: session.color } : {}}
            onClick={() => setData(p => ({ ...p, week: wi2 }))}>
            {w.label}
            <div className="week-sub" style={week === wi2 ? { color: session.color } : {}}>
              {w.tag}
            </div>
          </button>
        ))}
      </div>

      {/* WEEK PROGRESS BAR */}
      <div style={{ height: 2, background: '#2A2A2A' }}>
        <div style={{ height: '100%', width: `${weekPct}%`, background: session.color, transition: 'width 0.35s' }} />
      </div>

      {/* SESSION TABS */}
      <div style={{ display: 'flex', margin: '16px 20px 0' }}>
        {SESSIONS.map(s => (
          <button key={s.id}
            className={`day-tab${sessionId === s.id ? ' active' : ''}${sessionDone(s.id) ? ' done-d' : ''}`}
            style={sessionId === s.id ? { borderTop: `2px solid ${s.color}`, color: s.color } : {}}
            onClick={() => setData(p => ({ ...p, session: s.id }))}>
            <div style={{ fontSize: 11 }}>{s.label}</div>
            <div className="day-sub" style={sessionId === s.id ? { color: s.color } : {}}>{s.sub}</div>
          </button>
        ))}
      </div>

      {/* SESSION PANEL */}
      <div style={Sc.panel}>

        {/* Info row */}
        <div style={Sc.infoRow}>
          <div>
            <div style={Sc.infoLbl}>SESSION</div>
            <div style={{ ...Sc.infoVal, color: session.color }}>{session.label}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={Sc.infoLbl}>SETS DONE</div>
            <div style={Sc.infoVal}>{currentProg.done}/{currentProg.total}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={Sc.infoLbl}>PROGRESS</div>
            <div style={{ ...Sc.infoVal, color: session.color }}>{currentProg.pct}%</div>
          </div>
        </div>

        {wi.deload && (
          <div style={Sc.deloadNote}>
            DELOAD — MAIN LIFTS 3×5 AT WK 1 WEIGHT — NO FINISHERS
          </div>
        )}

        {/* EXERCISES */}
        {allEx.map(ex => {
          const total    = effectiveSets(ex, week)
          const done     = countDone(sessionId, ex.id, total)
          const allDone  = done >= total
          const weight   = getWeight(ex.id)
          const hist     = getHistory(ex.id)
          const lastEntry = hist[0]
          const isPlyo   = session.plyo?.id === ex.id

          return (
            <div key={ex.id} style={{ borderTop: '1px solid #2A2A2A', paddingTop: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, letterSpacing: 1, color: allDone ? session.color : '#F0EDE6' }}>
                    {ex.label}{isPlyo ? ' ⚡' : ''}{allDone ? ' ✓' : ''}
                  </div>
                  <div style={{ fontSize: 9, color: '#6A6A6A', letterSpacing: 1, marginTop: 1 }}>
                    {total}×{ex.reps} · REST {ex.rest}
                  </div>
                  {lastEntry ? (
                    <div style={{ fontSize: 9, color: session.color, letterSpacing: 0.5, marginTop: 4 }}>
                      LAST: {lastEntry.weight}LB ·{' '}
                      {new Date(lastEntry.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {'  '}
                      <span
                        style={{ color: '#6A6A6A', cursor: 'pointer', letterSpacing: 1 }}
                        onClick={() => setHistModal({ exId: ex.id, exLabel: ex.label })}>
                        HISTORY ▸
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 9, color: '#4A4A4A', letterSpacing: 0.5, marginTop: 4 }}>
                      NO HISTORY ·{' '}
                      <span style={{ cursor: 'pointer' }} onClick={() => setHistModal({ exId: ex.id, exLabel: ex.label })}>
                        VIEW ▸
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 1, color: session.color, lineHeight: 1 }}>
                    {total}<span style={{ color: '#4A4A4A', fontSize: 16 }}>×</span>{ex.reps}
                  </div>
                  <div style={{ fontSize: 9, color: '#6A6A6A', letterSpacing: 1, marginTop: 2 }}>{done}/{total} DONE</div>
                </div>
              </div>

              {/* Weight input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="LBS"
                  value={weight}
                  onChange={e => setWeight(ex.id, e.target.value)}
                  className="num-input"
                  style={{ width: 100 }}
                />
                <span style={{ fontSize: 9, letterSpacing: 2, color: '#6A6A6A' }}>LBS</span>
              </div>

              {/* Set buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Array.from({ length: total }, (_, i) => {
                  const setDone = !!S.completed[setKey(sessionId, ex.id, i)]
                  return (
                    <button key={i}
                      className={`set-btn${setDone ? ' done' : ''}`}
                      style={setDone ? { '--dc': session.color } : {}}
                      onClick={() => toggle(ex.id, i)}>
                      {setDone
                        ? <span style={{ fontSize: 15 }}>✓</span>
                        : <span style={{ fontSize: 9, letterSpacing: 0.5 }}>S{i + 1}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Finisher */}
        {session.finisher && (
          <div style={Sc.finisherBox}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#6A6A6A', marginBottom: 3 }}>FINISHER</div>
            <div style={{
              fontSize: 10, letterSpacing: 0.5,
              color: wi.deload ? '#4A4A4A' : '#F0EDE6',
              textDecoration: wi.deload ? 'line-through' : 'none',
            }}>
              {session.finisher}
            </div>
          </div>
        )}

        {isDone && (
          <div style={{ border: `1px solid ${session.color}`, borderRadius: 3, padding: '10px 14px', fontSize: 10, letterSpacing: 3, color: session.color, marginTop: 16 }}>
            ▪ SESSION COMPLETE — REST UP
          </div>
        )}
      </div>

      {/* SESSION BREAKDOWN */}
      <div style={Sc.summary}>
        <div style={Sc.sectionLabel}>SESSION BREAKDOWN</div>
        {SESSIONS.map(s => {
          const p    = sessionProg(s.id)
          const done = sessionDone(s.id)
          return (
            <div key={s.id} style={Sc.summRow}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: 1, width: 52, color: s.color }}>{s.label}</span>
              <span style={{ fontSize: 9, color: '#6A6A6A', letterSpacing: 1, width: 44 }}>{s.sub}</span>
              <div style={Sc.miniBar}>
                <div style={{ height: '100%', borderRadius: 1, transition: 'width 0.3s', width: `${p.pct}%`, background: s.color }} />
              </div>
              <span style={{ fontSize: 10, letterSpacing: 1, width: 52, textAlign: 'right', color: done ? '#5CBA4A' : '#6A6A6A' }}>
                {done ? '✓ DONE' : `${p.done}/${p.total}`}
              </span>
            </div>
          )
        })}
      </div>

      {/* PROGRAM NOTES */}
      <div style={{ ...Sc.summary, marginBottom: 20 }}>
        <div style={Sc.sectionLabel}>PROGRAM NOTES</div>
        {[
          ['STALL RULE', "Hold the weight next session if you can't complete all sets."],
          ['BENCH',      'Started 135 (Wk1), 145 (Wk2). Add 5-10lb per week.'],
          ['SQUAT',      '325 baseline. Working weight started at 275.'],
          ['PULL-UPS',   'Bodyweight/assisted 5×3. Drop assistance before adding reps.'],
          ['PLYOS',      'Always first in session before main lift. Depth jumps once landings are clean.'],
          ['DELOAD',     'Week 4: main lifts 3×5 at Wk1 weight. 2 sessions only. No finishers.'],
        ].map(([title, body]) => (
          <div key={title} style={Sc.noteRow}>
            <span style={{ color: '#F0EDE6', letterSpacing: 1 }}>{title}</span>
            <span style={{ color: '#6A6A6A', marginTop: 2, display: 'block' }}>{body}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 48 }} />

      {/* HISTORY MODAL */}
      {histModal && (
        <div style={Sc.overlay} onClick={() => setHistModal(null)}>
          <div style={Sc.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, marginBottom: 2 }}>
              {histModal.exLabel}
            </div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#6A6A6A', marginBottom: 16 }}>WEIGHT HISTORY</div>
            {getHistory(histModal.exId).length === 0 ? (
              <div style={{ color: '#6A6A6A', fontSize: 11, padding: '16px 0' }}>NO SESSIONS LOGGED YET.</div>
            ) : getHistory(histModal.exId).map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid #2A2A2A' }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: 0.5 }}>{h.setsCompleted} SETS COMPLETED</div>
                  <div style={{ fontSize: 9, color: '#6A6A6A', letterSpacing: 1, marginTop: 2 }}>
                    {new Date(h.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 1, color: session.color }}>
                  {h.weight}<span style={{ fontSize: 13, color: '#6A6A6A' }}> LB</span>
                </div>
              </div>
            ))}
            <button className="apply-btn" style={{ width: '100%', marginTop: 16, padding: 12, fontSize: 10, letterSpacing: 2 }} onClick={() => setHistModal(null)}>
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const CSS = `
  input:focus { outline: none; border-color: #6A6A6A !important; }
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
  input[type=number] { -moz-appearance: textfield; }

  .num-input {
    padding: 8px 12px; background: #0D0D0D; border: 1px solid #2A2A2A; border-radius: 3px;
    color: #F0EDE6; font-family: 'DM Mono', monospace; font-size: 18px; font-weight: 500;
  }
  .apply-btn {
    padding: 9px 12px; background: #2A2A2A; border: none; border-radius: 3px;
    color: #F0EDE6; font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 2px;
    cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background 0.1s;
  }
  .apply-btn:active { background: #3a3a3a; }

  .week-tab {
    flex: 1; padding: 11px 8px; background: transparent;
    border: none; border-bottom: 2px solid transparent;
    color: #6A6A6A; font-family: 'Bebas Neue', sans-serif;
    font-size: 13px; letter-spacing: 2px; cursor: pointer; transition: all 0.15s; text-align: center;
    -webkit-tap-highlight-color: transparent;
  }
  .week-tab.active { color: #F0EDE6; }
  .week-sub { font-family: 'DM Mono', monospace; font-size: 8px; margin-top: 2px; letter-spacing: 1px; color: #4A4A4A; }

  .day-tab {
    flex: 1; padding: 9px 4px; background: transparent;
    border: 1px solid #2A2A2A; border-bottom: none;
    color: #6A6A6A; font-family: 'Bebas Neue', sans-serif;
    font-size: 13px; letter-spacing: 1px; cursor: pointer; transition: all 0.12s; text-align: center; position: relative;
    -webkit-tap-highlight-color: transparent;
  }
  .day-tab.active { background: #161616; color: #F0EDE6; }
  .day-tab.done-d::after { content: '✓'; position: absolute; top: 2px; right: 4px; font-size: 7px; color: #5CBA4A; }
  .day-sub { font-family: 'DM Mono', monospace; font-size: 8px; margin-top: 1px; color: #4A4A4A; }

  .set-btn {
    width: 44px; height: 44px; border-radius: 4px;
    border: 1.5px solid #2A2A2A; background: #161616; color: #6A6A6A;
    font-family: 'DM Mono', monospace; cursor: pointer; transition: all 0.12s;
    display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 2px;
    -webkit-tap-highlight-color: transparent; user-select: none;
  }
  .set-btn:active { transform: scale(0.94); }
  .set-btn.done {
    border-color: var(--dc);
    background: color-mix(in srgb, var(--dc) 14%, #161616);
    color: var(--dc);
    animation: pop 0.22s ease;
  }
  @keyframes pop { 0%,100%{transform:scale(1)} 40%{transform:scale(1.15)} }
`

const Sc = {
  root:         { fontFamily: "'DM Mono', monospace", background: '#0D0D0D', minHeight: '100vh', color: '#F0EDE6', maxWidth: 520, margin: '0 auto' },
  header:       { padding: '24px 20px 16px', borderBottom: '1px solid #2A2A2A', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand:        { fontSize: 10, letterSpacing: 4, color: '#6A6A6A', marginBottom: 2 },
  mainTitle:    { fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: 4, lineHeight: 1 },
  overallLabel: { fontSize: 9, letterSpacing: 2, color: '#6A6A6A', marginBottom: 4 },
  progPct:      { fontSize: 10, color: '#6A6A6A', letterSpacing: 1 },
  weekNote:     { fontSize: 9, letterSpacing: 1, color: '#6A6A6A', padding: '8px 20px', borderBottom: '1px solid #2A2A2A' },
  scheduleRow:  { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '8px 20px', borderBottom: '1px solid #2A2A2A' },
  panel:        { background: '#161616', border: '1px solid #2A2A2A', borderTop: 'none', margin: '0 20px', padding: '18px 16px 20px' },
  infoRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  infoLbl:      { fontSize: 9, letterSpacing: 2, color: '#6A6A6A', marginBottom: 2 },
  infoVal:      { fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 1 },
  deloadNote:   { fontSize: 9, color: '#E8C547', letterSpacing: 0.5, marginBottom: 16, fontStyle: 'italic' },
  finisherBox:  { marginTop: 8, border: '1px solid #2A2A2A', borderRadius: 3, padding: '8px 12px', background: '#0D0D0D' },
  summary:      { margin: '22px 20px 0' },
  sectionLabel: { fontSize: 10, letterSpacing: 3, color: '#6A6A6A', marginBottom: 10 },
  summRow:      { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  miniBar:      { flex: 1, height: 2, background: '#2A2A2A', borderRadius: 1, overflow: 'hidden' },
  noteRow:      { fontSize: 9, letterSpacing: 0.5, padding: '8px 0', borderTop: '1px solid #2A2A2A', lineHeight: 1.6 },
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  modal:        { background: '#161616', border: '1px solid #2A2A2A', borderRadius: '8px 8px 0 0', padding: 20, width: '100%', maxWidth: 520, maxHeight: '60vh', overflow: 'auto' },
}
