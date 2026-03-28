import { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { Button, Input } from '../ui'

export function VersionModal({ open, onClose, versions, isDeveloper, createVersion, deleteVersion }) {
  const { t } = useTranslation()
  const [form,     setForm]     = useState({ version: '', notes: '' })
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [confirm,  setConfirm]  = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [showForm, setShowForm] = useState(false)

  if (!open) return null

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.version.trim() || !form.notes.trim()) return
    setLoading(true); setError('')
    const { error } = await createVersion(form.version.trim(), form.notes.trim())
    if (error) { setError(error.message); setLoading(false); return }
    setForm({ version: '', notes: '' })
    setShowForm(false)
    setLoading(false)
  }

  function toggleExpand(id) {
    setExpanded(prev => prev === id ? null : id)
  }

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
          {versions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              {t.versionsEmpty ?? 'Noch keine Versionen'}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {versions.map((v, i) => {
                const isOpen = expanded === v.id
                const views = v.version_views ?? []
                const installedCount = views.filter(vv => vv.installed).length

                return (
                  <div key={v.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    {/* Header */}
                    <button onClick={() => toggleExpand(v.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-all text-left">
                      <span className="text-gray-400 text-xs w-3 shrink-0">
                        {isOpen ? '▾' : '▸'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">v{v.version}</span>
                          {i === 0 && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                              {t.versionLatest ?? 'Aktuell'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(v.created_at).toLocaleDateString('de-DE')}
                          {isDeveloper && ` · ${installedCount} ✓ / ${views.length} ${t.versionSeen ?? 'gesehen'}`}
                        </p>
                      </div>
                      {isDeveloper && (
                        confirm === v.id ? (
                          <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { deleteVersion(v.id); setConfirm(null) }}
                              className="text-xs text-red-500 font-medium">{t.yes ?? 'Ja'}</button>
                            <button onClick={() => setConfirm(null)}
                              className="text-xs text-gray-400">{t.no ?? 'Nein'}</button>
                          </div>
                        ) : (
                          <button onClick={e => { e.stopPropagation(); setConfirm(v.id) }}
                            className="text-gray-300 hover:text-red-400 text-xl leading-none shrink-0">×</button>
                        )
                      )}
                    </button>

                    {/* Expanded */}
                    {isOpen && (
                      <div className="px-4 py-4 border-t border-gray-100 bg-white">
                        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                          {v.notes}
                        </p>

                        {isDeveloper && views.length > 0 && (
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
                                    <p className="text-xs font-medium text-gray-800 truncate">
                                      {vv.profiles?.display_name ?? '—'}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                      {vv.profiles?.email}
                                    </p>
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

          {/* Developer: neue Version */}
          {isDeveloper && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              {!showForm ? (
                <button onClick={() => setShowForm(true)}
                  className="w-full py-2.5 rounded-xl border border-dashed border-gray-200
                    text-sm text-gray-500 hover:border-primary-300 hover:text-primary-600
                    hover:bg-primary-50 transition-all">
                  + {t.versionsNew ?? 'Neue Version anlegen'}
                </button>
              ) : (
                <form onSubmit={handleCreate} className="flex flex-col gap-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t.versionsNew ?? 'Neue Version'}
                  </p>
                  <Input
                    label={t.versionNumber ?? 'Versionsnummer'}
                    placeholder="z.B. 1.2.0"
                    value={form.version}
                    onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                    required
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      {t.versionNotes ?? 'Was ist neu?'}
                    </label>
                    <textarea value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder={t.versionNotesPlaceholder ?? '- Feature A hinzugefügt\n- Bug B behoben'}
                      rows={4} required
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm
                        text-gray-900 placeholder-gray-400 resize-none focus:outline-none
                        focus:ring-2 focus:ring-primary-500" />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" className="flex-1"
                      onClick={() => { setShowForm(false); setError('') }}>
                      {t.cancel ?? 'Abbrechen'}
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? t.saving : t.versionsPublish ?? 'Veröffentlichen'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!showForm && (
          <div className="px-5 py-4 border-t border-gray-100 shrink-0">
            <Button variant="secondary" className="w-full" onClick={onClose}>
              {t.close ?? 'Schließen'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
