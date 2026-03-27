import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from '../../i18n/useTranslation'
import { Button, Input } from '../ui'

function translateError(msg, t) {
  if (!msg) return t.errUnknown
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) return t.errInvalidCredentials
  if (m.includes('email not confirmed')) return t.errEmailNotConfirmed
  if (m.includes('user already registered') || m.includes('already been registered')) return t.errAlreadyRegistered
  if (m.includes('password should be at least')) return t.errPasswordTooShort
  if (m.includes('rate limit') || m.includes('too many requests')) return t.errRateLimit
  if (m.includes('network') || m.includes('fetch')) return t.errNetwork
  return msg
}

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const { t, lang, setLang } = useTranslation()
  const [mode,    setMode]    = useState('login')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({ email: '', password: '', displayName: '' })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (mode === 'login') {
      const { error } = await signIn(form.email, form.password)
      if (error) setError(translateError(error.message, t))
    } else {
      const { error } = await signUp(form.email, form.password, form.displayName)
      if (error) setError(translateError(error.message, t))
      else setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✉️</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">{t.confirmEmailTitle}</h2>
          <p className="text-sm text-gray-500 mb-1">{t.confirmEmailText}</p>
          <p className="text-sm font-medium text-gray-800 mb-4">{form.email}</p>
          <p className="text-sm text-gray-500 mb-6">{t.confirmEmailText2}</p>
          <Button variant="secondary" className="w-full"
            onClick={() => { setSuccess(false); setMode('login') }}>
            {t.toLogin}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📦</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Inventory42</h1>
          <p className="text-sm text-gray-500 mt-1">{t.appTagline}</p>
        </div>

        {/* Sprache */}
        <div className="flex justify-center gap-2 mb-5">
          {['de', 'en', 'es'].map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all
                ${lang === l ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {l === 'de' ? '🇩🇪 DE' : l === 'en' ? '🇬🇧 EN' : '🇵🇪 ES'}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                ${mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {m === 'login' ? t.login : t.register}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <Input label={t.name} type="text" placeholder={t.namePlaceholder}
              value={form.displayName} onChange={set('displayName')} required />
          )}
          <Input label={t.email} type="email" placeholder={t.emailPlaceholder}
            value={form.email} onChange={set('email')} required />
          <Input label={t.password} type="password" placeholder={t.passwordPlaceholder}
            value={form.password} onChange={set('password')} minLength={6} required />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="mt-2" disabled={loading}>
            {loading ? t.loading : mode === 'login' ? t.login : t.createAccount}
          </Button>
        </form>
      </div>
    </div>
  )
}
