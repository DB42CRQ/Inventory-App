import { useState, useRef } from 'react'
import { useHousehold } from '../../hooks/useHousehold'
import { useTranslation } from '../../i18n/useTranslation'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import FeedbackPage from '../feedback/FeedbackPage'

export function FeedbackButton() {
  const { user } = useAuth()
  const { household } = useHousehold()
  const { t } = useTranslation()

  const [open,      setOpen]      = useState(false)
  const [showPage,  setShowPage]  = useState(false)
  const [message,   setMessage]   = useState('')
  const [category,  setCategory]  = useState('idea')
  const [screenshot, setScreenshot] = useState(null) // { file, preview }
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [error,     setError]     = useState('')
  const fileRef = useRef()

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError(t.feedbackImageError ?? 'Nur Bilder erlaubt.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t.feedbackImageTooBig ?? 'Bild darf maximal 5 MB groß sein.')
      return
    }
    const preview = URL.createObjectURL(file)
    setScreenshot({ file, preview })
    setError('')
  }

  function removeScreenshot() {
    if (screenshot?.preview) URL.revokeObjectURL(screenshot.preview)
    setScreenshot(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true); setError('')

    let screenshotUrl = null

    // Screenshot hochladen falls vorhanden
    if (screenshot?.file) {
      const ext = screenshot.file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('feedback-attachments')
        .upload(path, screenshot.file)

      if (uploadError) {
        setError(t.feedbackUploadError ?? 'Upload fehlgeschlagen.')
        setLoading(false)
        return
      }
      screenshotUrl = path
    }

    const { error } = await supabase.from('feedback').insert({
      profile_id:    user?.id ?? null,
      household_id:  household?.id ?? null,
      message:       message.trim(),
      status:        'submitted',
      category,
      screenshot_url: screenshotUrl,
    })

    if (error) { setError(error.message); setLoading(false); return }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      setOpen(false); setSuccess(false)
      setMessage(''); setCategory('idea')
      removeScreenshot()
    }, 2000)
  }

  function handleClose() {
    setOpen(false); setError('')
    setMessage(''); setCategory('idea')
    removeScreenshot()
  }

  const CATEGORY_CONFIG = {
    idea: { label: t.feedbackCategoryIdea ?? 'Idee', icon: '💡' },
    bug:  { label: t.feedbackCategoryBug  ?? 'Bug',  icon: '🐛' },
  }

  return (
    <>
      {showPage && <FeedbackPage onClose={() => setShowPage(false)} />}

      <button onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 bg-white border border-gray-200
          rounded-2xl shadow-md flex items-center justify-center text-xl
          hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
        title={t.feedbackTitle}>
        💡
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={handleClose}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 text-lg">{t.feedbackTitle}</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            {success ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <p className="font-medium text-gray-900">{t.feedbackSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {/* Kategorie */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    {t.feedbackCategoryLabel ?? 'Art'}
                  </label>
                  <div className="flex gap-2">
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <button key={key} type="button"
                        onClick={() => { setCategory(key); setScreenshot(null); setError('') }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                          border text-sm font-medium transition-all
                          ${category === key
                            ? key === 'bug'
                              ? 'bg-red-50 border-red-300 text-red-700'
                              : 'bg-primary-50 border-primary-300 text-primary-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <span>{cfg.icon}</span>
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nachricht */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{t.feedbackLabel}</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)}
                    placeholder={
                      category === 'bug'
                        ? (t.feedbackBugPlaceholder ?? 'Was ist passiert? Wie kann man es nachstellen?')
                        : t.feedbackPlaceholder
                    }
                    rows={3} required autoFocus
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm
                      text-gray-900 placeholder-gray-400 resize-none focus:outline-none
                      focus:ring-2 focus:ring-primary-500" />
                </div>

                {/* Screenshot — nur bei Bugs */}
                {category === 'bug' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      {t.feedbackScreenshot ?? 'Screenshot (optional)'}
                    </label>

                    {screenshot ? (
                      <div className="relative">
                        <img src={screenshot.preview} alt="Screenshot"
                          className="w-full rounded-xl border border-gray-200 object-cover max-h-40" />
                        <button type="button" onClick={removeScreenshot}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white
                            rounded-full flex items-center justify-center text-xs hover:bg-black/70">
                          ×
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl
                          border border-dashed border-gray-200 text-sm text-gray-500
                          hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all">
                        📎 {t.feedbackAddScreenshot ?? 'Screenshot hinzufügen'}
                      </button>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden"
                      onChange={handleFile} />
                  </div>
                )}

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="flex gap-2">
                  <button type="button" onClick={handleClose}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                      font-medium text-gray-700 hover:bg-gray-50 transition-all">
                    {t.cancel}
                  </button>
                  <button type="submit" disabled={loading || !message.trim()}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm
                      font-medium hover:bg-primary-600 disabled:opacity-50 transition-all">
                    {loading ? t.saving : t.feedbackSend}
                  </button>
                </div>

                <button type="button"
                  onClick={() => { handleClose(); setShowPage(true) }}
                  className="text-xs text-primary-500 hover:text-primary-700 text-center">
                  {t.feedbackPageTitle ?? 'Meine Vorschläge ansehen'} →
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
