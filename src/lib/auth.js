const KEY = 'fresh-cup:auth'

// Phase 0 stub: hard-coded staff list. Phase 1 will swap to IndexedDB + Sheet sync.
export const SEED_STAFF = [
  { id: 'admin', name: 'Owner', pin: '1234', role: 'admin', active: true },
  { id: 'staff-1', name: 'Ramesh', pin: '1111', role: 'cashier', active: true },
  { id: 'staff-2', name: 'Suresh', pin: '2222', role: 'cashier', active: true }
]

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function login(staffId, pin) {
  const staff = SEED_STAFF.find(s => s.id === staffId && s.active)
  if (!staff) return { ok: false, error: 'Staff not found' }
  if (staff.pin !== pin) return { ok: false, error: 'Wrong PIN' }
  const user = { id: staff.id, name: staff.name, role: staff.role }
  localStorage.setItem(KEY, JSON.stringify(user))
  window.dispatchEvent(new Event('auth-change'))
  return { ok: true, user }
}

export function logout() {
  localStorage.removeItem(KEY)
  window.dispatchEvent(new Event('auth-change'))
}
