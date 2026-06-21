import { useState } from 'react'
import { useMenu, refreshMenu } from '../hooks/useMenu.js'
import { api } from '../lib/api.js'
import { getCurrentUser } from '../lib/auth.js'
import Modal from './Modal.jsx'
import { toast } from './Toast.jsx'

export default function StaffManager() {
  const { data, loading } = useMenu()
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const me = getCurrentUser()

  const staff = data?.staff || []

  function startNew() {
    setEditing({
      id: '',
      name: '',
      pin: '',
      role: 'cashier',
      active: true
    })
  }

  async function save(row) {
    setBusy(true)
    try {
      await api.upsertStaff(row)
      toast('Staff saved', 'success')
      await refreshMenu()
      setEditing(null)
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function remove(s) {
    if (s.id === me?.id) {
      toast("You can't delete yourself", 'error')
      return
    }
    if (!confirm(`Delete "${s.name}"?`)) return
    try {
      await api.deleteStaff(s.id)
      toast('Deleted', 'success')
      await refreshMenu()
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  if (loading && !data) return <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>

  return (
    <div>
      <button onClick={startNew} className="btn-primary w-full mb-4">+ Add Staff</button>
      {staff.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No staff yet</div>
      ) : (
        <div className="space-y-2">
          {staff.map(s => (
            <div key={s.id} className="card p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                {(s.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {s.name}
                  {s.id === me?.id && <span className="ml-2 text-xs text-fresh">(You)</span>}
                </div>
                <div className="text-xs text-gray-500">
                  {s.role === 'admin' ? 'Owner' : 'Cashier'} • PIN ••••
                  {!s.active && <span className="ml-2 text-amber-600">• Disabled</span>}
                </div>
              </div>
              <button onClick={() => setEditing(s)} className="text-sm font-medium text-brand-700 px-3 py-2">Edit</button>
              {s.id !== me?.id && (
                <button onClick={() => remove(s)} className="text-sm font-medium text-red-600 px-3 py-2">Delete</button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => !busy && setEditing(null)} title={editing?.id ? 'Edit Staff' : 'New Staff'}>
        {editing && <StaffForm initial={editing} onSubmit={save} busy={busy} />}
      </Modal>
    </div>
  )
}

function StaffForm({ initial, onSubmit, busy }) {
  const [form, setForm] = useState({ ...initial, pin: String(initial.pin || '') })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function submit(e) {
    e.preventDefault()
    const pin = String(form.pin || '').trim()
    if (!/^\d{4}$/.test(pin)) return alert('PIN must be exactly 4 digits')
    onSubmit({
      ...form,
      id: form.id || (form.role === 'admin' ? 'admin-' : 'staff-') + Date.now(),
      name: (form.name || '').trim(),
      pin,
      role: form.role,
      active: !!form.active
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700">Name *</label>
        <input className="input mt-1" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Ramesh" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">4-digit PIN *</label>
        <input
          className="input mt-1 tracking-[0.5em] text-center text-xl font-mono"
          required
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          value={form.pin}
          onChange={e => set('pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Role *</label>
        <select className="input mt-1" value={form.role} onChange={e => set('role', e.target.value)}>
          <option value="cashier">Cashier — can only create bills</option>
          <option value="admin">Owner — full access incl. settings & dashboard</option>
        </select>
      </div>
      <label className="flex items-center gap-2 select-none">
        <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="w-5 h-5" />
        <span className="text-sm">Active (can log in)</span>
      </label>
      <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
        {busy ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
