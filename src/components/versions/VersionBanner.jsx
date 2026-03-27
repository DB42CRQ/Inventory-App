import { useEffect, useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'

export function VersionBanner({ version, onDismiss }) {
  const { t } = useTranslation()
  const [isIOS,      setIsIOS]      = useState(false)
  const [isAndroid,  setIsAndroid]  = useState(false)
  const [installed,  setInstalled]  = useState(false)
  const [prompt,     setPrompt]     = useState(null)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
    const android = /android/i.test(navigator.userAgent)
    setIsIOS(ios)
    setIsAndroid(android)

    const handler = (e) => { e.preventDefault(); setPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (prompt) {
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') setInstalled(true)
    }
  }

  if (!version) return null

  const showInstall = !installed && (isIOS || isAndroid)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-primary-500 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
              🚀
            </div>
            <div>
              <p className="text-white/80 text-xs font-medium">
                {t.versionBannerLabel ?? 'Neue Version verfügbar'}
              </p>
              <p className="text-white font-bold text-lg">v{version.version}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            {t.versionWhatsNew ?? 'Was ist neu?'}
          </p>
          <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
            {version.notes}
          </p>
          <p className="text-xs text-gray-400 mt-3">
            {new Date(version.created_at).toLocaleDateString('de-DE', {
              day: '2-digit', month: '2-digit', year: 'numeric'
            })}
          </p>
        </div>

        {/* Install-Hinweis */}
        {showInstall && (
          <div className="mx-5 mb-4 bg-primary-50 border border-primary-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-primary-800 mb-2">
              📲 {t.installTitle ?? 'App installieren'}
            </p>

            {isIOS ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-primary-600 mb-1">{t.installIOS}</p>
                {[t.installStep1iOS, t.installStep2iOS, t.installStep3iOS].map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-primary-700">
                    <span className="w-5 h-5 bg-primary-200 rounded-full flex items-center justify-center
                      font-bold shrink-0 text-primary-800">{i + 1}</span>
                    <span dangerouslySetInnerHTML={{ __html: step.replace(/"([^"]+)"/g, '<strong>"$1"</strong>') }} />
                  </div>
                ))}
              </div>
            ) : prompt ? (
              <div className="flex items-center justify-between">
                <p className="text-xs text-primary-600">{t.installHint}</p>
                <button onClick={handleInstall}
                  className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium
                    rounded-lg hover:bg-primary-600 transition-all shrink-0 ml-2">
                  {t.installBtn ?? 'Installieren'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {[t.installStep1, t.installStep2, t.installStep3].map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-primary-700">
                    <span className="w-5 h-5 bg-primary-200 rounded-full flex items-center justify-center
                      font-bold shrink-0 text-primary-800">{i + 1}</span>
                    <span dangerouslySetInnerHTML={{ __html: step.replace(/"([^"]+)"/g, '<strong>"$1"</strong>') }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Button */}
        <div className="px-5 pb-5">
          <button onClick={() => onDismiss(version.id)}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium
              rounded-xl transition-all text-sm">
            {t.versionGotIt ?? 'Verstanden!'}
          </button>
        </div>
      </div>
    </div>
  )
}
