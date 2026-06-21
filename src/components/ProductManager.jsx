import { useState, useMemo } from 'react'
import { useMenu, refreshMenu } from '../hooks/useMenu.js'
import { api } from '../lib/api.js'
import Modal from './Modal.jsx'
import { toast } from './Toast.jsx'

export default function ProductManager() {
  const { data, loading } = useMenu()
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [filterCat, setFilterCat] = useState('all')

  const cats = data?.categories || []
  const products = useMemo(() => {
    const list = data?.products || []
    return filterCat === 'all' ? list : list.filter(p => p.category_id === filterCat)
  }, [data, filterCat])

  function startNew() {
    if (cats.length === 0) {
      toast('Add a category first', 'error')
      return
    }
    setEditing({
      id: '',
      name: '',
      category_id: cats[0].id,
      price: '',
      image_url: '',
      available: true
    })
  }

  async function save(row) {
    setBusy(true)
    try {
      await api.upsertProduct(row)
      toast('Product saved', 'success')
      await refreshMenu()
      setEditing(null)
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function remove(p) {
    if (!confirm(`Delete "${p.name}"?`)) return
    try {
      await api.deleteProduct(p.id)
      toast('Deleted', 'success')
      await refreshMenu()
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  if (loading && !data) return <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>

  return (
    <div>
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
        <button onClick={() => setFilterCat('all')} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${filterCat === 'all' ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200'}`}>All ({data?.products?.length || 0})</button>
        {cats.map(c => (
          <button key={c.id} onClick={() => setFilterCat(c.id)} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${filterCat === c.id ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200'}`}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      <button onClick={startNew} className="btn-primary w-full mb-4">+ Add Product</button>

      {products.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No products{filterCat !== 'all' ? ' in this category' : ' yet'}</div>
      ) : (
        <div className="space-y-2">
          {products.map(p => {
            const cat = cats.find(c => c.id === p.category_id)
            return (
              <div key={p.id} className="card p-3 flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">{cat?.icon || '🍽️'}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-gray-500">
                    ₹{p.price} • {cat?.name || 'No category'}
                    {!p.available && <span className="ml-1 text-amber-600">• Out of stock</span>}
                  </div>
                </div>
                <button onClick={() => setEditing(p)} className="text-sm font-medium text-brand-700 px-2 py-2">Edit</button>
                <button onClick={() => remove(p)} className="text-sm font-medium text-red-600 px-2 py-2">Del</button>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={!!editing} onClose={() => !busy && setEditing(null)} title={editing?.id ? 'Edit Product' : 'New Product'}>
        {editing && <ProductForm initial={editing} categories={cats} onSubmit={save} busy={busy} />}
      </Modal>
    </div>
  )
}

function ProductForm({ initial, categories, onSubmit, busy }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function submit(e) {
    e.preventDefault()
    const price = Number(form.price)
    if (!price || price < 0) return alert('Enter a valid price')
    onSubmit({
      ...form,
      id: form.id || 'p-' + Date.now(),
      name: (form.name || '').trim(),
      image_url: (form.image_url || '').trim(),
      price,
      available: !!form.available
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700">Name *</label>
        <input className="input mt-1" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Mango Milkshake" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Category *</label>
          <select className="input mt-1" required value={form.category_id} onChange={e => set('category_id', e.target.value)}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Price (₹) *</label>
          <input className="input mt-1" type="number" min={0} step={1} required inputMode="numeric" value={form.price} onChange={e => set('price', e.target.value)} placeholder="120" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Image URL</label>
        <input className="input mt-1" type="url" value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://..." />
        {form.image_url && (
          <img src={form.image_url} alt="" className="mt-2 w-24 h-24 object-cover rounded-lg" onError={e => { e.target.style.display = 'none' }} />
        )}
        <p className="text-xs text-gray-400 mt-1">Tip: search Unsplash for free images. Right-click → Copy image address.</p>
      </div>
      <label className="flex items-center gap-2 select-none">
        <input type="checkbox" checked={form.available} onChange={e => set('available', e.target.checked)} className="w-5 h-5" />
        <span className="text-sm">In stock (visible in billing)</span>
      </label>
      <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
        {busy ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
