import { useState } from 'react'
import { useMenu, refreshMenu } from '../hooks/useMenu.js'
import { api } from '../lib/api.js'
import Modal from './Modal.jsx'
import { toast } from './Toast.jsx'

export default function CategoryManager() {
  const { data, loading } = useMenu()
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)

  const cats = [...(data?.categories || [])].sort(
    (a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0)
  )
  const products = data?.products || []

  function startNew() {
    setEditing({
      id: '',
      name: '',
      icon: '',
      display_order: cats.length + 1,
      active: true
    })
  }

  async function save(row) {
    setBusy(true)
    try {
      await api.upsertCategory(row)
      toast('Category saved', 'success')
      await refreshMenu()
      setEditing(null)
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function remove(cat) {
    const count = products.filter(p => p.category_id === cat.id).length
    if (count > 0) {
      toast(`Cannot delete — ${count} product${count > 1 ? 's' : ''} in this category`, 'error')
      return
    }
    if (!confirm(`Delete "${cat.name}"?`)) return
    try {
      await api.deleteCategory(cat.id)
      toast('Deleted', 'success')
      await refreshMenu()
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  if (loading && !data) return <Skeleton />

  return (
    <div>
      <button onClick={startNew} className="btn-primary w-full mb-4">+ Add Category</button>
      {cats.length === 0 ? (
        <Empty label="No categories yet" />
      ) : (
        <div className="space-y-2">
          {cats.map(c => (
            <div key={c.id} className="card p-3 flex items-center gap-3">
              <div className="text-2xl w-10 text-center">{c.icon || '📁'}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{c.name}</div>
                <div className="text-xs text-gray-400">
                  Order {c.display_order}
                  {!c.active && <span className="ml-2 text-amber-600">• Hidden</span>}
                  <span className="ml-2">• {products.filter(p => p.category_id === c.id).length} items</span>
                </div>
              </div>
              <button onClick={() => setEditing(c)} className="text-sm font-medium text-brand-700 px-3 py-2">Edit</button>
              <button onClick={() => remove(c)} className="text-sm font-medium text-red-600 px-3 py-2">Delete</button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => !busy && setEditing(null)} title={editing?.id ? 'Edit Category' : 'New Category'}>
        {editing && <CategoryForm initial={editing} onSubmit={save} busy={busy} />}
      </Modal>
    </div>
  )
}

function CategoryForm({ initial, onSubmit, busy }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function submit(e) {
    e.preventDefault()
    onSubmit({
      ...form,
      id: form.id || 'cat-' + Date.now(),
      name: (form.name || '').trim(),
      icon: (form.icon || '').trim(),
      display_order: Number(form.display_order) || 1,
      active: !!form.active
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700">Name *</label>
        <input className="input mt-1" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Milkshakes" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Icon (emoji)</label>
        <input className="input mt-1" value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="🥤" maxLength={4} />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Display Order</label>
        <input className="input mt-1" type="number" min={1} value={form.display_order} onChange={e => set('display_order', e.target.value)} />
      </div>
      <label className="flex items-center gap-2 select-none">
        <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="w-5 h-5" />
        <span className="text-sm">Visible in billing screen</span>
      </label>
      <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
        {busy ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}

function Skeleton() {
  return <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
}
function Empty({ label }) {
  return <div className="text-center py-10 text-gray-400 text-sm">{label}</div>
}
