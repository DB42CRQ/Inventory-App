import { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { Button, Input } from '../ui'

async function translateBoth(text) {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
  if (!response.ok) throw new Error('Translation failed')
  return await response.json()
}

export function VersionModal({ open, onClose, versions, isDeveloper, createVersion, publishVersion, updateDraftNotes, deleteVersion }) {
  const { t, lang } = useTranslation()
  const [form,        setForm]        = useState({ version: '', notes: '' })
  const [translating, setTranslating] = useState(false)
  const [translated,  setTranslated]  = useState({ en: '', es: '' })
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [confirm,     setConfirm]     = useState(null)
  const [expanded,    setExpanded]    = useState(null)
  const [showForm,    setShowForm]    = useState(false)
  const [editingDraft, setEditingDraft] = useState(null) // draft being edited

  if (!open) return null

  async function handleTranslate(text) {
    setTranslating(true)
    try {
      const { en, es } = await translateBoth(text)
      setTranslated({ en, es })
    } catch (e) {
      setError(t.versionTranslateFirst ?? 'Übersetzung fehlgeschlagen.')
    }
    setTranslating(false)
  }

  async function handleCreate(e, isDraft) {
    e.preventDefault()
    if (!form.version.trim() || !form.notes.trim()) return
    setLoading(true); setError('')
    const { error } = await createVersion(form.version.trim(), form.notes.trim(), translated.en, translated.es, isDraft)
    if (error) { setError(error.message); setLoading(false); return }
    setForm({ version: '', notes: '' })
    setTranslated({ en: '', es: '' })
    setShowForm(false)
    setLoading(false)
  }

  async function handleUpdateDraft(e) {
    e.preventDefault()
    if (!editingDraft) return
    setLoading(true); setError('')
    const { error } = await updateDraftNotes(editingDraft.id, form.notes.trim(), translated.en, translated.es)
    if (error) { setError(error.message); setLoading(false); return }
    setEditingDraft(null)
    setForm({ version: '', notes: '' })
    setTranslated({ en: '', es: '' })
    setLoading(false)
  }

  function openEditDraft(v) {
    setEditingDraft(v)
    setForm({ version: v.version, notes: v.notes })
    setTranslated({ en: v.notes_en ?? '', es: v.notes_es ?? '' })
    setShowForm(false)
    setError('')
  }

  function cancelEdit() {
    setEditingDraft(null)
    setForm({ version: '', notes: '' })
    setTranslated({ en: '', es: '' })
    setError('')
  }

  function toggleExpand(id) {
    setExpanded(prev => prev === id ? null : id)
  }

  function getLocalizedNotes(v) {
    if (lang === 'en' && v.notes_en) return v.notes_en
    if (lang === 'es' && v.notes_es) return v.notes_es
    return v.notes
  }

  const TranslateSection = ({ notes }) => (
    !translated.en ? (
      <button type="button" onClick={() => handleTranslate(notes)}
        disabled={translating || !notes.trim()}
        className="flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200
          text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all">
        {translating ? (
          <><span className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
          {t.versionTranslating ?? 'Übersetze…'}</>
        ) : <>🌐 {t.versionTranslate ?? 'Automatisch übersetzen'}</>}
      </button>
    ) : (
      <div className="flex flex-col gap-2">
        <div className="bg-green-50 border border-green-100 rounded-xl p-3">
          <p className="text-xs font-medium text-green-700 mb-1">🇬🇧 English</p>
          <p className="text-xs text-green-600 whitespace-pre-line">{translated.en}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3">
          <p className="text-xs font-medium text-green-700 mb-1">🇵🇪 Español</p>
          <p className="text-xs text-green-600 whitespace-pre-line">{translated.es}</p>
        </div>
        <button type="button" onClick={() => setTranslated({ en: '', es: '' })}
          className="text-xs text-gray-400 hover:text-gray-600 text-center">
          {t.versionRetranslate ?? 'Neu übersetzen'}
        </button>
      </div>
    )
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-gray-900 text-lg">{t.versionsTitle ?? 'Versionen'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4">

          {/* Draft bearbeiten */}
          {editingDraft && isDeveloper && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">
                ✏️ Draft v{editingDraft.version} bearbeiten
              </p>
              <form onSubmit={handleUpdateDraft} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{t.versionNotes ?? 'Was ist neu?'}</label>
                  <textarea value={form.notes}
                    onChange={e => { setForm(f => ({ ...f, notes: e.target.value })); setTranslated({ en: '', es: '' }) }}
                    rows={4} required
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm
                      text-gray-900 placeholder-gray-400 resize-none focus:outline-none
                      focus:ring-2 focus:ring-primary-500" />
                </div>
                <TranslateSection notes={form.notes} />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" className="flex-1" onClick={cancelEdit}>
                    {t.cancel ?? 'Abbrechen'}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading || !translated.en}>
                    {loading ? t.saving : t.save ?? 'Speichern'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Versionsliste */}
          {versions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">{t.versionsEmpty ?? 'Noch keine Versionen'}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {versions.map((v, i) => {
                const isOpen = expanded === v.id
                const views = v.version_views ?? []
                const installedCount = views.filter(vv => vv.installed).length
                const publishedVersions = versions.filter(v => !v.is_draft)
                const isLatestPublished = !v.is_draft && v.id === publishedVersions[0]?.id

                return (
                  <div key={v.id} className={`border rounded-xl overflow-hidden
                    ${v.is_draft ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}`}>
                    <button onClick={() => toggleExpand(v.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-all text-left">
                      <span className="text-gray-400 text-xs w-3 shrink-0">{isOpen ? '▾' : '▸'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">v{v.version}</span>
                          {v.is_draft ? (
                            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                              Draft
                            </span>
                          ) : isLatestPublished && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                              {t.versionLatest ?? 'Aktuell'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(v.created_at).toLocaleDateString('de-DE')}
                          {isDeveloper && !v.is_draft && ` · ${installedCount} ✓ / ${views.length} ${t.versionSeen ?? 'gesehen'}`}
                        </p>
                      </div>

                      {/* Developer Actions */}
                      {isDeveloper && (
                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          {v.is_draft && (
                            <>
                              <button onClick={() => openEditDraft(v)}
                                className="text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-700
                                  hover:bg-amber-200 font-medium transition-all">
                                ✏️
                              </button>
                              <button onClick={() => publishVersion(v.id)}
                                className="text-xs px-2 py-1 rounded-lg bg-green-100 text-green-700
                                  hover:bg-green-200 font-medium transition-all">
                                {t.versionsPublish ?? 'Publizieren'}
                              </button>
                            </>
                          )}
                          {confirm === v.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => { deleteVersion(v.id); setConfirm(null) }}
                                className="text-xs text-red-500 font-medium">{t.yes ?? 'Ja'}</button>
                              <button onClick={() => setConfirm(null)}
                                className="text-xs text-gray-400">{t.no ?? 'Nein'}</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirm(v.id)}
                              className="text-gray-300 hover:text-red-400 text-xl leading-none ml-1">×</button>
                          )}
                        </div>
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-4 py-4 border-t border-gray-100 bg-white">
                        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                          {getLocalizedNotes(v)}
                        </p>
                        {isDeveloper && !v.is_draft && views.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                              {t.versionUsers ?? 'User-Übersicht'}
                            </p>
                            <div className="flex flex-col gap-2">
                              {views.map(vv => (
                                <div key={vv.profile_id} className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center
                                    text-white text-[10px] font-bold shrink-0
                                    ${vv.installed ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    {vv.installed ? '✓' : '○'}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-800 truncate">{vv.profiles?.display_name ?? '—'}</p>
                                    <p className="text-xs text-gray-400 truncate">{vv.profiles?.email}</p>
                                  </div>
                                  <span className="text-xs text-gray-300 shrink-0">
                                    {new Date(vv.viewed_at).toLocaleDateString('de-DE')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Neue Version anlegen */}
          {isDeveloper && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              {!showForm ? (
                <button onClick={() => { setShowForm(true); cancelEdit() }}
                  className="w-full py-2.5 rounded-xl border border-dashed border-gray-200
                    text-sm text-gray-500 hover:border-primary-300 hover:text-primary-600
                    hover:bg-primary-50 transition-all">
                  + {t.versionsNew ?? 'Neue Version anlegen'}
                </button>
              ) : (
                <form className="flex flex-col gap-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t.versionsNew ?? 'Neue Version'}
                  </p>
                  <Input label={t.versionNumber ?? 'Versionsnummer'} placeholder="z.B. 1.2.0"
                    value={form.version}
                    onChange={e => setForm(f => ({ ...f, version: e.target.value }))} required />
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      {t.versionNotes ?? 'Was ist neu?'} (Deutsch)
                    </label>
                    <textarea value={form.notes}
                      onChange={e => { setForm(f => ({ ...f, notes: e.target.value })); setTranslated({ en: '', es: '' }) }}
                      placeholder={t.versionNotesPlaceholder ?? '- Feature A hinzugefügt\n- Bug B behoben'}
                      rows={4} required
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm
                        text-gray-900 placeholder-gray-400 resize-none focus:outline-none
                        focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <TranslateSection notes={form.notes} />
                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setError(''); setTranslated({ en: '', es: '' }) }}>
                      {t.cancel ?? 'Abbrechen'}
                    </Button>
                    <Button type="button" disabled={loading || !translated.en}
                      variant="secondary"
                      onClick={(e) => handleCreate(e, true)}>
                      {loading ? t.saving : t.versionSaveDraft ?? 'Als Draft speichern'}
                    </Button>
                    <Button type="button" disabled={loading || !translated.en}
                      onClick={(e) => handleCreate(e, false)}>
                      {loading ? t.saving : t.versionsPublish ?? 'Publizieren'}
                    </Button>
                  </div>
                  {!translated.en && (
                    <p className="text-xs text-gray-400 text-center">{t.versionTranslateFirst ?? 'Bitte erst übersetzen'}</p>
                  )}
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!showForm && !editingDraft && (
          <div className="px-5 py-4 border-t border-gray-100 shrink-0">
            <Button variant="secondary" className="w-full" onClick={onClose}>{t.close ?? 'Schließen'}</Button>
          </div>
        )}
      </div>
    </div>
  )
}
