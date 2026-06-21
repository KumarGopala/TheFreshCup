import { Link } from 'react-router-dom'
import { CAFE } from '../config.js'

export default function SettingsPage() {
  return (
    <div className="min-h-screen p-4">
      <Link to="/" className="text-sm text-brand-700">← Back to billing</Link>
      <h1 className="text-2xl font-bold text-brand-800 mt-2 mb-4">Settings</h1>
      <div className="card p-6 text-center">
        <div className="text-3xl mb-2">⚙️</div>
        <p className="text-gray-600 text-sm">Category, Product, Staff management — coming in Phase 1.</p>
        <p className="text-xs text-gray-400 mt-3">Cafe: {CAFE.name}</p>
      </div>
    </div>
  )
}
