import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, SEED_STAFF, getCurrentUser } from '../lib/auth.js'
import { CAFE } from '../config.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const [selectedStaff, setSelectedStaff] = useState(SEED_STAFF[0].id)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  if (getCurrentUser()) {
    navigate('/', { replace: true })
    return null
  }

  function handleDigit(d) {
    setError('')
    if (pin.length < 4) setPin(p => p + d)
  }

  function handleBackspace() {
    setError('')
    setPin(p => p.slice(0, -1))
  }

  function handleSubmit() {
    if (pin.length !== 4) return setError('Enter 4-digit PIN')
    const res = login(selectedStaff, pin)
    if (!res.ok) {
      setError(res.error)
      setPin('')
      return
    }
    navigate(res.user.role === 'admin' ? '/' : '/', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-brand-50 to-cream">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-600 text-white text-4xl shadow-lg mb-4">
            ☕
          </div>
          <h1 className="text-3xl font-bold text-brand-800">{CAFE.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{CAFE.tagline}</p>
        </div>

        <div className="card p-6">
          <label className="text-sm font-medium text-gray-700">Who's at the counter?</label>
          <select
            value={selectedStaff}
            onChange={e => { setSelectedStaff(e.target.value); setPin(''); setError('') }}
            className="input mt-2"
          >
            {SEED_STAFF.filter(s => s.active).map(s => (
              <option key={s.id} value={s.id}>{s.name} {s.role === 'admin' ? '(Owner)' : ''}</option>
            ))}
          </select>

          <label className="text-sm font-medium text-gray-700 mt-5 block">Enter PIN</label>
          <div className="flex justify-center gap-3 mt-2 mb-4">
            {[0,1,2,3].map(i => (
              <div key={i} className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold ${pin.length > i ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white'}`}>
                {pin.length > i ? '●' : ''}
              </div>
            ))}
          </div>

          {error && <div className="text-center text-red-600 text-sm mb-3">{error}</div>}

          <div className="grid grid-cols-3 gap-2">
            {[1,2,3,4,5,6,7,8,9].map(d => (
              <button key={d} onClick={() => handleDigit(String(d))} className="h-14 rounded-xl bg-white border border-gray-200 active:bg-gray-100 text-xl font-semibold">
                {d}
              </button>
            ))}
            <button onClick={handleBackspace} className="h-14 rounded-xl bg-white border border-gray-200 active:bg-gray-100 text-sm">←</button>
            <button onClick={() => handleDigit('0')} className="h-14 rounded-xl bg-white border border-gray-200 active:bg-gray-100 text-xl font-semibold">0</button>
            <button onClick={handleSubmit} className="h-14 rounded-xl bg-brand-600 active:bg-brand-700 text-white font-semibold">Go</button>
          </div>

          <div className="mt-5 text-xs text-gray-400 text-center">
            Test PINs · Owner: 1234 · Ramesh: 1111 · Suresh: 2222
          </div>
        </div>
      </div>
    </div>
  )
}
