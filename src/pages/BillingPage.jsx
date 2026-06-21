import { Link } from 'react-router-dom'
import { getCurrentUser, logout } from '../lib/auth.js'
import { CAFE, IS_API_CONFIGURED } from '../config.js'

export default function BillingPage() {
  const user = getCurrentUser()
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-600 text-white px-4 py-3 flex items-center justify-between shadow">
        <div>
          <div className="font-bold text-lg">{CAFE.name}</div>
          <div className="text-xs opacity-90">Hi, {user?.name}</div>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <>
              <Link to="/dashboard" className="text-xs bg-white/20 px-3 py-1.5 rounded-lg">Dashboard</Link>
              <Link to="/settings" className="text-xs bg-white/20 px-3 py-1.5 rounded-lg">Settings</Link>
            </>
          )}
          <button onClick={logout} className="text-xs bg-white/20 px-3 py-1.5 rounded-lg">Logout</button>
        </div>
      </header>

      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="card p-6 max-w-md text-center">
          <div className="text-5xl mb-3">🚧</div>
          <h2 className="text-xl font-bold text-brand-800 mb-2">Phase 0 — Scaffold Live</h2>
          <p className="text-gray-600 text-sm mb-4">
            Login, theme, routing, and PWA setup are working. The billing screen, menu CRUD, receipt, offline sync, and dashboard come in the next phases.
          </p>
          <div className="text-left text-sm bg-brand-50 rounded-xl p-4 space-y-2">
            <div>✓ React + Vite + Tailwind</div>
            <div>✓ Mobile-first responsive layout</div>
            <div>✓ PIN-based login (3 test users)</div>
            <div>✓ Admin / cashier role split</div>
            <div>✓ PWA manifest + service worker</div>
            <div className={IS_API_CONFIGURED ? 'text-fresh' : 'text-amber-600'}>
              {IS_API_CONFIGURED ? '✓' : '⚠'} Google Sheet API: {IS_API_CONFIGURED ? 'connected' : 'not configured (see setup.md)'}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
