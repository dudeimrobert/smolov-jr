import { useState } from 'react'
import { useJailhouseSync } from '../hooks/useJailhouseSync'

// ─── PROGRAM DATA ─────────────────────────────────────────────────────────────

const DAYS = [
  {
    id: 'bench', label: 'BENCH', color: '#E8C547',
    main: { id: 'bench_main', label: 'BENCH PRESS', note: 'WORK UP TO HEAVY 3 — THEN 2 BACK-OFF SETS OF 5' },
    secondary: {
      id: 'dips', label: 'WEIGHTED DIPS', method: 'JAILHOUSE METHOD',
      tiers: [
        { id: 'tier1', reps: 10 },
        { id: 'tier2', reps: 8 },
        { id: 'tier3', reps: 6 },
        { id: 'tier4', reps: 5 },
        { id: 'tier5', reps: 3 },
      ]
    },
    giant: {
      rounds: [3, 4, 4, 2], // rounds per week 1-4
      exercises: [
        { id: 'pullups',    label: 'PULL-UPS',     target: 'MAX REPS', hasWeight: false },
        { id: 'kb_swing',   label: 'KB SWING',     target: '10 REPS',  hasWeight: true },
        { id: 'pushups',    label: 'PUSH-UPS',     target: '15 REPS',  hasWeight: false },
        { id: 'goblet_sq',  label: 'GOBLET SQUAT', target: '10 REPS',  hasWeight: true },
        { id: 'farmers',    label: 'FARMERS CARRY', target: '40 YARDS', hasWeight: true },
      ]
    }
  },
  {
    id: 'squat', label: 'SQUAT', color: '#5CBA4A',
    main: { id: 'squat_main', label: 'BACK SQUAT', note: 'WORK UP TO HEAVY 3 — THEN 2 BACK-OFF SETS OF 5' },
    secondary: {
      id: 'trap_bar', label: 'TRAP BAR DEADLIFT', method: 'TOTAL REP METHOD',
      totalReps: 25,
      note: 'HIT 25 TOTAL REPS IN AS FEW SETS AS POSSIBLE'
    },
    giant: {
      rounds: [3, 4, 4, 2],
      exercises: [
        { id: 'box_jumps',  label: 'BOX JUMPS',    target: '3 REPS',   hasWeight: false },
        { id: 'goblet_sq2', label: 'GOBLET SQUAT', target: '10 REPS',  hasWeight: true },
        { id: 'pushups2',   label: 'PUSH-UPS',     target: '15 REPS',  hasWeight: false },
        { id: 'kb_row',     label: 'KB ROW',        target: '10/ARM',   hasWeight: true },
        { id: 'plank',      label: 'PLANK HOLD',   target: '30S',      hasWeight: false },
      ]
    }
  },
  {
    id: 'pull', label: 'PULL', color: '#47B8E8',
    main: { id: 'trap_main', label: 'TRAP BAR DEADLIFT', note: 'WORK UP TO HEAVY 3 — THEN 2 BACK-OFF SETS OF 5' },
    secondary: {
      id: 'barbell_row', label: 'BARBELL ROW', method: 'JAILHOUSE METHOD',
      tiers: [
        { id: 'tier1', reps: 10 },
        { id: 'tier2', reps: 8 },
        { id: 'tier3', reps: 6 },
        { id: 'tier4', reps: 5 },
        { id: 'tier5', reps: 3 },
      ]
    },
    giant: {
      rounds: [3, 4, 4, 2],
      exercises: [
        { id: 'pullups2',   label: 'PULL-UPS',     target: 'MAX REPS', hasWeight: false },
        { id: 'kb_swing2',  label: 'KB SWING',     target: '15 REPS',  hasWeight: true },
        { id: 'dips2',      label: 'DIPS',          target: '10 REPS',  hasWeight: false },
        { id: 'lunges',     label: 'WALK. LUNGES', target: '10/LEG',   hasWeight: false },
        { id: 'farmers2',   label: 'FARMERS CARRY', target: '40 YARDS', hasWeight: true },
      ]
    }
  }
]

const WEEKS = [
  { label: 'WK 1', tag: 'BASELINE', note: 'ESTABLISH WEIGHTS — 3 GIANT SET ROUNDS — LOCK IN TIER WEIGHTS', deload: false },
  { label: 'WK 2', tag: 'LOAD',     note: 'ADD 5-10LB MAIN LIFT — +5LB JAILHOUSE TIERS — 4 GIANT SET ROUNDS', deload: false },
  { label: 'WK 3', tag: 'PEAK',     note: 'PUSH FOR 3RM PR — +5LB TIERS AGAIN — PUSH REP MAXES ON GIANT SETS', deload: false },
  { label: 'WK 4', tag: 'DELOAD',   note: 'WK1 WEIGHT — STRAIGHT SETS ONLY — 2 GIANT SET ROUNDS — NO BOX JUMPS OR CARRIES', deload: true },
]

const SCHEDULE = [
  { dow: 'MON', label: 'BENCH', color: '#E8C547' },
  { dow: 'TUE', label: 'REST',  color: '#6A6A6A' },
  { dow: 'WED', label: 'SQUAT', color: '#5CBA4A' },
  { dow: 'THU', label: 'REST',  color: '#6A6A6A' },
  { dow: 'FRI', label: 'PULL',  color: '#47B8E8' },
  { dow: 'SAT', label: 'REST',  color: '#6A6A6A' },
  { dow: 'SUN', label: 'REST',  color: '#6A6A6A' },
]

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function JailhouseTracker({ user }) {
  const { data: S, setData, syncing, lastSynced } = useJailhouseSync(user)
  const [histModal, setHistModal] = useState(null)

  const week   = S.week ?? 0
  const dayId  = S.day ?? 'bench'
  const day    = DAYS.find(d => d.id === dayId)
  const wi     = WEEKS[week]
  const rounds = wi.deload ? 2 : day.giant.rounds[week]

  // ── Storage helpers ──
  const getWeight  = (exId) => (S.weights  || {})[`${dayId}-${exId}`] || ''
  const getHistory = (exId) => (S.history  || {})[exId] || []

  const setWeight = (exId, val) =>
    setData(p => {
      const k = `${dayId}-${exId}`
      const newWeights = { ...p.weights, [k]: val }
      const newHistory = logHistory(p, exId, val)
      return { ...p, weights: newWeights, history: newHistory }
    })

  const logHistory = (prev, exId, val) => {
    if (!val) return prev.history || {}
    const today    = new Date().toISOString().split('T')[0]
    const curr     = (prev.history || {})[exId] || []
    const filtered = curr.filter(h => h.date !== today)
    return {
      ...(prev.history || {}),
      [exId]: [{ date: today, weight: parseFloat(val) }, ...filtered].slice(0, 20)
    }
  }

  // ── Total rep method set tracking ──
  const trKey = (setIdx) => `${week}-${dayId}-trap-${setIdx}`
  const getTRSets = () => {
    let sets = []
    for (let i = 0; i < 20; i++) {
      const r = (S.trapReps || {})[trKey(i)]
      if (r !== undefined) sets.push(r)
      else break
    }
    return sets
  }
  const totalRepsDone = getTRSets().reduce((a, r) => a + r, 0)

  const addTRSet = (reps) => {
    const sets = getTRSets()
    const k = trKey(sets.length)
    setData(p => ({ ...p, trapReps: { ...(p.trapReps || {}), [k]: reps } }))
  }

  const [trInput, setTrInput] = useState('')

  // ── Main lift sets ──
  const mainSetKey = (si) => `${week}-${dayId}-main-${si}`
  const mainSets   = 3 // 1 heavy + 2 back-off
  const mainDone   = Array.from({ length: mainSets }, (_, i) => S.completed?.[mainSetKey(i)] || false)

  const toggleMain = (si) => {
    const k = mainSetKey(si)
    setData(p => ({ ...p, completed: { ...p.completed, [k]: !p.completed?.[k] } }))
  }

  // ── Jailhouse tier sets ──
  const tierKey = (tierId, si) => `${week}-${dayId}-${tierId}-${si}`
  const toggleTier = (tierId, si) => {
    const k = tierKey(tierId, si)
    setData(p => ({ ...p, completed: { ...p.completed, [k]: !p.completed?.[k] } }))
  }

  // ── Giant set round tracking ──
  const roundKey = (ri) => `${week}-${dayId}-round-${ri}`
  const toggleRound = (ri) => {
    const k = roundKey(ri)
    setData(p => ({ ...p, completed: { ...p.completed, [k]: !p.completed?.[k] } }))
  }
  const roundsDone = Array.from({ length: rounds }, (_, i) => S.completed?.[roundKey(i)] || false)

  const syncLabel = syncing
    ? '↑ SYNCING…'
    : lastSynced
    ? `✓ SYNCED ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '● LOCAL ONLY'

  return (
    <div style={Sc.root}>
      <style>{CSS}</style>

      {/* HEADER */}
      <div style={Sc.header}>
        <div>
          <div style={Sc.brand}>JAILHOUSE STRONG</div>
          <div style={Sc.mainTitle}>{wi.tag}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div>
            <div style={Sc.overallLabel}>WEEK {week + 1} OF 4</div>
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
            style={week === wi2 ? { borderBottomColor: day.color } : {}}
            onClick={() => setData(p => ({ ...p, week: wi2 }))}>
            {w.label}
            <div className="week-sub" style={week === wi2 ? { color: day.color } : {}}>{w.tag}</div>
          </button>
        ))}
      </div>

      {/* WEEK PROGRESS BAR */}
      <div style={{ height: 2, background: '#2A2A2A' }} />

      {/* DAY TABS */}
      <div style={{ display: 'flex', margin: '16px 20px 0' }}>
        {DAYS.map(d => (
          <button key={d.id}
            className={`day-tab${dayId === d.id ? ' active' : ''}`}
            style={dayId === d.id ? { borderTop: `2px solid ${d.color}`, color: d.color } : {}}
            onClick={() => setData(p => ({ ...p, day: d.id }))}>
            <div style={{ fontSize: 11 }}>{d.label}</div>
            <div className="day-sub" style={dayId === d.id ? { color: d.color } : {}}>DAY</div>
          </button>
        ))}
      </div>

      {/* PANEL */}
      <div style={Sc.panel}>

        {/* Info row */}
        <div style={Sc.infoRow}>
          <div>
            <div style={Sc.infoLbl}>SESSION</div>
            <div style={{ ...Sc.infoVal, color: day.color }}>{day.label}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={Sc.infoLbl}>GIANT ROUNDS</div>
            <div style={Sc.infoVal}>{roundsDone.filter(Boolean).length}/{rounds}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={Sc.infoLbl}>METHOD</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: 1 }}>
              {day.secondary.method}
            </div>
          </div>
        </div>

        {wi.deload && (
          <div style={Sc.deloadNote}>DELOAD — STRAIGHT SETS ONLY — 2 GIANT ROUNDS — NO BOX JUMPS OR CARRIES</div>
        )}

        {/* ── MAIN LIFT ── */}
        <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, letterSpacing: 1, color: day.color }}>
                {day.main.label}
              </div>
              <div style={{ fontSize: 9, color: '#6A6A6A', letterSpacing: 1, marginTop: 1 }}>{day.main.note}</div>
              {getHistory(day.main.id)[0] && (
                <div style={{ fontSize: 9, color: day.color, letterSpacing: 0.5, marginTop: 4 }}>
                  LAST HEAVY 3: {getHistory(day.main.id)[0].weight}LB ·{' '}
                  {new Date(getHistory(day.main.id)[0].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {'  '}
                  <span style={{ color: '#6A6A6A', cursor: 'pointer' }} onClick={() => setHistModal({ exId: day.main.id, exLabel: day.main.label })}>HISTORY ▸</span>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: day.color }}>HEAVY 3</div>
              <div style={{ fontSize: 9, color: '#6A6A6A', letterSpacing: 1 }}>+ 2×5 BACK-OFF</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <input type="number" inputMode="decimal" placeholder="HEAVY 3 LBS" className="num-input" style={{ width: 140 }}
              value={getWeight(day.main.id)}
              onChange={e => setWeight(day.main.id, e.target.value)} />
            <span style={{ fontSize: 9, letterSpacing: 2, color: '#6A6A6A' }}>LBS</span>
          </div>

          <div style={{ fontSize: 10, letterSpacing: 2, color: '#6A6A6A', marginBottom: 8 }}>SETS</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['HEAVY 3', 'BACK-OFF 1', 'BACK-OFF 2'].map((label, i) => {
              const done = mainDone[i]
              return (
                <button key={i}
                  className={`set-btn${done ? ' done' : ''}`}
                  style={done ? { '--dc': day.color, width: 72 } : { width: 72 }}
                  onClick={() => toggleMain(i)}>
                  {done
                    ? <span style={{ fontSize: 13 }}>✓</span>
                    : <span style={{ fontSize: 7, letterSpacing: 0.3, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── SECONDARY LIFT ── */}
        <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, letterSpacing: 1, color: day.color }}>
                {day.secondary.label}
              </div>
              <div style={{ fontSize: 9, color: day.color, letterSpacing: 1, marginTop: 1 }}>{day.secondary.method}</div>
              {day.secondary.note && (
                <div style={{ fontSize: 9, color: '#6A6A6A', letterSpacing: 0.5, marginTop: 2 }}>{day.secondary.note}</div>
              )}
            </div>
          </div>

          {/* JAILHOUSE METHOD — tiered sets */}
          {day.secondary.tiers && (
            <div>
              {day.secondary.tiers.map((tier, i) => {
                const w = getWeight(`${day.secondary.id}-tier${i + 1}`)
                const done = S.completed?.[tierKey(tier.id, 0)]
                const hist = getHistory(`${day.secondary.id}-tier${i + 1}`)
                return (
                  <div key={tier.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 0', borderTop: i === 0 ? '1px solid #2A2A2A' : 'none' }}>
                    <div style={{ width: 24, fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: done ? day.color : '#6A6A6A' }}>
                      {tier.reps}
                    </div>
                    <div style={{ fontSize: 9, color: '#6A6A6A', letterSpacing: 1, width: 28 }}>REPS</div>
                    <input type="number" inputMode="decimal" placeholder="LBS" className="num-input"
                      style={{ width: 80, fontSize: 14, padding: '6px 8px' }}
                      value={w}
                      onChange={e => setWeight(`${day.secondary.id}-tier${i + 1}`, e.target.value)} />
                    {hist[0] && <div style={{ fontSize: 9, color: day.color, letterSpacing: 0.5 }}>LAST: {hist[0].weight}LB</div>}
                    <button
                      className={`set-btn${done ? ' done' : ''}`}
                      style={done ? { '--dc': day.color, marginLeft: 'auto' } : { marginLeft: 'auto' }}
                      onClick={() => toggleTier(tier.id, 0)}>
                      {done ? <span style={{ fontSize: 15 }}>✓</span> : <span style={{ fontSize: 9 }}>S1</span>}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* TOTAL REP METHOD */}
          {day.secondary.totalReps && (
            <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: '#6A6A6A', letterSpacing: 1 }}>TARGET REPS</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: totalRepsDone >= day.secondary.totalReps ? '#5CBA4A' : day.color }}>
                  {totalRepsDone}/{day.secondary.totalReps}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <input type="number" inputMode="decimal" placeholder="LBS" className="num-input" style={{ width: 100 }}
                  value={getWeight(day.secondary.id)}
                  onChange={e => setWeight(day.secondary.id, e.target.value)} />
                <span style={{ fontSize: 9, letterSpacing: 2, color: '#6A6A6A' }}>LBS</span>
              </div>

              <div style={{ fontSize: 9, letterSpacing: 2, color: '#6A6A6A', marginBottom: 8 }}>LOG A SET</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {[3, 4, 5, 6, 7, 8].map(r => (
                  <button key={r}
                    className="rpe-btn"
                    style={{ width: 38 }}
                    onClick={() => { if (totalRepsDone < day.secondary.totalReps) addTRSet(r) }}>
                    {r}
                  </button>
                ))}
              </div>

              {getTRSets().length > 0 && (
                <div style={{ fontSize: 9, color: '#6A6A6A', letterSpacing: 0.5 }}>
                  SETS: {getTRSets().map((r, i) => `S${i + 1}: ${r}`).join(' · ')}
                </div>
              )}

              {totalRepsDone >= day.secondary.totalReps && (
                <div style={{ fontSize: 10, color: '#5CBA4A', letterSpacing: 2, marginTop: 8 }}>✓ TARGET HIT</div>
              )}
            </div>
          )}
        </div>

        {/* ── GIANT SET ── */}
        <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, letterSpacing: 1, color: day.color }}>GIANT SET</div>
              <div style={{ fontSize: 9, color: '#6A6A6A', letterSpacing: 1, marginTop: 1 }}>45-60S REST BETWEEN ROUNDS</div>
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: day.color }}>
              {roundsDone.filter(Boolean).length}/{rounds}
            </div>
          </div>

          {/* Exercises with weight inputs */}
          {day.giant.exercises.map((ex, i) => {
            const skip = wi.deload && (ex.id.includes('box_jump') || ex.id.includes('farmers'))
            const hist = getHistory(ex.id)
            return (
              <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, opacity: skip ? 0.35 : 1 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}>{ex.label}</div>
                  <div style={{ fontSize: 9, color: '#6A6A6A', letterSpacing: 0.5 }}>{ex.target}{skip ? ' — SKIPPED' : ''}</div>
                  {hist[0] && !skip && (
                    <div style={{ fontSize: 9, color: day.color, letterSpacing: 0.5, marginTop: 1 }}>
                      LAST: {hist[0].weight}LB
                      {'  '}
                      <span style={{ color: '#6A6A6A', cursor: 'pointer' }} onClick={() => setHistModal({ exId: ex.id, exLabel: ex.label })}>HISTORY ▸</span>
                    </div>
                  )}
                </div>
                {ex.hasWeight && !skip && (
                  <input type="number" inputMode="decimal" placeholder="LBS" className="num-input"
                    style={{ width: 80, fontSize: 14, padding: '6px 8px' }}
                    value={getWeight(ex.id)}
                    onChange={e => setWeight(ex.id, e.target.value)} />
                )}
              </div>
            )
          })}

          {/* Round checkboxes */}
          <div style={{ fontSize: 10, letterSpacing: 2, color: '#6A6A6A', marginBottom: 8, marginTop: 12 }}>ROUNDS COMPLETE</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {Array.from({ length: rounds }, (_, i) => {
              const done = roundsDone[i]
              return (
                <button key={i}
                  className={`set-btn${done ? ' done' : ''}`}
                  style={done ? { '--dc': day.color } : {}}
                  onClick={() => toggleRound(i)}>
                  {done ? <span style={{ fontSize: 15 }}>✓</span> : <span style={{ fontSize: 9 }}>R{i + 1}</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Session complete banner */}
        {mainDone.every(Boolean) && roundsDone.filter(Boolean).length >= rounds && (
          <div style={{ border: `1px solid ${day.color}`, borderRadius: 3, padding: '10px 14px', fontSize: 10, letterSpacing: 3, color: day.color, marginTop: 8 }}>
            ▪ SESSION COMPLETE — REST UP
          </div>
        )}
      </div>

      {/* PROGRAM NOTES */}
      <div style={{ ...Sc.summary, marginBottom: 20 }}>
        <div style={Sc.sectionLabel}>PROGRAM NOTES</div>
        {[
          ['MAIN LIFT',        'Work up to a heavy 3, then 2 back-off sets at ~85% of that weight.'],
          ['JAILHOUSE METHOD', 'Reverse pyramid — 10, 8, 6, 5, 3. Add 5lb per tier each week.'],
          ['TOTAL REP METHOD', 'Hit 25 reps in as few sets as possible. Log each set using the rep buttons.'],
          ['GIANT SET',        'Move through all 5 exercises with no rest. Rest 45-60s between rounds.'],
          ['PROGRESSION',      'Add rounds before adding weight on Giant Sets. Giant Set goes 3→4→4→2 (deload).'],
          ['DELOAD',           'Week 4: back to Wk1 weight, straight sets only, 2 Giant rounds, no box jumps or carries.'],
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
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, marginBottom: 2 }}>{histModal.exLabel}</div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#6A6A6A', marginBottom: 16 }}>WEIGHT HISTORY</div>
            {getHistory(histModal.exId).length === 0 ? (
              <div style={{ color: '#6A6A6A', fontSize: 11, padding: '16px 0' }}>NO SESSIONS LOGGED YET.</div>
            ) : getHistory(histModal.exId).map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid #2A2A2A' }}>
                <div style={{ fontSize: 9, color: '#6A6A6A', letterSpacing: 1 }}>
                  {new Date(h.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 1, color: day.color }}>
                  {h.weight}<span style={{ fontSize: 13, color: '#6A6A6A' }}> LB</span>
                </div>
              </div>
            ))}
            <button className="apply-btn" style={{ width: '100%', marginTop: 16, padding: 12, fontSize: 10, letterSpacing: 2 }} onClick={() => setHistModal(null)}>CLOSE</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

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
  .rpe-btn {
    width: 34px; height: 30px; border-radius: 3px;
    border: 1px solid #2A2A2A; background: transparent; color: #6A6A6A;
    font-family: 'DM Mono', monospace; font-size: 10px; cursor: pointer; transition: all 0.1s;
    -webkit-tap-highlight-color: transparent;
  }
  .rpe-btn:active { background: #2A2A2A; }
`

const Sc = {
  root:         { fontFamily: "'DM Mono', monospace", background: '#0D0D0D', minHeight: '100vh', color: '#F0EDE6', maxWidth: 520, margin: '0 auto' },
  header:       { padding: '24px 20px 16px', borderBottom: '1px solid #2A2A2A', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand:        { fontSize: 10, letterSpacing: 4, color: '#6A6A6A', marginBottom: 2 },
  mainTitle:    { fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: 4, lineHeight: 1 },
  overallLabel: { fontSize: 9, letterSpacing: 2, color: '#6A6A6A', marginBottom: 4 },
  weekNote:     { fontSize: 9, letterSpacing: 1, color: '#6A6A6A', padding: '8px 20px', borderBottom: '1px solid #2A2A2A' },
  scheduleRow:  { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '8px 20px', borderBottom: '1px solid #2A2A2A' },
  panel:        { background: '#161616', border: '1px solid #2A2A2A', borderTop: 'none', margin: '0 20px', padding: '18px 16px 20px' },
  infoRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  infoLbl:      { fontSize: 9, letterSpacing: 2, color: '#6A6A6A', marginBottom: 2 },
  infoVal:      { fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 1 },
  deloadNote:   { fontSize: 9, color: '#E8C547', letterSpacing: 0.5, marginBottom: 16, fontStyle: 'italic' },
  summary:      { margin: '22px 20px 0' },
  sectionLabel: { fontSize: 10, letterSpacing: 3, color: '#6A6A6A', marginBottom: 10 },
  noteRow:      { fontSize: 9, letterSpacing: 0.5, padding: '8px 0', borderTop: '1px solid #2A2A2A', lineHeight: 1.6 },
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  modal:        { background: '#161616', border: '1px solid #2A2A2A', borderRadius: '8px 8px 0 0', padding: 20, width: '100%', maxWidth: 520, maxHeight: '60vh', overflow: 'auto' },
}
