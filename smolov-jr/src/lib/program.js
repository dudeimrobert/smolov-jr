export const DAYS = [
  { label: 'MON', sets: 6,  reps: 6, pct: 0.70, color: '#E8C547' },
  { label: 'WED', sets: 7,  reps: 5, pct: 0.75, color: '#E87447' },
  { label: 'FRI', sets: 8,  reps: 4, pct: 0.80, color: '#E84747' },
  { label: 'SAT', sets: 10, reps: 3, pct: 0.85, color: '#C247E8' },
]

export const WEEK_COLORS = ['#E8C547', '#E87447', '#C247E8']
export const WEEK_TOTAL_SETS = DAYS.reduce((a, d) => a + d.sets, 0) // 31

export function calcWeight(base, pct, incr, weekIdx) {
  if (!base || isNaN(base)) return null
  return Math.round((base * pct + incr * weekIdx) / 2.5) * 2.5
}
