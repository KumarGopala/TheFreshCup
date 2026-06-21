import { useEffect, useState } from 'react'

let pushFn = null

export function toast(msg, type = 'info') {
  if (pushFn) pushFn({ msg, type, id: Date.now() + Math.random() })
  else console.log('[toast pre-mount]', type, msg)
}

export default function Toast() {
  const [items, setItems] = useState([])

  useEffect(() => {
    pushFn = (t) => {
      setItems(prev => [...prev, t])
      setTimeout(() => setItems(prev => prev.filter(x => x.id !== t.id)), 3500)
    }
    return () => { pushFn = null }
  }, [])

  if (!items.length) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none">
      {items.map(t => {
        const color = t.type === 'error'   ? 'bg-red-600'
                    : t.type === 'success' ? 'bg-green-600'
                    :                        'bg-gray-800'
        return (
          <div key={t.id} className={`${color} text-white px-4 py-2.5 rounded-xl shadow-lg text-sm max-w-[90vw] text-center`}>
            {t.msg}
          </div>
        )
      })}
    </div>
  )
}
