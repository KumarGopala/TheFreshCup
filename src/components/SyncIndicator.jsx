import { useSyncStatus, syncPendingBills } from '../lib/sync.js'
import { useOnline } from '../hooks/useOnline.js'

/**
 * Compact status pill for the app header.
 * - Hidden in the steady state (online, 0 pending, no error)
 * - Shows pending count, syncing animation, or offline
 * - Tap to force a sync attempt
 */
export default function SyncIndicator({ variant = 'header' }) {
  const status = useSyncStatus()
  const online = useOnline()

  const steady = online && status.pending === 0 && !status.syncing && !status.error
  if (steady && variant === 'header') return null

  const label =
    status.syncing       ? 'Syncing…'                                  :
    !online              ? (status.pending ? `${status.pending} offline` : 'Offline') :
    status.pending > 0   ? `${status.pending} pending`                  :
    status.error         ? 'Sync error'                                 :
                           'Synced'

  const color =
    status.syncing       ? 'bg-blue-500'  :
    !online              ? 'bg-amber-500' :
    status.pending > 0   ? 'bg-amber-500' :
    status.error         ? 'bg-red-500'   :
                           'bg-green-500'

  const dot = status.syncing
    ? <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
    : null

  return (
    <button
      onClick={() => online && syncPendingBills()}
      title={status.error || 'Sync status'}
      className={`${color} text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1.5 leading-none`}
    >
      {dot}
      <span>{label}</span>
    </button>
  )
}

/**
 * Larger banner version — for the Settings page footer.
 */
export function SyncBanner() {
  const status = useSyncStatus()
  const online = useOnline()
  const steady = online && status.pending === 0 && !status.syncing && !status.error
  if (steady) return null

  return (
    <div className="mx-3 mb-3 px-4 py-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-900 text-sm flex items-center justify-between">
      <div>
        <div className="font-semibold">
          {!online ? 'You are offline' : status.syncing ? 'Syncing…' : status.error ? 'Sync error' : `${status.pending} bills pending`}
        </div>
        {status.error && <div className="text-xs mt-0.5">{status.error}</div>}
        {!online && <div className="text-xs mt-0.5">Bills will keep saving locally and sync when online.</div>}
      </div>
      {online && status.pending > 0 && !status.syncing && (
        <button onClick={() => syncPendingBills()} className="bg-brand-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
          Sync Now
        </button>
      )}
    </div>
  )
}
