import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[92vh] overflow-y-auto animate-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-brand-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 text-3xl leading-none w-8 h-8 flex items-center justify-center">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
