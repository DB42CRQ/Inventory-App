import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useHousehold } from '../../hooks/useHousehold'
import { useTranslation } from '../../i18n/useTranslation'
import { supabase } from '../../lib/supabase'

export function FeedbackButton() {
  const { user } = useAuth()
  const { household } = useHousehold()
  const { t } = useTranslation()

  const [open,    setOpen]    = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true); setError('')
    const { error } = await supabase.from('feedback').insert({
      profile_id:   user?.id ?? null,
      household_id: household?.id ?? null,
      message:      message.trim(),
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      setOpen(false)
      setSuccess(false)
      setMessage('')
    }, 2000)
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 bg-white border border-gray-200
          rounded-2xl shadow-md flex items-center justify-center text-xl
          hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
        title={t.feedbackTitle ?? 'Feedback'}
      >
        💡
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 text-lg">
                {t.feedbackTitle ?? 'Feedback'}
              </h2>
              <button onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {success ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <p className="font-medium text-gray-900">
                  {t.feedbackSuccess ?? 'Danke für dein Feedback!'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    {t.feedbackLabel ?? 'Dein Vorschlag oder Feedback'}
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={t.feedbackPlaceholder ?? 'Was könnte besser sein? Was vermisst du?'}
                    rows={4}
                    required
                    autoFocus
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900
                      placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="flex gap-2">
                  <button type="button" onClick={() => setOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                      font-medium text-gray-700 hover:bg-gray-50 transition-all">
                    {t.cancel ?? 'Abbrechen'}
                  </button>
                  <button type="submit" disabled={loading || !message.trim()}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm
                      font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all">
                    {loading
                      ? (t.saving ?? 'Speichert…')
                      : (t.feedbackSend ?? 'Absenden')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
