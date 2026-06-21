import { Link } from 'react-router-dom'
import { getCurrentUser, logout } from '../lib/auth.js'
import { useMenu } from '../hooks/useMenu.js'
import { CAFE } from '../config.js'

export default function BillingPage() {
  const user = getCurrentUser()
  const { data, loading, error } = useMenu()

  const cats = data?.categories?.filter(c => c.active).length || 0
  const prods = data?.products?.filter(p => p.available).length || 0

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="bg-brand-600 text-white px-3 py-3 flex items-center justify-between shadow">
        <div>
          <div className="font-bold text-lg">{CAFE.name}</div>
          <div className="text-xs opacity-90">Hi, {user?.name}</div>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <>
              <Link to="/dashboard" className="text-xs bg-white/20 px-3 py-1.5 rounded-lg">📊</Link>
              <Link to="/settings"  className="text-xs bg-white/20 px-3 py-1.5 rounded-lg">⚙️</Link>
            </>
          )}
          <button onClick={logout} className="text-xs bg-white/20 px-3 py-1.5 rounded-lg">Logout</button>
        </div>
      </header>

      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="card p-6 max-w-md w-full text-center">
          <div className="text-5xl mb-3">{loading && !data ? '⏳' : error ? '⚠️' : '🚧'}</div>
          <h2 className="text-xl font-bold text-brand-800 mb-2">
            {loading && !data ? 'Loading menu…' : error ? 'Connection issue' : 'Phase 1 — Settings live'}
          </h2>
          {error ? (
            <p className="text-red-600 text-sm mb-3">{error}</p>
          ) : (
            <p className="text-gray-600 text-sm mb-4">
              Menu synced from your Google Sheet — {cats} categor{cats === 1 ? 'y' : 'ies'}, {prods} product{prods === 1 ? '' : 's'}.
              The billing tile grid comes in Phase 2.
            </p>
          )}
          {user?.role === 'admin' && (
            <div className="flex gap-2 justify-center mt-4">
              <Link to="/settings" className="btn-primary flex-1">Manage Menu</Link>
              <Link to="/dashboard" className="btn-secondary flex-1">Dashboard</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
