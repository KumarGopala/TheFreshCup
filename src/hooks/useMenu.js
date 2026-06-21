import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'
import { getCache, setCache } from '../lib/db.js'

const CACHE_KEY = 'menu'

const EMPTY = { staff: [], categories: [], products: [], settings: [] }

let state = { loading: true, error: null, data: null, lastFetchedAt: null }
const listeners = new Set()

function notify() {
  listeners.forEach(fn => fn(state))
}

function setState(patch) {
  state = { ...state, ...patch }
  notify()
}

export async function loadMenu({ force = false } = {}) {
  // Try cache first (instant render)
  if (!state.data) {
    try {
      const cached = await getCache(CACHE_KEY)
      if (cached) setState({ loading: false, data: cached })
    } catch {}
  }
  // Then fetch fresh from API
  try {
    const data = await api.getAll()
    const normalized = { ...EMPTY, ...data }
    await setCache(CACHE_KEY, normalized)
    setState({ loading: false, error: null, data: normalized, lastFetchedAt: Date.now() })
  } catch (err) {
    setState({ loading: false, error: err.message })
  }
}

// Used by manager components after a CRUD action
export async function refreshMenu() {
  return loadMenu({ force: true })
}

export function useMenu() {
  const [s, setS] = useState(state)
  useEffect(() => {
    listeners.add(setS)
    return () => listeners.delete(setS)
  }, [])
  return s
}
