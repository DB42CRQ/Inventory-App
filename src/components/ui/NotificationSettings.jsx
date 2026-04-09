import { useState, useEffect } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useHousehold } from '../../hooks/useHousehold'

export default function NotificationSettings({ onClose, pushSupported, pushSubscribed, subscribe, unsubscribe, sendPush }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { household } = useHousehold()
  const [prefs, setPrefs] = useState({ low_stock: true, shopping_list: true, new_version: true })
  const [saving, setSaving] = useState(false)
  const [testSent, setTestSent] = useState(false)

  useEffect(() => {
    if (!user || !household || !pushSubscribed) return
    loadPrefs()
  }, [user?.id, household?.id, pushSubscribed])

  async function loadPrefs() {
    const { data } = await supabase
      .from('push_subscriptions')
      .select('preferences')
      .eq('profile_id', user.id)
      .eq('household_id', household.id)
      .single()
    if (data?.preferences) setPrefs(data.preferences)
  }

  async function toggle(key) {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    setSaving(true)
    await supabase
      .from('push_subscriptions')
      .update({ preferences: next })
      .eq('profile_id', user.id)
      .eq('household_id', household.id)
    setSaving(false)
    // Auch localStorage updaten für lokale Checks
    localStorage.setItem('notif_prefs', JSON.stringify(next))
  }

  async function handleTest() {
    await sendPush({ title: '🔔 Test', body: t.notifTestBody ?? 'Push-Benachrichtigungen funktionieren!', excludeSelf: false })
    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
  }

  const CATEGORIES = [
    {
      key: 'low_stock',
      icon: '⚠️',
      title: t.notifLowStock ?? 'Niedriger Bestand',
      desc:  t.notifLowStockDesc ?? 'Wenn ein Artikel unter die Mindestmenge fällt',
    },
    {
      key: 'shopping_list',
      icon: '🛒',
      title: t.notifShoppingList ?? 'Einkaufsliste',
      desc:  t.notifShoppingListDesc ?? 'Wenn ein Haushaltsmitglied die Einkaufsliste ändert',
    },
    {
      key: 'new_version',
      icon: '🚀',
      title: t.notifNewVersion ?? 'Neue Version',
      desc:  t.notifNewVersionDesc ?? 'Wenn ein neues Update veröffentlicht wird',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all
            flex items-center justify-center text-gray-600 text-lg">←</button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">
          🔔 {t.notifTitle ?? 'Benachrichtigungen'}
        </h1>
        {saving && <span className="text-xs text-gray-400">{t.saving ?? 'Speichert…'}</span>}
      </header>

      <main className="flex-1 overflow-y-auto max-w-2xl w-full mx-auto px-4 py-4 flex flex-col gap-4">

        {/* Push aktivieren/deaktivieren */}
        <div className={`rounded-2xl border p-4 flex items-center justify-between
          ${pushSubscribed ? 'bg-primary-50 border-primary-100' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {pushSubscribed ? (t.notifEnabled ?? 'Aktiviert') : (t.notifDisabled ?? 'Deaktiviert')}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {pushSubscribed
                  ? (t.notifEnabledDesc ?? 'Du erhältst Benachrichtigungen auf diesem Gerät')
                  : (t.notifDisabledDesc ?? 'Aktiviere Benachrichtigungen um informiert zu bleiben')}
              </p>
            </div>
          </div>
          {pushSupported && (
            <button onClick={() => pushSubscribed ? unsubscribe() : subscribe()}
              className={`w-12 h-6 rounded-full transition-all relative shrink-0
                ${pushSubscribed ? 'bg-primary-500' : 'bg-gray-200'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all
                ${pushSubscribed ? 'left-6' : 'left-0.5'}`} />
            </button>
          )}
        </div>

        {/* Kategorien */}
        {pushSubscribed && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-4 pb-2">
              {t.notifCategories ?? 'Benachrichtigungen für'}
            </p>
            {CATEGORIES.map((cat, i) => (
              <div key={cat.key}
                className={`flex items-center gap-3 px-4 py-3
                  ${i < CATEGORIES.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <span className="text-xl shrink-0">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{cat.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{cat.desc}</p>
                </div>
                <button onClick={() => toggle(cat.key)}
                  className={`w-11 h-6 rounded-full transition-all relative shrink-0
                    ${prefs[cat.key] ? 'bg-primary-500' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all
                    ${prefs[cat.key] ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Test-Button */}
        {pushSubscribed && (
          <button onClick={handleTest}
            className="w-full py-3 rounded-2xl border border-gray-200 bg-white text-sm
              font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center
              justify-center gap-2">
            {testSent ? (
              <><span>✅</span> {t.notifTestSent ?? 'Gesendet!'}</>
            ) : (
              <><span>🔔</span> {t.notifTest ?? 'Test-Benachrichtigung senden'}</>
            )}
          </button>
        )}

        {!pushSupported && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
            {t.notifNotSupported ?? 'Dein Browser unterstützt keine Push-Benachrichtigungen.'}
          </div>
        )}
      </main>
    </div>
  )
}
