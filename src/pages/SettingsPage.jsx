import { useState } from 'react'
import { Link } from 'react-router-dom'
import CategoryManager from '../components/CategoryManager.jsx'
import ProductManager from '../components/ProductManager.jsx'
import StaffManager from '../components/StaffManager.jsx'
import CafeSettings from '../components/CafeSettings.jsx'
import SyncIndicator, { SyncBanner } from '../components/SyncIndicator.jsx'
import { useMenu, refreshMenu } from '../hooks/useMenu.js'

const TABS = [
  { id: 'categories', label: 'Categories' },
  { id: 'products',   label: 'Products'   },
  { id: 'staff',      label: 'Staff'      },
  { id: 'cafe',       label: 'Cafe'       }
]

export default function SettingsPage() {
  const [tab, setTab] = useState('categories')
  const { lastFetchedAt, loading } = useMenu()

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="bg-brand-600 text-white px-2 py-3 flex items-center gap-2 shadow sticky top-0 z-10">
        <Link to="/" className="text-2xl px-2 py-1">←</Link>
        <h1 className="font-bold text-lg flex-1">Settings</h1>
        <SyncIndicator />
        <button
          onClick={() => refreshMenu()}
          disabled={loading}
          className="text-xs bg-white/20 px-3 py-1.5 rounded-lg disabled:opacity-50"
          title="Refresh from Sheet"
        >
          {loading ? '…' : '↻'} Refresh
        </button>
      </header>

      <SyncBanner />

      <div className="bg-white border-b sticky top-[56px] z-10">
        <div className="flex">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-sm font-semibold transition ${
                tab === t.id
                  ? 'text-brand-700 border-b-2 border-brand-600'
                  : 'text-gray-500 border-b-2 border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-4 pb-20">
        {tab === 'categories' && <CategoryManager />}
        {tab === 'products'   && <ProductManager />}
        {tab === 'staff'      && <StaffManager />}
        {tab === 'cafe'       && <CafeSettings />}
      </main>

      {lastFetchedAt && (
        <footer className="text-center text-xs text-gray-400 py-3">
          Last synced {timeAgo(lastFetchedAt)}
        </footer>
      )}
    </div>
  )
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}
