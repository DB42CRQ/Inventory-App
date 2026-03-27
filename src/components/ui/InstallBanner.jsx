import { useEffect, useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'

const STORAGE_KEY = 'install_banner_dismissed'

export function InstallBanner() {
  const { t } = useTranslation()
  const [prompt,    setPrompt]    = useState(null)
  const [visible,   setVisible]   = useState(false)
  const [isIOS,     setIsIOS]     = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Schon installiert oder weggeklickt?
    if (localStorage.getItem(STORAGE_KEY)) return

    // Schon als PWA geöffnet?
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // iOS erkennen
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)

    if (ios) {
      // iOS zeigt Banner ohne Install-Prompt
      setVisible(true)
      return
    }

    // Android/Chrome: auf beforeinstallprompt warten
    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  async function install() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    dismiss()
  }

  if (!visible || installed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6">
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-xl p-4
        flex items-start gap-3 animate-slide-up">

        {/* Icon */}
        <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-xl">📦</span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">
            {t.installTitle ?? 'App installieren'}
          </p>
          {isIOS ? (
            <p className="text-xs text-gray-500 mt-0.5">
              {t.installIOS ?? 'Tippe auf Teilen'} <span className="inline-block">⎋</span> {t.installIOSHint ?? 'und dann "Zum Home-Bildschirm"'}
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-0.5">
              {t.installHint ?? 'Zum Home-Bildschirm hinzufügen für schnellen Zugriff'}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {!isIOS && (
            <button onClick={install}
              className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium
                rounded-lg hover:bg-primary-600 transition-all">
              {t.installBtn ?? 'Installieren'}
            </button>
          )}
          <button onClick={dismiss}
            className="w-7 h-7 flex items-center justify-center text-gray-400
              hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
