const KEY = 'fresh-cup:auth'

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Authenticate against the live Staff list from useMenu's cache.
// Caller passes the staff array (so we don't import the hook here and create cycles).
export function authenticate(staffList, staffId, pin) {
  const staff = (staffList || []).find(s => s.id === staffId && s.active)
  if (!staff) return { ok: false, error: 'Staff not found' }
  if (String(staff.pin) !== String(pin)) return { ok: false, error: 'Wrong PIN' }
  const user = { id: staff.id, name: staff.name, role: staff.role }
  localStorage.setItem(KEY, JSON.stringify(user))
  window.dispatchEvent(new Event('auth-change'))
  return { ok: true, user }
}

export function logout() {
  localStorage.removeItem(KEY)
  window.dispatchEvent(new Event('auth-change'))
}
