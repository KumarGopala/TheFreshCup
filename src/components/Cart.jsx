import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart, setQty, removeItem, clearCart, setPaymentMode, cartSubtotal, cartCount } from '../hooks/useCart.js'
import { buildBill, saveBill } from '../lib/bills.js'
import { getCurrentUser } from '../lib/auth.js'
import { toast } from './Toast.jsx'

export default function Cart() {
  const navigate = useNavigate()
  const { items, paymentMode } = useCart()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const count = cartCount(items)
  const total = cartSubtotal(items)
  if (count === 0) return null

  async function confirmBill() {
    const user = getCurrentUser()
    if (!user) return toast('Please log in again', 'error')
    setBusy(true)
    try {
      const { bill, items: billItems } = buildBill({
        items,
        paymentMode,
        staffId: user.id
      })
      const result = await saveBill({ bill, items: billItems })
      if (result.mode === 'queued') {
        toast('Saved offline — will sync when online', 'info')
      } else {
        toast('Bill saved', 'success')
      }
      clearCart()
      setOpen(false)
      navigate('/receipt', {
        state: { bill, items: billItems, staffName: user.name, queued: result.mode === 'queued' },
        replace: true
      })
    } catch (err) {
      toast(err.message || 'Failed to save', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-0 inset-x-0 z-30 bg-brand-600 text-white px-4 py-3 flex items-center justify-between shadow-lg active:bg-brand-700"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">{count}</div>
          <div className="text-left">
            <div className="text-xs opacity-90">{count} item{count > 1 ? 's' : ''} in bill</div>
            <div className="font-bold text-base">₹{total}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold">View Bill</span>
          <span className="text-xl">→</span>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/50" onClick={() => !busy && setOpen(false)}>
          <div
            className="bg-white w-full rounded-t-3xl max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <header className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-800">Your Bill</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 text-3xl leading-none w-8 h-8 flex items-center justify-center">×</button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-3 divide-y divide-gray-100">
              {items.map(it => (
                <div key={it.product_id} className="py-3 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {it.image_url
                      ? <img src={it.image_url} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm leading-tight truncate">{it.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">₹{it.price} each</div>
                    <div className="text-sm font-semibold text-brand-700 mt-0.5">₹{it.price * it.qty}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQty(it.product_id, it.qty - 1)}
                      className="w-9 h-9 rounded-full bg-gray-100 active:bg-gray-200 text-xl font-bold text-gray-700 flex items-center justify-center"
                    >−</button>
                    <span className="w-6 text-center font-bold text-gray-900">{it.qty}</span>
                    <button
                      onClick={() => setQty(it.product_id, it.qty + 1)}
                      className="w-9 h-9 rounded-full bg-brand-600 text-white active:bg-brand-700 text-xl font-bold flex items-center justify-center"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t px-5 py-4 space-y-4" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment</div>
                <div className="grid grid-cols-2 gap-2">
                  <PaymentButton mode="cash" active={paymentMode === 'cash'} />
                  <PaymentButton mode="upi" active={paymentMode === 'upi'} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-3xl font-bold text-brand-700">₹{total}</div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { if (window.confirm('Clear all items?')) { clearCart(); setOpen(false) } }}
                  className="btn-secondary px-4"
                  disabled={busy}
                >Clear</button>
                <button onClick={confirmBill} disabled={busy} className="btn-primary flex-1 disabled:opacity-60">
                  {busy ? 'Saving…' : 'Confirm Bill'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function PaymentButton({ mode, active }) {
  const label = mode === 'cash' ? 'Cash' : 'UPI'
  const icon  = mode === 'cash' ? '💵'   : '📱'
  return (
    <button
      onClick={() => setPaymentMode(mode)}
      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold transition ${
        active
          ? 'bg-brand-600 text-white border-brand-600'
          : 'bg-white text-gray-700 border-gray-200 active:bg-gray-50'
      }`}
    >
      <span className="text-xl">{icon}</span>{label}
    </button>
  )
}
