import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSync } from '../hooks/useSync'
import { DAYS, WEEK_COLORS, WEEK_TOTAL_SETS, calcWeight } from '../lib/program'

export default function Tracker({ user }) {
  const { data: S, setData, syncing, lastSynced } = useSync(user)
  const [showSettings, setShowSettings] = useState(false)
  const [editIncr, setEditIncr] = useState(String(S.incr))

  const base = parseFloat(S.base)
  const day  = DAYS[S.day]
  const tw   = calcWeight(base, day.pct, S.incr, S.week)
  const nk   = `${S.week}-${S.day}`

  const countFor = (wi, di) => {
    let n = 0
    for (let i = 0; i < DAYS[di].sets; i++) if (S.completed[`${wi}-${di}-${i}`]) n++
    return n
  }
  const allDone    = (wi, di) => countFor(wi, di) === DAYS[di].sets
  const weekCount  = (wi) => DAYS.reduce((a, _, di) => a + countFor(wi, di), 0)
  const weekIsDone = (wi) => DAYS.every((_, di) => allDone(wi, di))

  const wkDone     = weekCount(S.week)
  const wkPct      = Math.round(wkDone / WEEK_TOTAL_SETS * 100)
  const totalDone  = [0,1,2].reduce((a, wi) => a + weekCount(wi), 0)
  const overallPct = Math.round(totalDone / (WEEK_TOTAL_SETS * 3) * 100)

  const toggle = (si) => {
    const k = `${S.week}-${S.day}-${si}`
    setData(p => ({ ...p, completed: { ...p.completed, [k]: !p.completed[k] } }))
  }
  const setRpe = (r) => {
    setData(p => ({ ...p, rpe: { ...p.rpe, [nk]: p.rpe[nk] === r ? undefined : r } }))
  }
  const setNote = (v) => {
    setData(p => ({ ...p, notes: { ...p.notes, [nk]: v } }))
  }
  const applyIncrement = () => {
    const v = parseFloat(editIncr)
    if (!isNaN(v) && v >= 0) setData(p => ({ ...p, incr: v }))
  }

  const syncLabel = syncing
    ? '↑ syncing…'
    : lastSynced
    ? `✓ synced ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '● local only'

  return (
    <div style={S_css.root}>
      <style>{CSS}</style>

      {/* HEADER */}
      <div style={S_css.header}>
        <div>
          <div style={S_css.brand}>SMOLOV JR.</div>
          <div style={S_css.mainTitle}>WEEK {S.week + 1}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div>
            <div style={S_css.overallLabel}>OVERALL</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 80, height: 2, background: '#2A2A2A', borderRadius: 1 }}>
                <div style={{ width: `${overallPct}%`, height: '100%', background: '#F0EDE6', borderRadius: 1, transition: 'width 0.4s' }} />
              </div>
              <span style={S_css.progPct}>{overallPct}%</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 9, letterSpacing: 1, color: syncing ? '#E8C547' : lastSynced ? '#5CBA4A' : '#6A6A6A' }}>
              {syncLabel}
            </span>
            <button className="icon-btn" onClick={() => setShowSettings(p => !p)}
              style={{ color: showSettings ? '#F0EDE6' : '#6A6A6A', borderColor: showSettings ? '#6A6A6A' : '#2A2A2A' }}>
              ⚙ SETTINGS
            </button>
          </div>
        </div>
      </div>

      {/* SETTINGS */}
      {showSettings && (
        <div style={S_css.settingsBox}>
          <div style={S_css.sectionLabel}>CONFIGURATION</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={S_css.fieldLabel}>1RM BASE (lbs)</label>
              <input type="number" value={S.base}
                onChange={e => setData(p => ({ ...p, base: e.target.value }))}
                placeholder="e.g. 315" className="num-input" style={{ width: 110 }} />
            </div>
            <div>
              <label style={S_css.fieldLabel}>WEEKLY INCREMENT (lbs)</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="number" value={editIncr}
                  onChange={e => setEditIncr(e.target.value)}
                  className="num-input" style={{ width: 80 }} />
                <button className="apply-btn" onClick={applyIncrement}>APPLY</button>
              </div>
            </div>
          </div>
          <div style={S_css.incrNote}>
            Wk1: base · Wk2: base +{S.incr} lbs · Wk3: base +{S.incr * 2} lbs
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #2A2A2A' }}>
            <div style={S_css.fieldLabel}>ACCOUNT</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#6A6A6A' }}>{user.email}</span>
              <button className="apply-btn" onClick={() => supabase.auth.signOut()}>SIGN OUT</button>
            </div>
          </div>
        </div>
      )}

      {/* WEIGHT BAR */}
      {!showSettings && (
        <div style={S_css.weightBar}>
          <span style={S_css.wbLabel}>1RM</span>
          <input type="number" value={S.base}
            onChange={e => setData(p => ({ ...p, base: e.target.value }))}
            placeholder="enter 1RM" className="weight-inline" />
          <span style={S_css.wbLabel}>lbs</span>
          {tw && <>
            <div style={{ width: 1, height: 16, background: '#2A2A2A', margin: '0 4px' }} />
            <span style={S_css.wbLabel}>TODAY</span>
            <span style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 1, color: day.color }}>{tw}</span>
            <span style={S_css.wbLabel}>lbs</span>
          </>}
          <span style={{ marginLeft: 'auto', fontSize: 9, letterSpacing: 1, color: '#6A6A6A' }}>
            +{S.incr * S.week} lbs wk{S.week + 1}
          </span>
        </div>
      )}

      {/* WEEK TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid #2A2A2A', padding: '0 20px' }}>
        {[0,1,2].map(wi => {
          const wd = weekIsDone(wi)
          const wp = Math.round(weekCount(wi) / WEEK_TOTAL_SETS * 100)
          return (
            <button key={wi}
              className={`week-tab${S.week === wi ? ' active' : ''}${wd ? ' wk-done' : ''}`}
              style={S.week === wi && !wd ? { borderBottomColor: WEEK_COLORS[wi] } : {}}
              onClick={() => setData(p => ({ ...p, week: wi, day: 0 }))}>
              WK {wi + 1}
              <div className="week-sub" style={S.week === wi ? { color: WEEK_COLORS[wi] } : {}}>
                {wd ? '✓ DONE' : `${wp}%`}
              </div>
            </button>
          )
        })}
      </div>

      {/* WEEK PROGRESS */}
      <div style={{ height: 2, background: '#2A2A2A' }}>
        <div style={{ height: '100%', width: `${wkPct}%`, background: WEEK_COLORS[S.week], transition: 'width 0.35s' }} />
      </div>

      {/* DAY TABS */}
      <div style={{ display: 'flex', margin: '16px 20px 0' }}>
        {DAYS.map((d, i) => (
          <button key={i}
            className={`day-tab${S.day === i ? ' active' : ''}${allDone(S.week, i) ? ' done-d' : ''}`}
            style={S.day === i ? { borderTop: `2px solid ${d.color}`, color: d.color } : {}}
            onClick={() => setData(p => ({ ...p, day: i }))}>
            <div style={{ fontSize: 14 }}>{d.label}</div>
            <div className="day-sub" style={S.day === i ? { color: d.color } : {}}>
              {d.sets}×{d.reps}
            </div>
          </button>
        ))}
      </div>

      {/* DAY PANEL */}
      <div style={S_css.panel}>
        <div style={S_css.infoRow}>
          <div>
            <div style={S_css.infoLbl}>PRESCRIPTION</div>
            <div style={{ ...S_css.infoVal, color: day.color }}>{day.sets} × {day.reps}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={S_css.infoLbl}>INTENSITY</div>
            <div style={S_css.infoVal}>{Math.round(day.pct * 100)}%</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={S_css.infoLbl}>TARGET</div>
            <div style={{ ...S_css.infoVal, color: day.color }}>
              {tw ? `${tw} lbs` : <span style={{ color: '#6A6A6A', fontSize: 14 }}>set 1RM ↑</span>}
            </div>
          </div>
        </div>

        {S.week > 0 && (
          <div style={S_css.incrNotePanel}>
            +{S.incr * S.week} lbs from Week 1 ({S.incr} lbs × {S.week})
          </div>
        )}

        <div style={S_css.rowLabel}>
          <span>SETS</span>
          <span>{countFor(S.week, S.day)}/{day.sets}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          {Array.from({ length: day.sets }, (_, i) => {
            const done = S.completed[`${S.week}-${S.day}-${i}`]
            return (
              <button key={i}
                className={`set-btn${done ? ' done' : ''}`}
                style={done ? { '--dc': day.color } : {}}
                onClick={() => toggle(i)}>
                {done
                  ? <span style={{ fontSize: 15 }}>✓</span>
                  : <span style={{ fontSize: 9, letterSpacing: 0.5 }}>S{i + 1}</span>}
              </button>
            )
          })}
        </div>

        <div style={S_css.rowLabel}><span>SESSION RPE</span></div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {[6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(r => (
            <button key={r}
              className={`rpe-btn${S.rpe[nk] === r ? ' sel' : ''}`}
              style={S.rpe[nk] === r ? { '--dc': day.color } : {}}
              onClick={() => setRpe(r)}>
              {r}
            </button>
          ))}
        </div>

        <div style={S_css.rowLabel}><span>NOTES</span></div>
        <textarea rows={3} placeholder="Bar speed, misses, how it felt…"
          value={S.notes[nk] || ''}
          onChange={e => setNote(e.target.value)}
          style={S_css.textarea} />

        {allDone(S.week, S.day) && (
          <div style={{ ...S_css.doneBanner, borderColor: day.color, color: day.color }}>
            ▪ DAY COMPLETE — REST UP
          </div>
        )}
      </div>

      {/* WEEK SUMMARY */}
      <div style={S_css.summary}>
        <div style={S_css.sectionLabel}>WEEK {S.week + 1} BREAKDOWN</div>
        {DAYS.map((d, di) => {
          const w2 = calcWeight(base, d.pct, S.incr, S.week)
          const done = countFor(S.week, di)
          return (
            <div key={di} style={S_css.summRow}>
              <span style={{ ...S_css.summDay, color: d.color }}>{d.label}</span>
              <span style={S_css.summPx}>{d.sets}×{d.reps}</span>
              <span style={S_css.summW}>{w2 ? `${w2} lbs` : '—'}</span>
              <div style={S_css.miniBar}>
                <div style={{ height: '100%', borderRadius: 1, transition: 'width 0.3s', width: `${done / d.sets * 100}%`, background: d.color }} />
              </div>
              <span style={{ fontSize: 10, letterSpacing: 1, width: 32, textAlign: 'right', color: allDone(S.week, di) ? '#5CBA4A' : '#6A6A6A' }}>
                {allDone(S.week, di) ? '✓' : `${done}/${d.sets}`}
              </span>
            </div>
          )
        })}
      </div>

      {/* FULL PROGRAM */}
      <div style={S_css.summary}>
        <div style={S_css.sectionLabel}>FULL PROGRAM</div>
        {[0,1,2].map(wi => {
          const wd = weekIsDone(wi)
          const wc = weekCount(wi)
          return (
            <div key={wi} style={{ ...S_css.summRow, opacity: wi === S.week ? 1 : 0.5 }}>
              <span style={{ fontFamily: "'Bebas Neue'", fontSize: 15, letterSpacing: 1, width: 44, color: WEEK_COLORS[wi] }}>
                WK {wi + 1}
              </span>
              <span style={S_css.summW}>{!isNaN(base) && base ? `+${S.incr * wi} lbs` : '—'}</span>
              <div style={S_css.miniBar}>
                <div style={{ height: '100%', borderRadius: 1, transition: 'width 0.3s', width: `${wc / WEEK_TOTAL_SETS * 100}%`, background: WEEK_COLORS[wi] }} />
              </div>
              <span style={{ fontSize: 10, letterSpacing: 1, width: 42, textAlign: 'right', color: wd ? '#5CBA4A' : '#6A6A6A' }}>
                {wd ? 'DONE' : `${wc}/${WEEK_TOTAL_SETS}`}
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ height: 48 }} />
    </div>
  )
}

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0D0D0D; }
  input:focus, textarea:focus { outline: none; border-color: #6A6A6A !important; }
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
  input[type=number] { -moz-appearance: textfield; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0D0D0D; }
  ::-webkit-scrollbar-thumb { background: #2A2A2A; border-radius: 2px; }

  .icon-btn {
    background: transparent; border: 1px solid; border-radius: 3px;
    padding: 5px 10px; font-family: 'DM Mono', monospace;
    font-size: 9px; letter-spacing: 2px; cursor: pointer; transition: all 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
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
  .weight-inline {
    width: 90px; padding: 4px 0; background: transparent;
    border: none; border-bottom: 1px solid #2A2A2A;
    color: #F0EDE6; font-family: 'DM Mono', monospace; font-size: 16px;
  }
  .week-tab {
    flex: 1; padding: 11px 8px; background: transparent;
    border: none; border-bottom: 2px solid transparent;
    color: #6A6A6A; font-family: 'Bebas Neue', sans-serif;
    font-size: 13px; letter-spacing: 2px; cursor: pointer; transition: all 0.15s; text-align: center;
    -webkit-tap-highlight-color: transparent;
  }
  .week-tab.active { color: #F0EDE6; }
  .week-tab.wk-done { color: #5CBA4A !important; border-bottom-color: #5CBA4A !important; }
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
  .rpe-btn {
    width: 34px; height: 30px; border-radius: 3px;
    border: 1px solid #2A2A2A; background: transparent; color: #6A6A6A;
    font-family: 'DM Mono', monospace; font-size: 10px; cursor: pointer; transition: all 0.1s;
    -webkit-tap-highlight-color: transparent;
  }
  .rpe-btn.sel {
    border-color: var(--dc); color: var(--dc);
    background: color-mix(in srgb, var(--dc) 14%, transparent);
  }
`

const S_css = {
  root: { fontFamily: "'DM Mono', monospace", background: '#0D0D0D', minHeight: '100vh', color: '#F0EDE6', maxWidth: 520, margin: '0 auto' },
  header: { padding: '24px 20px 16px', borderBottom: '1px solid #2A2A2A', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { fontSize: 10, letterSpacing: 4, color: '#6A6A6A', marginBottom: 2 },
  mainTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: 4, lineHeight: 1 },
  overallLabel: { fontSize: 9, letterSpacing: 2, color: '#6A6A6A', marginBottom: 4 },
  progPct: { fontSize: 10, color: '#6A6A6A', letterSpacing: 1 },
  settingsBox: { background: '#161616', border: '1px solid #2A2A2A', borderRadius: 4, padding: '16px 20px', margin: '14px 20px' },
  sectionLabel: { fontSize: 10, letterSpacing: 3, color: '#6A6A6A', marginBottom: 10 },
  fieldLabel: { display: 'block', fontSize: 9, letterSpacing: 2, color: '#6A6A6A', marginBottom: 6 },
  incrNote: { fontSize: 9, color: '#6A6A6A', marginTop: 10, letterSpacing: 0.5 },
  weightBar: { padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #2A2A2A', flexWrap: 'wrap' },
  wbLabel: { fontSize: 10, letterSpacing: 2, color: '#6A6A6A' },
  panel: { background: '#161616', border: '1px solid #2A2A2A', borderTop: 'none', margin: '0 20px', padding: '18px 16px 20px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 },
  infoLbl: { fontSize: 9, letterSpacing: 2, color: '#6A6A6A', marginBottom: 2 },
  infoVal: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 1 },
  incrNotePanel: { fontSize: 9, color: '#6A6A6A', letterSpacing: 0.5, marginBottom: 16, fontStyle: 'italic' },
  rowLabel: { display: 'flex', justifyContent: 'space-between', fontSize: 10, letterSpacing: 2, color: '#6A6A6A', marginBottom: 8 },
  textarea: { width: '100%', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 3, color: '#F0EDE6', fontFamily: "'DM Mono', monospace", fontSize: 11, padding: '9px 11px', resize: 'vertical', lineHeight: 1.6, marginBottom: 16 },
  doneBanner: { border: '1px solid', borderRadius: 3, padding: '10px 14px', fontSize: 10, letterSpacing: 3, fontWeight: 500 },
  summary: { margin: '22px 20px 0' },
  summRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  summDay: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: 1, width: 36 },
  summPx: { fontSize: 10, width: 40 },
  summW: { fontSize: 10, color: '#6A6A6A', width: 60 },
  miniBar: { flex: 1, height: 2, background: '#2A2A2A', borderRadius: 1, overflow: 'hidden' },
}
