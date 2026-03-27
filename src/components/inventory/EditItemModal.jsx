import { useState, useEffect } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { Modal, Input, Button } from '../ui'

const UNITS = ['Stück', 'g', 'kg', 'ml', 'l', 'Packung', 'Flasche', 'Dose', 'Beutel']

export function EditItemModal({ open, onClose, item, categories, onSave }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', quantity: '', unit: '', category_id: '', min_quantity: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    if (item) setForm({
      name: item.name, quantity: String(item.quantity), unit: item.unit,
      category_id: item.category_id ?? '', min_quantity: String(item.min_quantity),
    })
  }, [item])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true); setError('')
    const { error } = await onSave(item.id, {
      name: form.name.trim(), quantity: Number(form.quantity), unit: form.unit,
      category_id: form.category_id || null, min_quantity: Number(form.min_quantity),
    })
    if (error) { setError(error.message); setLoading(false); return }
    setLoading(false); onClose()
  }

  if (!item) return null

  return (
    <Modal open={open} onClose={onClose} title={t.editItemTitle}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label={t.itemName} value={form.name} onChange={set('name')} required autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t.quantity} type="number" min="0" step="0.1"
            value={form.quantity} onChange={set('quantity')} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t.unit}</label>
            <select value={form.unit} onChange={set('unit')}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900
                focus:outline-none focus:ring-2 focus:ring-primary-500">
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">{t.category}</label>
          <select value={form.category_id} onChange={set('category_id')}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900
              focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">{t.noCategory}</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <Input label={t.minQuantity} type="number" min="0" step="0.1"
          value={form.min_quantity} onChange={set('min_quantity')} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2 mt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>{t.cancel}</Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? t.saving : t.save}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
