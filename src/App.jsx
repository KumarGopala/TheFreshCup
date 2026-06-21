import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LoginPage from './pages/LoginPage.jsx'
import BillingPage from './pages/BillingPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import { getCurrentUser } from './lib/auth.js'

function RequireAuth({ children, adminOnly = false }) {
  const user = getCurrentUser()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  const [, forceRender] = useState(0)

  useEffect(() => {
    const onStorage = () => forceRender(n => n + 1)
    window.addEventListener('storage', onStorage)
    window.addEventListener('auth-change', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('auth-change', onStorage)
    }
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RequireAuth><BillingPage /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth adminOnly><SettingsPage /></RequireAuth>} />
      <Route path="/dashboard" element={<RequireAuth adminOnly><DashboardPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
