import { useState, useEffect } from 'react'
import { api } from './api.js'
import { listPendingBills, removePendingBill } from './db.js'

// Global sync state — read by useSyncStatus()
let state = {
  pending: 0,
  syncing: false,
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  error: null,
  lastSyncAt: null
}
const listeners = new Set()
let inFlight = null   // promise lock so only one sync runs at a time
let intervalId = null

function notify() { listeners.forEach(fn => fn(state)) }
function setState(patch) { state = { ...state, ...patch }; notify() }

export async function refreshPendingCount() {
  try {
    const pending = await listPendingBills()
    setState({ pending: pending.length })
    return pending.length
  } catch {
    return state.pending
  }
}

export function syncPendingBills() {
  if (inFlight) return inFlight
  if (!navigator.onLine) {
    setState({ online: false })
    return Promise.resolve()
  }
  inFlight = (async () => {
    setState({ syncing: true, error: null })
    try {
      const pending = await listPendingBills()
      if (pending.length === 0) {
        setState({ pending: 0, syncing: false, lastSyncAt: Date.now() })
        return
      }
      const batch = pending.map(b => ({
        bill: {
          bill_id: b.bill_id,
          datetime: b.datetime,
          staff_id: b.staff_id,
          subtotal: b.subtotal,
          payment_mode: b.payment_mode
        },
        items: b.items || []
      }))
      const result = await api.saveBillBatch(batch)
      const savedIds = new Set(result?.saved || [])
      for (const b of pending) {
        if (savedIds.has(b.bill_id)) {
          try { await removePendingBill(b.bill_id) } catch {}
        }
      }
      const leftover = pending.length - savedIds.size
      setState({
        pending: leftover,
        syncing: false,
        error: leftover > 0 ? `${leftover} bill${leftover > 1 ? 's' : ''} failed — retrying` : null,
        lastSyncAt: Date.now()
      })
    } catch (err) {
      setState({ syncing: false, error: err.message || 'Sync failed' })
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}

/**
 * Wire up auto-sync. Call once from App.jsx on mount.
 */
export function setupAutoSync() {
  if (typeof window === 'undefined') return
  // Initial drain attempt
  refreshPendingCount().then(n => { if (n > 0 && navigator.onLine) syncPendingBills() })

  const onOnline = () => {
    setState({ online: true, error: null })
    syncPendingBills()
  }
  const onOffline = () => setState({ online: false })

  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  // Retry loop — only fires work when there's something pending and we're online
  if (intervalId) clearInterval(intervalId)
  intervalId = setInterval(() => {
    if (navigator.onLine && state.pending > 0 && !state.syncing) syncPendingBills()
  }, 60_000)
}

export function useSyncStatus() {
  const [s, set] = useState(state)
  useEffect(() => {
    listeners.add(set)
    return () => listeners.delete(set)
  }, [])
  return s
}
