import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentUser, logout } from '../lib/auth.js'
import { useMenu, refreshMenu } from '../hooks/useMenu.js'
import { CAFE } from '../config.js'
import CategoryTabs from '../components/CategoryTabs.jsx'
import ProductGrid from '../components/ProductGrid.jsx'
import Cart from '../components/Cart.jsx'
import SyncIndicator from '../components/SyncIndicator.jsx'

export default function BillingPage() {
  const user = getCurrentUser()
  const { data, loading, error } = useMenu()
  const [activeCat, setActiveCat] = useState(null)

  const categories = useMemo(
    () => (data?.categories || [])
      .filter(c => c.active)
      .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0)),
    [data]
  )

  const products = useMemo(
    () => (data?.products || []).filter(p => p.available),
    [data]
  )

  useEffect(() => {
    if (!activeCat && categories[0]) setActiveCat(categories[0].id)
  }, [categories, activeCat])

  const currentCat = categories.find(c => c.id === activeCat) || categories[0]
  const filteredProducts = currentCat
    ? products.filter(p => p.category_id === currentCat.id)
    : []

  return (
    <div className="min-h-screen flex flex-col bg-cream pb-24">
      <header className="bg-brand-600 text-white px-3 py-3 flex items-center justify-between shadow sticky top-0 z-30">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-bold text-base leading-tight">{CAFE.name}</div>
            <SyncIndicator />
          </div>
          <div className="text-[11px] opacity-90 truncate">Hi, {user?.name}</div>
        </div>
        <div className="flex items-center gap-1.5">
          {user?.role === 'admin' && (
            <>
              <Link to="/dashboard" title="Dashboard" className="text-base bg-white/20 px-2.5 py-1.5 rounded-lg">📊</Link>
              <Link to="/settings"  title="Settings"  className="text-base bg-white/20 px-2.5 py-1.5 rounded-lg">⚙️</Link>
            </>
          )}
          <button onClick={() => refreshMenu()} title="Refresh menu" className="text-base bg-white/20 px-2.5 py-1.5 rounded-lg">↻</button>
          <button onClick={logout} className="text-xs bg-white/20 px-2.5 py-1.5 rounded-lg">Logout</button>
        </div>
      </header>

      {loading && !data ? (
        <CenterMsg icon="⏳" title="Loading menu…" />
      ) : error && !data ? (
        <CenterMsg icon="⚠️" title="Couldn't load menu" text={error} action={{ label: 'Retry', onClick: refreshMenu }} />
      ) : categories.length === 0 ? (
        <CenterMsg
          icon="📁"
          title="No categories yet"
          text="Add a category and some products in Settings to start billing."
          action={user?.role === 'admin' ? { label: 'Go to Settings', to: '/settings' } : null}
        />
      ) : (
        <>
          <CategoryTabs
            categories={categories}
            activeId={currentCat?.id}
            onChange={setActiveCat}
          />
          <main className="flex-1">
            <ProductGrid products={filteredProducts} categoryIcon={currentCat?.icon} />
          </main>
          <Cart />
        </>
      )}
    </div>
  )
}

function CenterMsg({ icon, title, text, action }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="card p-6 max-w-sm w-full text-center">
        <div className="text-5xl mb-2">{icon}</div>
        <h2 className="text-lg font-bold text-brand-800 mb-1">{title}</h2>
        {text && <p className="text-sm text-gray-500 mb-4">{text}</p>}
        {action && (
          action.to
            ? <Link to={action.to} className="btn-primary inline-block">{action.label}</Link>
            : <button onClick={action.onClick} className="btn-primary">{action.label}</button>
        )}
      </div>
    </div>
  )
}
