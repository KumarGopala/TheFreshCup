import { useEffect, useState } from 'react'

const DISMISSED_KEY = 'fresh-cup:install-dismissed'

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [iosHint, setIosHint] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return
    if (isStandalone()) return

    // Android / Chrome path
    const onBIP = (e) => {
      e.preventDefault()
      setDeferred(e)
      setOpen(true)
    }
    window.addEventListener('beforeinstallprompt', onBIP)

    // iOS Safari path (no beforeinstallprompt — show manual hint)
    if (isIOS() && !isStandalone()) {
      const t = setTimeout(() => setIosHint(true), 3000)
      return () => {
        clearTimeout(t)
        window.removeEventListener('beforeinstallprompt', onBIP)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', onBIP)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setOpen(false)
    setIosHint(false)
    setDeferred(null)
  }

  async function install() {
    if (!deferred) return
    deferred.prompt()
    await deferred.userChoice
    dismiss()
  }

  if (!open && !iosHint) return null

  return (
    <div className="fixed inset-x-3 bottom-3 z-[55] bg-white border border-gray-200 rounded-2xl shadow-xl p-4 flex items-start gap-3 max-w-md mx-auto" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
      <div className="w-10 h-10 rounded-xl bg-brand-100 text-2xl flex items-center justify-center shrink-0">☕</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">Install Fresh Cup</div>
        {deferred ? (
          <p className="text-xs text-gray-500 mt-0.5">Add to your home screen for faster access and a fullscreen experience.</p>
        ) : (
          <p className="text-xs text-gray-500 mt-0.5">
            Tap the <span className="inline-block w-4 h-4 align-middle">⬆️</span> Share icon, then <b>Add to Home Screen</b>.
          </p>
        )}
        <div className="flex gap-2 mt-3">
          {deferred && (
            <button onClick={install} className="bg-brand-600 active:bg-brand-700 text-white font-semibold text-sm px-4 py-2 rounded-lg">Install</button>
          )}
          <button onClick={dismiss} className="text-gray-500 active:bg-gray-100 text-sm px-3 py-2 rounded-lg">
            {deferred ? 'Not now' : 'Got it'}
          </button>
        </div>
      </div>
      <button onClick={dismiss} className="text-gray-300 text-2xl leading-none -mt-1 -mr-1 w-8 h-8 flex items-center justify-center">×</button>
    </div>
  )
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}
