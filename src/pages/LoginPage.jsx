import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authenticate, getCurrentUser } from '../lib/auth.js'
import { useMenu } from '../hooks/useMenu.js'
import { useCafe } from '../hooks/useCafe.js'
import { IS_API_CONFIGURED } from '../config.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const { data, loading, error } = useMenu()
  const cafe = useCafe()
  const activeStaff = (data?.staff || []).filter(s => s.active)

  const [selectedStaff, setSelectedStaff] = useState('')
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!selectedStaff && activeStaff[0]) setSelectedStaff(activeStaff[0].id)
  }, [activeStaff, selectedStaff])

  useEffect(() => {
    if (getCurrentUser()) navigate('/', { replace: true })
  }, [navigate])

  function handleDigit(d) {
    setErr('')
    if (pin.length < 4) setPin(p => p + d)
  }
  function handleBack() {
    setErr('')
    setPin(p => p.slice(0, -1))
  }
  function handleSubmit() {
    if (pin.length !== 4) return setErr('Enter 4-digit PIN')
    const res = authenticate(activeStaff, selectedStaff, pin)
    if (!res.ok) {
      setErr(res.error)
      setPin('')
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-brand-50 to-cream">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <img src="/icons/icon-512.png" alt={cafe.name} className="w-24 h-24 mx-auto mb-3 rounded-3xl shadow-lg object-contain bg-white" />
          <h1 className="text-3xl font-bold text-brand-800">{cafe.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{cafe.tagline}</p>
        </div>

        <div className="card p-6">
          {!IS_API_CONFIGURED ? (
            <ApiNotConfigured />
          ) : loading && !data ? (
            <div className="text-center py-8 text-gray-500 text-sm">Loading staff…</div>
          ) : activeStaff.length === 0 ? (
            <NoStaff error={error} />
          ) : (
            <>
              <label className="text-sm font-medium text-gray-700">Who's at the counter?</label>
              <select
                value={selectedStaff}
                onChange={e => { setSelectedStaff(e.target.value); setPin(''); setErr('') }}
                className="input mt-2"
              >
                {activeStaff.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.role === 'admin' ? ' (Owner)' : ''}
                  </option>
                ))}
              </select>

              <label className="text-sm font-medium text-gray-700 mt-5 block">Enter PIN</label>
              <div className="flex justify-center gap-3 mt-2 mb-4">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold ${pin.length > i ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white'}`}>
                    {pin.length > i ? '●' : ''}
                  </div>
                ))}
              </div>

              {err && <div className="text-center text-red-600 text-sm mb-3">{err}</div>}

              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                  <button key={d} onClick={() => handleDigit(String(d))} className="h-14 rounded-xl bg-white border border-gray-200 active:bg-gray-100 text-xl font-semibold">{d}</button>
                ))}
                <button onClick={handleBack} className="h-14 rounded-xl bg-white border border-gray-200 active:bg-gray-100 text-sm">←</button>
                <button onClick={() => handleDigit('0')} className="h-14 rounded-xl bg-white border border-gray-200 active:bg-gray-100 text-xl font-semibold">0</button>
                <button onClick={handleSubmit} className="h-14 rounded-xl bg-brand-600 active:bg-brand-700 text-white font-semibold">Go</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ApiNotConfigured() {
  return (
    <div className="py-2 text-sm">
      <div className="text-3xl text-center mb-2">⚙️</div>
      <p className="font-medium text-center mb-2">Backend not configured</p>
      <p className="text-gray-500 text-center">
        Add <code className="bg-gray-100 px-1 rounded">VITE_API_URL</code> to your environment.
        See <span className="text-brand-700">setup.md</span> for the deploy steps.
      </p>
    </div>
  )
}

function NoStaff({ error }) {
  return (
    <div className="py-4 text-sm text-center">
      <div className="text-3xl mb-2">👥</div>
      <p className="font-medium mb-1">No staff found</p>
      {error
        ? <p className="text-red-600">{error}</p>
        : <p className="text-gray-500">Check that the Staff sheet has at least one row with active = TRUE.</p>}
    </div>
  )
}
