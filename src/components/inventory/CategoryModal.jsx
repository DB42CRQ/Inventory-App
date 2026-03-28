import { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { Modal, Button, Input } from '../ui'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#64748b',
]
const PRESET_ICONS = ['🥦', '🍞', '🥛', '🧴', '🧹', '❄️', '💊', '🐾', '🍷', '📦']

export function CategoryModal({ open, onClose, categories, onAdd, onUpdate, onDelete }) {
  const { t } = useTranslation()

  // 'list' | 'add' | 'edit'
  const [view,    setView]    = useState('list')
  const [editing, setEditing] = useState(null) // category being edited
  const [form,    setForm]    = useState({ name: '', color: PRESET_COLORS[0], icon: '' })
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [error,   setError]   = useState('')

  function openAdd() {
    setForm({ name: '', color: PRESET_COLORS[0], icon: '' })
    setView('add'); setError('')
  }

  function openEdit(cat) {
    setEditing(cat)
    setForm({ name: cat.name, color: cat.color, icon: cat.icon ?? '' })
    setConfirm(false)
    setView('edit'); setError('')
  }

  function goBack() {
    setView('list'); setError(''); setConfirm(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true); setError('')
    const { error } = await onAdd({ name: form.name.trim(), color: form.color, icon: form.icon })
    if (error) { setError(error.message); setLoading(false); return }
    setLoading(false); setView('list')
  }

  async function handleUpdate(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true); setError('')
    const { error } = await onUpdate(editing.id, { name: form.name.trim(), color: form.color, icon: form.icon })
    if (error) { setError(error.message); setLoading(false); return }
    setLoading(false); setView('list')
  }

  async function handleDelete() {
    setLoading(true)
    await onDelete(editing.id)
    setLoading(false); setView('list')
  }

  const ColorIconPicker = () => (
    <>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">{t.icon}</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_ICONS.map(ic => (
            <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
              className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all
                ${form.icon === ic ? 'bg-primary-100 ring-2 ring-primary-400' : 'bg-gray-100 hover:bg-gray-200'}`}>
              {ic}
            </button>
          ))}
          <button type="button" onClick={() => setForm(f => ({ ...f, icon: '' }))}
            className={`w-9 h-9 rounded-xl text-xs flex items-center justify-center transition-all
              ${form.icon === '' ? 'bg-primary-100 ring-2 ring-primary-400' : 'bg-gray-100 hover:bg-gray-200'}`}>
            📦
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">{t.color}</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
              className={`w-8 h-8 rounded-xl transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
    </>
  )

  return (
    <Modal open={open} onClose={() => { goBack(); onClose() }} title={
      view === 'list' ? t.manageCategoriesTitle :
      view === 'add'  ? (t.categoryAddTitle ?? 'Kategorie hinzufügen') :
      (t.categoryEditTitle ?? 'Kategorie bearbeiten')
    }>
      {/* Zurück-Button */}
      {view !== 'list' && (
        <button onClick={goBack} className="flex items-center gap-1 text-sm text-gray-500
          hover:text-gray-700 mb-3 -mt-1">
          ← {t.back ?? 'Zurück'}
        </button>
      )}

      {/* Liste */}
      {view === 'list' && (
        <div className="flex flex-col gap-2">
          {categories.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              {t.categoriesEmpty ?? 'Noch keine Kategorien'}
            </p>
          )}
          {categories.map(cat => (
            <div key={cat.id}
              className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
              <span className="text-lg w-6 text-center">{cat.icon || '📦'}</span>
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="flex-1 text-sm font-medium text-gray-800">{cat.name}</span>
              <button onClick={() => openEdit(cat)}
                className="w-7 h-7 rounded-lg text-gray-300 hover:text-primary-400 hover:bg-primary-50
                  transition-all flex items-center justify-center text-sm">
                ✏️
              </button>
            </div>
          ))}
          <button onClick={openAdd}
            className="mt-2 w-full py-2.5 rounded-xl border border-dashed border-gray-200
              text-sm text-gray-500 hover:border-primary-300 hover:text-primary-600
              hover:bg-primary-50 transition-all">
            + {t.newCategory ?? 'Neue Kategorie'}
          </button>
          <Button variant="secondary" className="mt-1" onClick={onClose}>{t.close}</Button>
        </div>
      )}

      {/* Hinzufügen */}
      {view === 'add' && (
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <Input label={t.categoryName} placeholder={t.categoryNamePlaceholder}
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <ColorIconPicker />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={goBack}>{t.cancel}</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? t.saving : t.add}
            </Button>
          </div>
        </form>
      )}

      {/* Bearbeiten */}
      {view === 'edit' && editing && (
        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <Input label={t.categoryName} value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
          <ColorIconPicker />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={goBack}>{t.cancel}</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? t.saving : t.save}
            </Button>
          </div>

          {/* Löschen */}
          <div className="border-t border-gray-100 pt-3">
            {confirm ? (
              <div className="flex items-center justify-between bg-red-50 rounded-xl px-3 py-2.5">
                <p className="text-sm text-red-600 font-medium">
                  {t.deleteConfirmText ?? 'Wirklich löschen?'}
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setConfirm(false)}
                    className="text-xs text-gray-500 hover:text-gray-700 font-medium">{t.cancel}</button>
                  <button type="button" onClick={handleDelete} disabled={loading}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold">
                    {loading ? '…' : t.deleteConfirm}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirm(true)}
                className="w-full text-sm text-red-400 hover:text-red-600 text-center py-1 transition-colors">
                {t.deleteCategoryBtn ?? 'Kategorie löschen'}
              </button>
            )}
          </div>
        </form>
      )}
    </Modal>
  )
}
