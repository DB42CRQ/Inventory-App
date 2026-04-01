import { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { Badge } from '../ui'


export function ItemCard({ item, category, onUpdateQty, onDelete, onEdit }) {
  const { t, lang } = useTranslation()

  function getCatName(cat) {
    if (!cat) return ''
    if (lang === 'en') return cat.name_en || cat.name
    if (lang === 'es') return cat.name_es || cat.name
    return cat.name_de || cat.name
  }
  const [editing, setEditing] = useState(false)
  const isLow = item.min_quantity != null && item.quantity <= item.min_quantity

  return (
    <div className={`bg-white rounded-2xl border p-4 flex items-center gap-3 transition-all
      ${isLow ? 'border-orange-200 bg-orange-50' : 'border-gray-100'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 truncate">{item.name}</span>
          {isLow && (
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
              {t.lowBadge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {category && (
            <Badge color={category.color}>
              {category.icon && <span className="mr-1">{category.icon}</span>}
              {getCatName(category)}
            </Badge>
          )}
          {item.min_quantity > 0 && (
            <span className="text-xs text-gray-400">{t.minQty} {item.min_quantity} {item.unit}</span>
          )}
        </div>
      </div>

      {/* Menge */}
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => onUpdateQty(item.id, item.quantity - 1)} disabled={item.quantity <= 0}
          className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200
            disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg">
          −
        </button>
        {editing ? (
          <input type="number" min="0" defaultValue={item.quantity}
            className="w-16 text-center border border-primary-300 rounded-xl px-2 py-1 text-sm font-semibold"
            autoFocus
            onBlur={e => { onUpdateQty(item.id, Number(e.target.value)); setEditing(false) }}
            onKeyDown={e => e.key === 'Enter' && e.target.blur()} />
        ) : (
          <button onClick={() => setEditing(true)}
            className="min-w-[3rem] text-center font-semibold text-gray-900 hover:text-primary-600 transition-colors">
            {item.quantity}
            <span className="text-xs font-normal text-gray-400 ml-0.5">{item.unit}</span>
          </button>
        )}
        <button onClick={() => onUpdateQty(item.id, item.quantity + 1)}
          className="w-8 h-8 rounded-xl bg-primary-100 text-primary-600 font-bold hover:bg-primary-200
            flex items-center justify-center text-lg">
          +
        </button>
      </div>

      {/* Edit Button — zentriert, kein Delete mehr hier */}
      <button onClick={() => onEdit(item)}
        className="w-8 h-8 rounded-xl text-gray-300 hover:text-primary-400 hover:bg-primary-50
          transition-all flex items-center justify-center shrink-0">
        ✏️
      </button>
    </div>
  )
}
