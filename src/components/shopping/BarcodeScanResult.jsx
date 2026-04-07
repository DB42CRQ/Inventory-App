import { useState } from 'react'
import { Button } from '../ui'

export default function BarcodeScanResult({ result, onConfirmCheck, onAddNew, onClose, t }) {
  const [qty, setQty] = useState(result.matchedItem?.quantity ?? 1)

  // Match gefunden
  if (result.matchedItem) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        onClick={onClose}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
          onClick={e => e.stopPropagation()}>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">✅</span>
            <h3 className="font-semibold text-gray-900">{t.barcodMatchFound ?? 'Artikel gefunden!'}</h3>
          </div>
          <p className="text-sm text-gray-500 mb-1">{result.productName}</p>
          <p className="text-xs text-gray-400 mb-4">→ {result.matchedItem.name}</p>

          <p className="text-sm font-medium text-gray-700 mb-3">
            {t.shoppingHowMany ?? 'Wie viel hast du gekauft?'}
          </p>
          <div className="flex items-center gap-2 mb-5">
            <button onClick={() => setQty(q => Math.max(0, Number(q) - 1))}
              className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 font-bold
                hover:bg-gray-200 flex items-center justify-center text-lg shrink-0">−</button>
            <input type="number" min="0" step="0.1" value={qty}
              onChange={e => setQty(e.target.value)}
              className="flex-1 min-w-0 text-center text-xl font-semibold border border-gray-200
                rounded-xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <button onClick={() => setQty(q => Number(q) + 1)}
              className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 font-bold
                hover:bg-primary-200 flex items-center justify-center text-lg shrink-0">+</button>
            <span className="text-sm text-gray-500 shrink-0">{result.matchedItem.unit}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={onClose}>{t.cancel}</Button>
            <Button className="flex-1" onClick={() => onConfirmCheck(result.matchedItem, Number(qty))}>
              ✓ {t.shoppingConfirm ?? 'Gekauft'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Kein Match
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🔍</span>
          <h3 className="font-semibold text-gray-900">{t.barcodeNoMatch ?? 'Nicht im Inventar'}</h3>
        </div>
        <p className="text-sm text-gray-700 font-medium mb-1">{result.productName}</p>
        {result.barcode && (
          <p className="text-xs text-gray-400 mb-4">Barcode: {result.barcode}</p>
        )}
        <p className="text-sm text-gray-500 mb-5">
          {t.barcodeNoMatchHint ?? 'Dieser Artikel ist nicht in deinem Inventar. Möchtest du ihn hinzufügen?'}
        </p>

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>{t.cancel}</Button>
          <Button className="flex-1" onClick={() => onAddNew(result.productName)}>
            + {t.addItem}
          </Button>
        </div>
      </div>
    </div>
  )
}
