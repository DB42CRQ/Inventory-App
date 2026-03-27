import { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { Modal, Button, Input } from '../ui'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#64748b',
]
const PRESET_ICONS = ['🥦', '🍞', '🥛', '🧴', '🧹', '❄️', '💊', '🐾', '🍷', '📦']

export function CategoryModal({ open, onClose, categories, onAdd, onDelete }) {
  const { t } = useTranslation()
  const [name,    setName]    = useState('')
  const [color,   setColor]   = useState(PRESET_COLORS[0])
  const [icon,    setIcon]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [confirm, setConfirm] = useState(null)

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true); setError('')
    const { error } = await onAdd({ name: name.trim(), color, icon })
    if (error) { setError(error.message); setLoading(false); return }
    setName(''); setIcon(''); setLoading(false)
  }

  async function handleDelete(id) {
    await onDelete(id)
    setConfirm(null)
  }

  return (
    <Modal open={open} onClose={onClose} title={t.manageCategoriesTitle}>
      {categories.length > 0 && (
        <div className="mb-5 flex flex-col gap-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
              <span className="text-lg w-6 text-center">{cat.icon || '📦'}</span>
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="flex-1 text-sm font-medium text-gray-800">{cat.name}</span>
              {confirm === cat.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{t.deleteConfirm}</span>
                  <button onClick={() => handleDelete(cat.id)}
                    className="text-xs text-red-500 font-medium hover:text-red-700">{t.yes}</button>
                  <button onClick={() => setConfirm(null)}
                    className="text-xs text-gray-400 hover:text-gray-600">{t.no}</button>
                </div>
              ) : (
                <button onClick={() => setConfirm(cat.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none">×</button>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.newCategory}</p>
        <Input label={t.categoryName} placeholder={t.categoryNamePlaceholder}
          value={name} onChange={e => setName(e.target.value)} required />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">{t.icon}</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_ICONS.map(ic => (
              <button key={ic} type="button" onClick={() => setIcon(ic)}
                className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all
                  ${icon === ic ? 'bg-primary-100 ring-2 ring-primary-400' : 'bg-gray-100 hover:bg-gray-200'}`}>
                {ic}
              </button>
            ))}
            <button type="button" onClick={() => setIcon('')}
              className={`w-9 h-9 rounded-xl text-xs flex items-center justify-center transition-all
                ${icon === '' ? 'bg-primary-100 ring-2 ring-primary-400' : 'bg-gray-100 hover:bg-gray-200'}`}>
              📦
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">{t.color}</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-xl transition-all ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>{t.close}</Button>
          <Button type="submit" className="flex-1" disabled={loading || !name.trim()}>
            {loading ? t.adding : t.add}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
