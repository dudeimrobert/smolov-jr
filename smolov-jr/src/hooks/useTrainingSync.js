import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const LOCAL_KEY = 'training_v1'

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') } catch { return {} }
}
function saveLocal(data) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)) } catch {}
}

const DEFAULT_STATE = {
  week: 0,
  session: 'push',
  completed: {},
  weights: {},
  history: {},
}

export function useTrainingSync(user) {
  const [data, setDataRaw] = useState(() => ({ ...DEFAULT_STATE, ...loadLocal() }))
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState(null)
  const debounceRef = useRef(null)

  // Load from Supabase when user logs in
  useEffect(() => {
    if (!user) return
    setSyncing(true)
    supabase
      .from('training_data')
      .select('data')
      .eq('user_id', user.id)
      .single()
      .then(({ data: row }) => {
        if (row?.data) {
          const merged = { ...DEFAULT_STATE, ...row.data }
          setDataRaw(merged)
          saveLocal(merged)
          setLastSynced(new Date())
        }
        setSyncing(false)
      })
  }, [user?.id])

  // Debounced sync to Supabase — same 800ms pattern as useSync
  const syncToSupabase = useCallback((newData, userId) => {
    if (!userId) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSyncing(true)
      await supabase
        .from('training_data')
        .upsert(
          { user_id: userId, data: newData, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
      setLastSynced(new Date())
      setSyncing(false)
    }, 800)
  }, [])

  const setData = useCallback((updater) => {
    setDataRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      saveLocal(next)
      if (user) syncToSupabase(next, user.id)
      return next
    })
  }, [user, syncToSupabase])

  return { data, setData, syncing, lastSynced }
}
