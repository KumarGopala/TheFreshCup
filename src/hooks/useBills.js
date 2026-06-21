import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api.js'
import { getCache, setCache } from '../lib/db.js'

/**
 * Fetch bills for a date range. Renders cached results immediately (if any),
 * then refreshes from API. Re-runs when `from` or `to` changes.
 */
export function useBills(from, to) {
  const [s, setS] = useState({ loading: true, data: null, error: null })
  const seq = useRef(0)

  useEffect(() => {
    if (!from || !to) return
    const my = ++seq.current
    const key = `bills:${from}:${to}`
    setS({ loading: true, data: null, error: null })

    ;(async () => {
      // Cached snapshot first (instant)
      try {
        const cached = await getCache(key)
        if (cached && seq.current === my) {
          setS(prev => ({ ...prev, loading: true, data: cached }))
        }
      } catch {}

      // Fresh fetch
      try {
        const data = await api.getBills(from, to)
        if (seq.current !== my) return
        await setCache(key, data)
        setS({ loading: false, data, error: null })
      } catch (e) {
        if (seq.current !== my) return
        setS(prev => ({
          loading: false,
          data: prev.data, // keep cache if present
          error: e.message
        }))
      }
    })()
  }, [from, to])

  return s
}
