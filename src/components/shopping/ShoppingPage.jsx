import { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { useShoppingList } from '../../hooks/useShoppingList'
import { useInventory } from '../../hooks/useInventory'
import { Spinner, Button } from '../ui'
import BarcodeScanner from './BarcodeScanner'
import BarcodeScanResult from './BarcodeScanResult'
import { processBarcode } from '../../hooks/useBarcodeScanner'

function CheckModal({ item, onConfirm, onCancel, t }) {
  const [qty, setQty] = useState(item.quantity)
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
        <p className="text-sm text-gray-500 mb-4">{t.shoppingHowMany ?? 'Wie viel hast du gekauft?'}</p>
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
          <span className="text-sm text-gray-500 shrink-0">{item.unit}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>{t.cancel}</Button>
          <Button className="flex-1" onClick={() => onConfirm(qty)}>
            ✓ {t.shoppingConfirm ?? 'Gekauft'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ShoppingItem({ item, onCheck, onUncheck, onRemove, t }) {
  const [showModal, setShowModal] = useState(false)
  return (
    <>
      <div className={`bg-white rounded-2xl border p-4 flex items-center gap-3 transition-all
        ${item.checked ? 'opacity-60 border-gray-100' : 'border-gray-100'}`}>
        <button onClick={() => item.checked ? onUncheck(item) : setShowModal(true)}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0
            transition-all ${item.checked
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-primary-400'}`}>
          {item.checked && <span className="text-sm">✓</span>}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-gray-900 ${item.checked ? 'line-through text-gray-400' : ''}`}>
            {item.name}
          </p>
          <p className="text-xs text-gray-400">
            {item.checked
              ? `${item.quantity} ${item.unit} ${t.shoppingPurchased ?? 'gekauft'}`
              : `${item.quantity} ${item.unit}`}
            {item.profiles?.display_name && ` · ${item.profiles.display_name}`}
          </p>
        </div>
        <button onClick={() => onRemove(item.id)}
          className="w-7 h-7 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50
            transition-all flex items-center justify-center text-lg shrink-0">
          ×
        </button>
      </div>
      {showModal && (
        <CheckModal item={item} t={t}
          onCancel={() => setShowModal(false)}
          onConfirm={(qty) => { onCheck(item, qty); setShowModal(false) }} />
      )}
    </>
  )
}

export default function ShoppingPage({ onClose, household }) {
  const { t, lang } = useTranslation()
  const { unchecked, checked, loading, addItem, addLowItems,
          checkItem, uncheckItem, removeItem, clearChecked } = useShoppingList(household?.id)
  const { items: inventoryItems, lowItems, categories } = useInventory(household?.id)

  const [showAdd,      setShowAdd]      = useState(false)
  const [search,       setSearch]       = useState('')
  const [addedMsg,     setAddedMsg]     = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [showScanner,  setShowScanner]  = useState(false)
  const [scanResult,   setScanResult]   = useState(null)
  const [scanLoading,  setScanLoading]  = useState(false)

  const getCatName = (cat) => !cat ? '' :
    lang === 'en' ? (cat.name_en || cat.name) :
    lang === 'es' ? (cat.name_es || cat.name) :
    (cat.name_de || cat.name)

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  async function handleAddLow(categoryId) {
    const filtered = categoryId === 'all'
      ? lowItems
      : lowItems.filter(i => i.category_id === categoryId)
    const { count, error } = await addLowItems(filtered)
    if (!error) {
      setAddedMsg(count > 0
        ? `${count} ${t.shoppingAddedLow ?? 'Artikel hinzugefügt'}`
        : t.shoppingAllAdded ?? 'Alle bereits auf der Liste')
      setTimeout(() => setAddedMsg(''), 3000)
    }
  }

  async function handleScan(barcode) {
    setShowScanner(false)
    setScanLoading(true)
    const result = await processBarcode(barcode, inventoryItems)
    setScanLoading(false)
    setScanResult(result)
  }

  async function handleCheck(item, qty) {
    await checkItem(item.id, qty, item.item_id)
  }

  async function handleUncheck(item) {
    await uncheckItem(item.id, item.item_id, item.quantity)
  }

  async function handleClearAll() {
    const allIds = [...unchecked, ...checked].map(i => i.id)
    for (const id of allIds) await removeItem(id)
    setConfirmClear(false)
  }

  async function handleClearDone() {
    await clearChecked()
    setConfirmClear(false)
  }

  const filteredInventory = inventoryItems.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  const lowCats = categories.filter(cat =>
    lowItems.some(i => i.category_id === cat.id)
  )

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all
            flex items-center justify-center text-gray-600 text-lg">←</button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">
          🛒 {t.shoppingTitle ?? 'Einkaufsliste'}
        </h1>
        <button onClick={() => setShowScanner(true)}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all
            flex items-center justify-center text-lg">
          📷
        </button>
        <span className="text-sm text-gray-400">{unchecked.length} {t.shoppingItems ?? 'Artikel'}</span>
      </header>

      {/* Actions */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex flex-wrap gap-2">
        {lowItems.length > 0 && (
          <div className="flex flex-col gap-1.5 w-full">
            <button onClick={() => handleAddLow('all')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 border
                border-orange-200 text-orange-700 text-xs font-medium hover:bg-orange-100 transition-all">
              ⚠️ {t.shoppingAddLow ?? 'Alle niedrigen'} ({lowItems.length})
            </button>
            {lowCats.length > 0 && (
              <select
                onChange={e => { if (e.target.value) { handleAddLow(e.target.value); e.target.value = '' } }}
                className="px-3 py-2 rounded-xl border border-orange-200 bg-white text-orange-700
                  text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-300 cursor-pointer">
                <option value="">{t.shoppingByCategory ?? 'Nach Kategorie…'}</option>
                {lowCats.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon ? cat.icon + ' ' : ''}{getCatName(cat)} ({lowItems.filter(i => i.category_id === cat.id).length})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="flex gap-2 ml-auto">
          <button onClick={() => setShowAdd(s => !s)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium
              transition-all ${showAdd
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            + {t.shoppingAddFromInventory ?? 'Aus Inventar'}
          </button>

          {(unchecked.length > 0 || checked.length > 0) && (
            confirmClear ? (
              <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-xl px-2 py-1">
                <span className="text-xs text-red-600 font-medium">{t.deleteConfirmText ?? 'Wirklich?'}</span>
                {checked.length > 0 && (
                  <button onClick={handleClearDone}
                    className="text-xs text-orange-600 font-medium px-1 hover:text-orange-800">
                    {t.shoppingClearDone ?? 'Erledigte'}
                  </button>
                )}
                <button onClick={handleClearAll}
                  className="text-xs text-red-600 font-semibold px-1 hover:text-red-800">
                  {t.shoppingClearAll ?? 'Alle'}
                </button>
                <button onClick={() => setConfirmClear(false)}
                  className="text-xs text-gray-400 px-1">✕</button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200
                  text-gray-500 text-xs font-medium hover:bg-gray-50 transition-all">
                🗑 {t.shoppingClear ?? 'Leeren'}
              </button>
            )
          )}
        </div>
      </div>

      {addedMsg && (
        <div className="mx-4 mt-3 bg-green-50 border border-green-200 rounded-xl px-3 py-2
          text-sm text-green-700 text-center">
          {addedMsg}
        </div>
      )}

      {showAdd && (
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <input type="search" placeholder={t.searchPlaceholder}
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-500" />
          {search && (
            <div className="mt-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
              {filteredInventory.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">{t.noItemsFound}</p>
              ) : filteredInventory.map(item => {
                const cat = catMap[item.category_id]
                const onList = unchecked.find(i => i.item_id === item.id)
                return (
                  <button key={item.id}
                    onClick={() => !onList && addItem({ name: item.name, quantity: 1, unit: item.unit, item_id: item.id })}
                    disabled={!!onList}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm
                      transition-all ${onList
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'hover:bg-primary-50 hover:text-primary-700'}`}>
                    <span className="flex-1 truncate">{item.name}</span>
                    {cat && <span className="text-xs text-gray-400">{getCatName(cat)}</span>}
                    {onList ? <span className="text-xs text-green-500">✓</span> : <span className="text-primary-400">+</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      <main className="flex-1 overflow-y-auto max-w-2xl w-full mx-auto px-4 py-4 pb-8">
        {loading ? <Spinner /> : (
          unchecked.length === 0 && checked.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl mb-3">🛒</div>
              <p className="font-semibold text-gray-900 mb-1">{t.shoppingEmpty ?? 'Liste ist leer'}</p>
              <p className="text-sm text-gray-400">{t.shoppingEmptyHint ?? 'Füge Artikel hinzu.'}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {unchecked.map(item => (
                <ShoppingItem key={item.id} item={item} t={t}
                  onCheck={handleCheck} onUncheck={handleUncheck} onRemove={removeItem} />
              ))}
              {checked.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-1">
                    ✓ {t.shoppingDone ?? 'Erledigt'} ({checked.length})
                  </p>
                  {checked.map(item => (
                    <ShoppingItem key={item.id} item={item} t={t}
                      onCheck={handleCheck} onUncheck={handleUncheck} onRemove={removeItem} />
                  ))}
                </>
              )}
            </div>
          )
        )}
      </main>

      {/* Scanner */}
      {showScanner && (
        <BarcodeScanner onResult={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {/* Loading */}
      {scanLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl px-6 py-4 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700">{t.barcodeSearching ?? 'Suche Produkt…'}</span>
          </div>
        </div>
      )}

      {/* Scan Result */}
      {scanResult && (
        <BarcodeScanResult
          result={scanResult}
          t={t}
          onClose={() => setScanResult(null)}
          onConfirmCheck={async (inventoryItem, qty) => {
            const { supabase } = await import('../../lib/supabase')
            const newQty = inventoryItem.quantity + Number(qty)
            await supabase.from('items').update({ quantity: newQty }).eq('id', inventoryItem.id)
          }}
          onAddNew={() => {
            setScanResult(null)
            setShowAdd(true)
          }}
        />
      )}
    </div>
  )
}
