import { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { Modal, Button, Input } from '../ui'

export function VersionModal({ open, onClose, versions, isDeveloper, markAsSeen, createVersion, deleteVersion }) {
  const { t } = useTranslation()
  const [form,    setForm]    = useState({ version: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [confirm, setConfirm] = useState(null)

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.version.trim() || !form.notes.trim()) return
    setLoading(true); setError('')
    const { error } = await createVersion(form.version.trim(), form.notes.trim())
    if (error) { setError(error.message); setLoading(false); return }
    setForm({ version: '', notes: '' })
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} title={t.versionsTitle ?? 'Versionen'}>
      {/* Versionsliste */}
      {versions.length > 0 ? (
        <div className="flex flex-col gap-3 mb-4 max-h-64 overflow-y-auto">
          {versions.map((v, i) => (
            <div key={v.id} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">v{v.version}</span>
                  {i === 0 && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                      {t.versionLatest ?? 'Aktuell'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {new Date(v.created_at).toLocaleDateString('de-DE')}
                  </span>
                  {isDeveloper && (
                    confirm === v.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => { deleteVersion(v.id); setConfirm(null) }}
                          className="text-xs text-red-500 font-medium">{t.yes ?? 'Ja'}</button>
                        <button onClick={() => setConfirm(null)}
                          className="text-xs text-gray-400">{t.no ?? 'Nein'}</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirm(v.id)}
                        className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
                    )
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-600 whitespace-pre-line">{v.notes}</p>
            </div>
          ))}
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
