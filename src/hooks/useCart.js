import { useState, useEffect } from 'react'

let state = {
  items: [],          // [{ product_id, name, price, image_url, qty }]
  paymentMode: 'cash' // 'cash' | 'upi'
}
const listeners = new Set()

if (typeof window !== 'undefined') {
  window.addEventListener('logout', () => {
    state = { items: [], paymentMode: 'cash' }
    listeners.forEach(fn => fn(state))
  })
}

function notify() { listeners.forEach(fn => fn(state)) }
function setState(updater) {
  state = typeof updater === 'function' ? updater(state) : { ...state, ...updater }
  notify()
}

export function addItem(product) {
  setState(s => {
    const i = s.items.findIndex(x => x.product_id === product.id)
    if (i >= 0) {
      const items = s.items.slice()
      items[i] = { ...items[i], qty: items[i].qty + 1 }
      return { ...s, items }
    }
    return {
      ...s,
      items: [
        ...s.items,
        {
          product_id: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          image_url: product.image_url || '',
          qty: 1
        }
      ]
    }
  })
}

export function setQty(productId, qty) {
  setState(s => {
    if (qty <= 0) return { ...s, items: s.items.filter(x => x.product_id !== productId) }
    return { ...s, items: s.items.map(x => x.product_id === productId ? { ...x, qty } : x) }
  })
}

export function removeItem(productId) {
  setQty(productId, 0)
}

export function clearCart() {
  setState({ items: [], paymentMode: 'cash' })
}

export function setPaymentMode(mode) {
  setState({ paymentMode: mode })
}

export function cartSubtotal(items = state.items) {
  return items.reduce((sum, it) => sum + it.price * it.qty, 0)
}

export function cartCount(items = state.items) {
  return items.reduce((sum, it) => sum + it.qty, 0)
}

export function useCart() {
  const [s, set] = useState(state)
  useEffect(() => {
    listeners.add(set)
    return () => listeners.delete(set)
  }, [])
  return s
}
