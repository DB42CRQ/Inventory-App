import { useState, useEffect } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { supabase } from '../../lib/supabase'
import { Button, Input } from '../ui'

export default function ResetPasswordPage({ onDone }) {
  const { t } = useTranslation()
  const [password,  setPassword]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)
  const [validLink, setValidLink] = useState(false)

  useEffect(() => {
    // Supabase setzt die Session automatisch aus dem URL-Hash
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setValidLink(true)
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            {t.resetSuccessTitle ?? 'Passwort geändert!'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {t.resetSuccessText ?? 'Dein Passwort wurde erfolgreich zurückgesetzt.'}
          </p>
          <Button className="w-full" onClick={onDone}>
            {t.toLogin}
          </Button>
        </div>
      </div>
    )
  }

  if (!validLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⏳</span>
          </div>
          <p className="text-sm text-gray-500">{t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🔑</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {t.resetTitle ?? 'Neues Passwort'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t.resetHint ?? 'Gib dein neues Passwort ein.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label={t.password} type="password" placeholder={t.passwordPlaceholder}
            value={password} onChange={e => setPassword(e.target.value)}
            minLength={6} required autoFocus />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" disabled={loading || password.length < 6}>
            {loading ? t.loading : t.resetSave ?? 'Passwort speichern'}
          </Button>
        </form>
      </div>
    </div>
  )
}
