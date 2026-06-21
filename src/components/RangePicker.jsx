import { useState } from 'react'
import Modal from './Modal.jsx'
import { rangeToday, rangeWeek, rangeMonth, rangeCustom } from '../lib/dashboard.js'

const PRESETS = [
  { id: 'today', label: 'Today',  build: rangeToday },
  { id: 'week',  label: 'Week',   build: rangeWeek  },
  { id: 'month', label: 'Month',  build: rangeMonth }
]

export default function RangePicker({ value, onChange }) {
  const [showCustom, setShowCustom] = useState(false)
  const presetId = value?.presetId || 'today'

  function pick(p) {
    onChange({ ...p.build(), presetId: p.id })
  }

  function applyCustom(from, to) {
    if (!from || !to) return
    onChange({ ...rangeCustom(from, to), presetId: 'custom' })
    setShowCustom(false)
  }

  return (
    <>
      <div className="flex gap-2 px-3 py-3 overflow-x-auto no-scrollbar">
        {PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => pick(p)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition ${
              presetId === p.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 active:bg-gray-100'
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(true)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition ${
            presetId === 'custom'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 active:bg-gray-100'
          }`}
        >
          {presetId === 'custom' ? value.label : 'Custom…'}
        </button>
      </div>

      <Modal open={showCustom} onClose={() => setShowCustom(false)} title="Custom Date Range">
        <CustomForm onSubmit={applyCustom} initial={value} />
      </Modal>
    </>
  )
}

function CustomForm({ onSubmit, initial }) {
  const today = new Date().toISOString().slice(0, 10)
  const sevenAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
  const [from, setFrom] = useState(sevenAgo)
  const [to, setTo]     = useState(today)

  function submit(e) {
    e.preventDefault()
    if (from > to) return alert('"From" must be before "To"')
    onSubmit(from, to)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">From</label>
          <input type="date" className="input mt-1" value={from} onChange={e => setFrom(e.target.value)} max={today} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">To</label>
          <input type="date" className="input mt-1" value={to} onChange={e => setTo(e.target.value)} max={today} />
        </div>
      </div>
      <button type="submit" className="btn-primary w-full">Apply</button>
    </form>
  )
}
