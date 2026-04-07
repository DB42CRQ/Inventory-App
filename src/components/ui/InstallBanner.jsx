import { useState, useEffect } from 'react'
import { useTranslation } from '../../i18n/useTranslation'

function detectBrowser() {
  const ua = navigator.userAgent || ''
  const isIOS = /iphone|ipad|ipod/i.test(ua)
  const isAndroid = /android/i.test(ua)
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua)
  const isChrome = /chrome|crios/i.test(ua)
  const isWhatsApp = /whatsapp/i.test(ua)
  const isInAppBrowser = isWhatsApp || /instagram|fbav|fb_iab|fban|line|twitter/i.test(ua)
  const isStandalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches

  return { isIOS, isAndroid, isSafari, isChrome, isWhatsApp, isInAppBrowser, isStandalone }
}

function Step({ number, text, icon }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center
        justify-center text-xs font-bold shrink-0 mt-0.5">
        {number}
      </span>
      <div className="flex-1">
        {icon && <span className="mr-1">{icon}</span>}
        <span className="text-sm text-gray-700">{text}</span>
      </div>
    </div>
  )
}

export function InstallSection() {
  const { t } = useTranslation()
  const [browser, setBrowser] = useState(null)

  useEffect(() => {
    setBrowser(detectBrowser())
  }, [])

  if (!browser) return null

  // Bereits installiert
  if (browser.isStandalone) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-semibold text-green-800 text-sm">{t.installAlreadyInstalled}</p>
          <p className="text-xs text-green-600 mt-0.5">{t.installAlreadyInstalledHint}</p>
        </div>
      </div>
    )
  }

  // iOS + In-App Browser (WhatsApp etc.)
  if (browser.isIOS && browser.isInAppBrowser) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <p className="font-semibold text-amber-800 text-sm">{t.installSafariRequired}</p>
        </div>
        <p className="text-xs text-amber-700">{t.installWhatsappHint}</p>
        <div className="flex flex-col gap-2 bg-white rounded-xl p-3">
          <Step number="1" text={t.installWhatsappStep1} icon="···" />
          <Step number="2" text={t.installWhatsappStep2} icon="🧭" />
          <Step number="3" text={t.installWhatsappStep3} icon="👆" />
        </div>
        <a href="https://inventory42.com" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500
            text-white text-sm font-medium hover:bg-primary-600 transition-all">
          🧭 {t.installOpenSafari}
        </a>
      </div>
    )
  }

  // iOS + Safari → PWA installierbar
  if (browser.isIOS && browser.isSafari) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📱</span>
          <p className="font-semibold text-gray-800 text-sm">{t.installIosTitle}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Step number="1" text={t.installIosStep1} icon="⬆️" />
          <Step number="2" text={t.installIosStep2} icon="➕" />
          <Step number="3" text={t.installIosStep3} icon="✅" />
        </div>
        <p className="text-xs text-gray-500 text-center">{t.installDone}</p>
      </div>
    )
  }

  // iOS + kein Safari
  if (browser.isIOS && !browser.isSafari) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <p className="font-semibold text-amber-800 text-sm">{t.installSafariRequired}</p>
        </div>
        <p className="text-xs text-amber-700">{t.installWhatsappHint}</p>
        <a href="https://inventory42.com" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500
            text-white text-sm font-medium hover:bg-primary-600 transition-all">
          🧭 {t.installOpenSafari}
        </a>
      </div>
    )
  }

  // Android + Chrome
  if (browser.isAndroid && browser.isChrome) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📱</span>
          <p className="font-semibold text-gray-800 text-sm">{t.installAndroidTitle}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Step number="1" text={t.installAndroidStep1} icon="⋮" />
          <Step number="2" text={t.installAndroidStep2} icon="➕" />
          <Step number="3" text={t.installAndroidStep3} icon="✅" />
        </div>
        <p className="text-xs text-gray-500 text-center">{t.installDone}</p>
      </div>
    )
  }

  // Desktop oder unbekannt
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">📱</span>
        <p className="font-semibold text-gray-800 text-sm">{t.installTitle}</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs text-gray-600 font-medium">iPhone:</p>
        <Step number="1" text={t.installIosStep1} icon="⬆️" />
        <Step number="2" text={t.installIosStep2} icon="➕" />
        <p className="text-xs text-gray-600 font-medium mt-1">Android:</p>
        <Step number="1" text={t.installAndroidStep1} icon="⋮" />
        <Step number="2" text={t.installAndroidStep2} icon="➕" />
      </div>
    </div>
  )
}
