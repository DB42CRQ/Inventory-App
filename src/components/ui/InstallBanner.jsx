import { useEffect, useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'

export function InstallSection() {
  const { t } = useTranslation()
  const [prompt,    setPrompt]    = useState(null)
  const [isIOS,     setIsIOS]     = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
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
    if (prompt) {
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') setInstalled(true)
    }
  }

  if (installed) return null

  const steps = isIOS
    ? [t.installStep1iOS, t.installStep2iOS, t.installStep3iOS]
    : [t.installStep1, t.installStep2, t.installStep3]

  return (
    <div className="bg-primary-50 border border-primary-100 rounded-xl p-3">
      <p className="text-sm font-medium text-primary-800 mb-2">
        {t.installTitle}
      </p>

      {prompt ? (
        // Android — nativer Install-Prompt
        <div className="flex items-center justify-between">
          <p className="text-xs text-primary-600">{t.installHint}</p>
          <button onClick={install}
            className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium
              rounded-lg hover:bg-primary-600 transition-all shrink-0 ml-2">
            {t.installBtn}
          </button>
        </div>
      ) : (
        // iOS oder Android ohne Prompt — Schritt-für-Schritt
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-primary-600 mb-1">{t.installIOS}</p>
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-primary-700">
              <span className="w-5 h-5 bg-primary-200 rounded-full flex items-center justify-center
                font-bold shrink-0 text-primary-800">
                {i + 1}
              </span>
              <span dangerouslySetInnerHTML={{ __html: step.replace(/"([^"]+)"/g, '<strong>"$1"</strong>') }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
