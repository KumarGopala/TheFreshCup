import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { CAFE } from '../config.js'
import { formatDateTime } from '../lib/bills.js'
import { renderReceiptImage, shortId, prettyPayment } from '../lib/receipt.js'
import { useMenu } from '../hooks/useMenu.js'
import { toast } from '../components/Toast.jsx'

export default function ReceiptPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { data } = useMenu()
  const state = location.state

  if (!state || !state.bill) return <Navigate to="/" replace />

  const { bill, items, staffName, queued } = state
  const settings = arrayToObject(data?.settings)
  const cafeName = settings.cafe_name || CAFE.name
  const footer = settings.receipt_footer || CAFE.receiptFooter

  const [busy, setBusy] = useState(false)

  async function share() {
    setBusy(true)
    try {
      const blob = await renderReceiptImage({ bill, items, staffName, cafeName, footer })
      if (!blob) throw new Error('Could not generate image')
      const file = new File([blob], `bill-${shortId(bill.bill_id)}.png`, { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `${cafeName} Bill` })
      } else {
        // Fallback: open WhatsApp with a text receipt
        const text = textReceipt({ bill, items, staffName, cafeName, footer })
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        toast(err.message || 'Share failed', 'error')
      }
    } finally {
      setBusy(false)
    }
  }

  function print() {
    window.print()
  }

  function done() {
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar — hidden in print */}
      <header className="no-print bg-brand-600 text-white px-3 py-3 flex items-center justify-between shadow sticky top-0 z-10">
        <button onClick={done} className="text-2xl px-2 py-1">←</button>
        <h1 className="font-bold text-base">Bill Saved</h1>
        <div className="w-8" />
      </header>

      <div className="px-3 py-4">
        {queued && (
          <div className="no-print mb-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-3 py-2 text-center">
            Saved offline — will sync when online
          </div>
        )}

        <div id="receipt-print" className="bg-white rounded-2xl shadow-md mx-auto max-w-md overflow-hidden">
          <div className="bg-brand-600 text-white text-center py-5 px-4">
            <div className="text-2xl font-bold">{cafeName}</div>
            <div className="text-xs opacity-90 mt-1">Bill Receipt</div>
          </div>

          <div className="px-5 py-4 text-sm">
            <div className="flex justify-between">
              <div className="text-gray-500">Bill</div>
              <div className="font-mono font-semibold">{shortId(bill.bill_id)}</div>
            </div>
            <div className="flex justify-between mt-1">
              <div className="text-gray-500">Date</div>
              <div>{formatDateTime(bill.datetime)}</div>
            </div>
            <div className="flex justify-between mt-1">
              <div className="text-gray-500">Cashier</div>
              <div>{staffName || bill.staff_id}</div>
            </div>
            <div className="flex justify-between mt-1">
              <div className="text-gray-500">Payment</div>
              <div className="font-semibold">{prettyPayment(bill.payment_mode)}</div>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 mx-5" />

          <div className="px-5 py-3">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-xs uppercase font-semibold text-gray-500 mb-2">
              <div>Item</div>
              <div className="text-center">Qty</div>
              <div className="text-right w-16">Total</div>
            </div>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 text-sm py-1.5">
                <div className="min-w-0">
                  <div className="truncate font-medium">{it.product_name}</div>
                  <div className="text-xs text-gray-400">₹{it.unit_price} each</div>
                </div>
                <div className="text-center">{it.qty}</div>
                <div className="text-right w-16 font-semibold">₹{it.line_total}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300 mx-5" />

          <div className="px-5 py-4 flex justify-between items-center">
            <div className="text-base font-semibold">Total</div>
            <div className="text-2xl font-bold text-brand-700">₹{bill.subtotal}</div>
          </div>

          {footer && (
            <div className="px-5 pb-5 text-center text-xs text-gray-500 whitespace-pre-line">
              {footer}
            </div>
          )}
        </div>

        {/* Action buttons — hidden in print */}
        <div className="no-print mt-5 max-w-md mx-auto space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={share} disabled={busy} className="btn-secondary disabled:opacity-60">
              {busy ? '…' : '📲 Share'}
            </button>
            <button onClick={print} className="btn-secondary">🖨️ Print</button>
          </div>
          <button onClick={done} className="btn-primary w-full">Done — Next Customer</button>
        </div>
      </div>
    </div>
  )
}

function arrayToObject(settings) {
  if (!settings) return {}
  if (Array.isArray(settings)) {
    return Object.fromEntries(settings.map(r => [r.key, r.value]))
  }
  return settings
}

function textReceipt({ bill, items, staffName, cafeName, footer }) {
  const lines = []
  lines.push(`*${cafeName}*`)
  lines.push(`Bill ${shortId(bill.bill_id)}`)
  lines.push(formatDateTime(bill.datetime))
  lines.push(`Cashier: ${staffName || bill.staff_id}`)
  lines.push('--------------------')
  items.forEach(it => {
    lines.push(`${it.product_name} × ${it.qty}  ₹${it.line_total}`)
  })
  lines.push('--------------------')
  lines.push(`*Total: ₹${bill.subtotal}*  (${prettyPayment(bill.payment_mode)})`)
  if (footer) {
    lines.push('')
    lines.push(footer)
  }
  return lines.join('\n')
}
