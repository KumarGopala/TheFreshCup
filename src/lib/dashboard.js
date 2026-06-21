/**
 * Pure aggregation helpers. Given { bills, items } and a bucketing mode,
 * return summary numbers + chart series + sorted lists.
 */

export function aggregate({ bills = [], items = [] }, { bucket = 'day' } = {}) {
  const safeBills = bills.filter(b => b && b.bill_id)
  const safeItems = items.filter(it => it && it.bill_id)

  const totalSales = sum(safeBills.map(b => Number(b.subtotal) || 0))
  const count = safeBills.length
  const avg = count ? Math.round(totalSales / count) : 0

  const cashSales = sum(
    safeBills.filter(b => norm(b.payment_mode) === 'cash').map(b => Number(b.subtotal) || 0)
  )
  const upiSales = sum(
    safeBills.filter(b => norm(b.payment_mode) === 'upi').map(b => Number(b.subtotal) || 0)
  )
  const cashCount = safeBills.filter(b => norm(b.payment_mode) === 'cash').length
  const upiCount  = safeBills.filter(b => norm(b.payment_mode) === 'upi').length

  // Time-bucket series
  const series = buildSeries(safeBills, bucket)

  // Top products
  const productMap = new Map()
  safeItems.forEach(it => {
    const id = it.product_id || it.product_name
    if (!productMap.has(id)) {
      productMap.set(id, { id, name: it.product_name, qty: 0, sales: 0 })
    }
    const e = productMap.get(id)
    e.qty   += Number(it.qty) || 0
    e.sales += Number(it.line_total) || 0
  })
  const topProducts = [...productMap.values()].sort((a, b) => b.sales - a.sales)

  // By staff
  const staffMap = new Map()
  safeBills.forEach(b => {
    const id = b.staff_id || 'unknown'
    if (!staffMap.has(id)) staffMap.set(id, { id, sales: 0, count: 0 })
    const e = staffMap.get(id)
    e.sales += Number(b.subtotal) || 0
    e.count += 1
  })
  const byStaff = [...staffMap.values()].sort((a, b) => b.sales - a.sales)

  return {
    totalSales, count, avg,
    cashSales, upiSales, cashCount, upiCount,
    series,
    topProducts,
    byStaff
  }
}

function buildSeries(bills, bucket) {
  // bucket: 'hour' | 'day'
  const map = new Map()
  for (const b of bills) {
    const d = new Date(b.datetime)
    if (isNaN(d)) continue
    const key = bucket === 'hour' ? hourKey(d) : dayKey(d)
    if (!map.has(key)) map.set(key, { key, sales: 0, count: 0, sortAt: d.getTime() })
    const e = map.get(key)
    e.sales += Number(b.subtotal) || 0
    e.count += 1
    if (d.getTime() < e.sortAt) e.sortAt = d.getTime()
  }
  return [...map.values()].sort((a, b) => a.sortAt - b.sortAt).map(e => ({
    key:   e.key,
    label: bucket === 'hour' ? hourLabel(e.key) : dayLabel(e.key),
    sales: e.sales,
    count: e.count
  }))
}

function sum(arr) { return arr.reduce((a, b) => a + b, 0) }
function norm(s) { return String(s || '').toLowerCase() }

function dayKey(d) {
  // YYYY-MM-DD in local time
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function dayLabel(key) {
  const [, m, d] = key.split('-')
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(m) - 1]
  return `${d} ${month}`
}
function hourKey(d) {
  return String(d.getHours()).padStart(2, '0') + ':00'
}
function hourLabel(key) {
  const h = Number(key.slice(0, 2))
  if (h === 0) return '12am'
  if (h < 12)  return h + 'am'
  if (h === 12) return '12pm'
  return (h - 12) + 'pm'
}

// --- Range presets ---
export function rangeToday() {
  const now = new Date()
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  return { from: start.toISOString(), to: now.toISOString(), bucket: 'hour', label: 'Today' }
}

export function rangeLastNDays(n) {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - (n - 1))
  start.setHours(0, 0, 0, 0)
  return { from: start.toISOString(), to: now.toISOString(), bucket: 'day' }
}

export function rangeWeek()  { return { ...rangeLastNDays(7),  label: 'Last 7 days'  } }
export function rangeMonth() { return { ...rangeLastNDays(30), label: 'Last 30 days' } }

export function rangeCustom(fromYMD, toYMD) {
  // YYYY-MM-DD inclusive both ends in local time
  const f = new Date(fromYMD + 'T00:00:00')
  const t = new Date(toYMD   + 'T23:59:59')
  return { from: f.toISOString(), to: t.toISOString(), bucket: 'day', label: `${fromYMD} → ${toYMD}` }
}

export function formatCompactINR(n) {
  const x = Number(n) || 0
  if (Math.abs(x) >= 1_00_000) return '₹' + (x / 1_00_000).toFixed(1) + 'L'
  if (Math.abs(x) >= 1_000)    return '₹' + (x / 1_000).toFixed(1) + 'K'
  return '₹' + x.toLocaleString('en-IN')
}
