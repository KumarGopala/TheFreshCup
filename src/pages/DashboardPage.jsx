import { Link } from 'react-router-dom'

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-4">
      <Link to="/" className="text-sm text-brand-700">← Back to billing</Link>
      <h1 className="text-2xl font-bold text-brand-800 mt-2 mb-4">Dashboard</h1>
      <div className="card p-6 text-center">
        <div className="text-3xl mb-2">📊</div>
        <p className="text-gray-600 text-sm">Day / week / month sales charts — coming in Phase 5.</p>
      </div>
    </div>
  )
}
