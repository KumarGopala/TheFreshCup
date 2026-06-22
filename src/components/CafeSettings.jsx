import { useState, useEffect, useMemo } from 'react'
import { useMenu, refreshMenu } from '../hooks/useMenu.js'
import { api } from '../lib/api.js'
import { toast } from './Toast.jsx'

const DEFAULTS = {
  cafe_name: 'The Fresh Cup',
  currency: '₹',
  receipt_footer: 'Thank you for visiting!\nVisit again at The Fresh Cup'
}

export default function CafeSettings() {
  const { data, loading } = useMenu()

  const settings = useMemo(() => {
    if (Array.isArray(data?.settings)) {
      return Object.fromEntries((data.settings || []).map(r => [r.key, r.value]))
    }
    return data?.settings || {}
  }, [data])

  const [form, setForm] = useState({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setForm({
      cafe_name: settings.cafe_name ?? DEFAULTS.cafe_name,
      receipt_footer: settings.receipt_footer ?? DEFAULTS.receipt_footer
    })
  }, [settings.cafe_name, settings.receipt_footer])

  const adminUsesDefaultPin = useMemo(
    () => (data?.staff || []).some(s => s.role === 'admin' && String(s.pin) === '1234'),
    [data]
  )

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    setBusy(true)
    try {
      const updates = []
      if ((form.cafe_name || '').trim() !== (settings.cafe_name || '')) {
        updates.push(['cafe_name', (form.cafe_name || '').trim() || DEFAULTS.cafe_name])
      }
      if ((form.receipt_footer ?? '') !== (settings.receipt_footer ?? '')) {
        updates.push(['receipt_footer', form.receipt_footer || ''])
      }
      if (updates.length === 0) {
        toast('Nothing changed', 'info')
        setBusy(false)
        return
      }
      for (const [k, v] of updates) {
        await api.updateSetting(k, v)
      }
      toast('Saved', 'success')
      await refreshMenu()
    } catch (e) {
      toast(e.message || 'Failed to save', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading && !data) return <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>

  return (
    <div className="space-y-4">
      {adminUsesDefaultPin && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-3 text-sm flex items-start gap-3">
          <div className="text-xl">⚠️</div>
          <div className="flex-1">
            <div className="font-semibold">Change the default admin PIN</div>
            <div className="text-xs mt-0.5">The "Owner" account is still using PIN 1234. Anyone who knows it can access Settings &amp; Dashboard. Edit it in the Staff tab.</div>
          </div>
        </div>
      )}

      <div className="card p-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Cafe name</label>
          <p className="text-xs text-gray-400 mb-1">Shown in the app header and on every receipt.</p>
          <input
            className="input"
            value={form.cafe_name || ''}
            onChange={e => set('cafe_name', e.target.value)}
            maxLength={60}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Receipt footer</label>
          <p className="text-xs text-gray-400 mb-1">Printed at the bottom of every receipt. Up to 3 lines.</p>
          <textarea
            className="input min-h-[80px]"
            value={form.receipt_footer || ''}
            onChange={e => set('receipt_footer', e.target.value)}
            maxLength={200}
            rows={3}
          />
        </div>

        <button onClick={save} disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="card p-4 text-xs text-gray-500 space-y-1.5">
        <div className="font-semibold text-gray-700 text-sm mb-1">About</div>
        <div>Data lives in your Google Sheet. Open Drive → "The Fresh Cup — Data" any time.</div>
        <div>App version: Phase 6</div>
      </div>
    </div>
  )
}
