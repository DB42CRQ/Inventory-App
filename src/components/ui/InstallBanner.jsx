import { useEffect, useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'

export function useInstallPrompt() {
  const [prompt,    setPrompt]    = useState(null)
  const [isIOS,     setIsIOS]     = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Schon als PWA geöffnet?
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)

    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
  }

  return { prompt, isIOS, installed, install }
}

export function InstallSection() {
  const { t } = useTranslation()
  const { prompt, isIOS, installed, install } = useInstallPrompt()

  // Verstecken wenn bereits installiert
  if (installed) return null

  // Auf Desktop ohne Install-Prompt auch nichts zeigen
  if (!isIOS && !prompt) return null

  return (
    <div className="bg-primary-50 border border-primary-100 rounded-xl p-3">
      <p className="text-sm font-medium text-primary-800 mb-1">
        {t.installTitle ?? 'App installieren'}
      </p>
      {isIOS ? (
        <p className="text-xs text-primary-600">
          {t.installIOS ?? 'Tippe auf Teilen'} ⎋ {t.installIOSHint ?? 'und dann "Zum Home-Bildschirm"'}
        </p>
      ) : (
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-primary-600">
            {t.installHint ?? 'Zum Home-Bildschirm hinzufügen'}
          </p>
          <button onClick={install}
            className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium
              rounded-lg hover:bg-primary-600 transition-all shrink-0 ml-2">
            {t.installBtn ?? 'Installieren'}
          </button>
        </div>
      )}
    </div>
  )
}
