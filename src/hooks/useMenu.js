import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'
import { getCache, setCache } from '../lib/db.js'

const CACHE_KEY = 'menu'

const EMPTY = { staff: [], categories: [], products: [], settings: [] }

let state = { loading: true, error: null, data: null, lastFetchedAt: null }
const listeners = new Set()
const preloadedUrls = new Set()

function notify() {
  listeners.forEach(fn => fn(state))
}

function setState(patch) {
  state = { ...state, ...patch }
  notify()
}

/**
 * Kick off a fetch for every product image so the service worker
 * stores them in the `product-images` cache before the user goes offline.
 * Idempotent — already-preloaded URLs are skipped.
 */
function warmImageCache(products) {
  if (!Array.isArray(products) || typeof window === 'undefined') return
  if (!navigator.onLine) return
  const urls = products.map(p => p?.image_url).filter(Boolean)
  for (const url of urls) {
    if (preloadedUrls.has(url)) continue
    preloadedUrls.add(url)
    const img = new Image()
    img.decoding = 'async'
    img.loading  = 'eager'
    img.src = url
  }
}

export async function loadMenu({ force = false } = {}) {
  // Try cache first (instant render)
  if (!state.data) {
    try {
      const cached = await getCache(CACHE_KEY)
      if (cached) {
        setState({ loading: false, data: cached })
        warmImageCache(cached.products)
      }
    } catch {}
  }
  // Then fetch fresh from API
  try {
    const data = await api.getAll()
    const normalized = { ...EMPTY, ...data }
    await setCache(CACHE_KEY, normalized)
    setState({ loading: false, error: null, data: normalized, lastFetchedAt: Date.now() })
    warmImageCache(normalized.products)
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
