import { api, ApiError } from './api.js'
import { queueBill } from './db.js'

export function buildBill({ items, paymentMode, staffId }) {
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0)
  const billId = 'b-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
  return {
    bill: {
      bill_id: billId,
      datetime: new Date().toISOString(),
      staff_id: staffId,
      subtotal,
      payment_mode: paymentMode
    },
    items: items.map(it => ({
      product_id: it.product_id,
      product_name: it.name,
      qty: it.qty,
      unit_price: it.price,
      line_total: it.price * it.qty
    }))
  }
}

/**
 * Save a bill — tries API first, falls back to local IndexedDB queue if offline.
 * Always returns { ok: true, mode: 'online' | 'queued', bill, items }.
 * Throws only for unexpected errors (server-side data issues).
 */
export async function saveBill({ bill, items }) {
  try {
    await api.saveBill(bill, items)
    return { ok: true, mode: 'online', bill, items }
  } catch (err) {
    const isNetwork =
      err instanceof ApiError && (err.code === 'NETWORK' || err.code === 'HTTP')
    if (isNetwork || !navigator.onLine) {
      await queueBill({ ...bill, items, queued_at: Date.now() })
      return { ok: true, mode: 'queued', bill, items }
    }
    throw err
  }
}

export function formatINR(n) {
  return '₹' + (Number(n) || 0).toLocaleString('en-IN')
}

export function formatDateTime(iso) {
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
