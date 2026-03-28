import { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { Modal, Button, Input } from '../ui'

export function VersionModal({ open, onClose, versions, isDeveloper, createVersion, deleteVersion }) {
  const { t } = useTranslation()
  const [form,     setForm]     = useState({ version: '', notes: '' })
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [confirm,  setConfirm]  = useState(null)
  const [expanded, setExpanded] = useState(null) // which version is expanded

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.version.trim() || !form.notes.trim()) return
    setLoading(true); setError('')
    const { error } = await createVersion(form.version.trim(), form.notes.trim())
    if (error) { setError(error.message); setLoading(false); return }
    setForm({ version: '', notes: '' })
    setLoading(false)
  }

  function toggleExpand(id) {
    setExpanded(prev => prev === id ? null : id)
  }

  return (
    <Modal open={open} onClose={onClose} title={t.versionsTitle ?? 'Versionen'}>
      {versions.length > 0 ? (
        <div className="flex flex-col gap-2 mb-4 max-h-72 overflow-y-auto">
          {versions.map((v, i) => {
            const isOpen = expanded === v.id
            const views = v.version_views ?? []
            const installedCount = views.filter(vv => vv.installed).length
            const seenCount = views.length

            return (
              <div key={v.id} className="border border-gray-100 rounded-xl overflow-hidden">
                {/* Header row — always visible */}
                <button onClick={() => toggleExpand(v.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-all text-left">
                  <span className="text-sm">{isOpen ? '▾' : '▸'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">v{v.version}</span>
                      {i === 0 && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                          {t.versionLatest ?? 'Aktuell'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(v.created_at).toLocaleDateString('de-DE')}
                      {isDeveloper && (
                        <span className="ml-2">
                          · {installedCount} ✓ / {seenCount} {t.versionSeen ?? 'gesehen'}
                        </span>
                      )}
                    </p>
                  </div>
                  {isDeveloper && (
                    confirm === v.id ? (
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { deleteVersion(v.id); setConfirm(null) }}
                          className="text-xs text-red-500 font-medium">{t.yes ?? 'Ja'}</button>
                        <button onClick={() => setConfirm(null)}
                          className="text-xs text-gray-400">{t.no ?? 'Nein'}</button>
                      </div>
                    ) : (
                      <button onClick={e => { e.stopPropagation(); setConfirm(v.id) }}
                        className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
                    )
                  )}
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="px-3 py-3 border-t border-gray-100">
                    <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed mb-3">
                      {v.notes}
                    </p>

                    {/* Developer: User-Übersicht */}
                    {isDeveloper && views.length > 0 && (
                      <div className="border-t border-gray-100 pt-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          {t.versionUsers ?? 'User-Übersicht'}
                        </p>
                        <div className="flex flex-col gap-1">
                          {views.map(vv => (
                            <div key={vv.profile_id} className="flex items-center gap-2 text-xs">
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] shrink-0
                                ${vv.installed ? 'bg-green-500' : 'bg-gray-300'}`}>
                                {vv.installed ? '✓' : '○'}
                              </span>
                              <span className="text-gray-700 truncate">
                                {vv.profiles?.display_name ?? '—'}
                              </span>
                              <span className="text-gray-400 truncate">
                                {vv.profiles?.email}
                              </span>
                              <span className="text-gray-300 ml-auto shrink-0">
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
      ) : (
        <p className="text-sm text-gray-400 text-center py-4 mb-4">
          {t.versionsEmpty ?? 'Noch keine Versionen'}
        </p>
      )}

      {/* Developer: neue Version */}
      {isDeveloper ? (
        <form onSubmit={handleCreate} className="flex flex-col gap-3 border-t border-gray-100 pt-4">
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
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              {t.close ?? 'Schließen'}
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? t.saving : t.versionsPublish ?? 'Veröffentlichen'}
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" className="w-full" onClick={onClose}>
          {t.close ?? 'Schließen'}
        </Button>
      )}
    </Modal>
  )
}
