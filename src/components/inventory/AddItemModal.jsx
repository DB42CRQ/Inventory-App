import { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { Modal, Input, Button } from '../ui'

const UNITS = ['Stück', 'g', 'kg', 'ml', 'l', 'Packung', 'Flasche', 'Dose', 'Beutel']

export function AddItemModal({ open, onClose, categories, onAdd }) {
  const { t, lang } = useTranslation()
  const getCatName = (c) => lang === 'en' && c.name_en ? c.name_en : lang === 'es' && c.name_es ? c.name_es : lang === 'de' && c.name_de ? c.name_de : c.name
  const [form, setForm] = useState({ name: '', quantity: '1', unit: 'Stück', category_id: '', min_quantity: '0' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true); setError('')
    const { error } = await onAdd(form)
    if (error) { setError(error.message); setLoading(false); return }
    setForm({ name: '', quantity: '1', unit: 'Stück', category_id: '', min_quantity: '0' })
    setLoading(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t.addItemTitle}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label={t.itemName} placeholder={t.itemNamePlaceholder}
          value={form.name} onChange={set('name')} required autoFocus />
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
            {categories.map(c => <option key={c.id} value={c.id}>{getCatName(c)}</option>)}
          </select>
        </div>
        <Input label={t.minQuantity} type="number" min="0" step="0.1"
          placeholder={t.minQuantityPlaceholder}
          value={form.min_quantity} onChange={set('min_quantity')} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2 mt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>{t.cancel}</Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? t.adding : t.add}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
