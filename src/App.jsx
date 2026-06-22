import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import LoginPage from './pages/LoginPage.jsx'
import BillingPage from './pages/BillingPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import ReceiptPage from './pages/ReceiptPage.jsx'
import Toast from './components/Toast.jsx'
import InstallPrompt from './components/InstallPrompt.jsx'
import { getCurrentUser } from './lib/auth.js'
import { loadMenu } from './hooks/useMenu.js'
import { setupAutoSync } from './lib/sync.js'

// Lazy-load the Dashboard (pulls in Recharts) so cashiers don't pay the bundle cost
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))

function DashboardFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Loading dashboard…
    </div>
  )
}

function RequireAuth({ children, adminOnly = false }) {
  const user = getCurrentUser()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  const [, forceRender] = useState(0)

  useEffect(() => {
    loadMenu()
    setupAutoSync()
    const refresh = () => forceRender(n => n + 1)
    const onOnline = () => loadMenu()
    window.addEventListener('storage', refresh)
    window.addEventListener('auth-change', refresh)
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('auth-change', refresh)
      window.removeEventListener('online', onOnline)
    }
  }, [])

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth><BillingPage /></RequireAuth>} />
        <Route path="/receipt" element={<RequireAuth><ReceiptPage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth adminOnly><SettingsPage /></RequireAuth>} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth adminOnly>
              <Suspense fallback={<DashboardFallback />}>
                <DashboardPage />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
      <InstallPrompt />
    </>
  )
}
