import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { AddItemModal } from '../inventory/AddItemModal'

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

async function resizeImage(file, maxPx = 1200) {
  return new Promise(res => {
    const img = new Image()
    img.onload = () => {
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => {
        const reader = new FileReader()
        reader.onload = e => res(e.target.result.split(',')[1])
        reader.readAsDataURL(blob)
      }, 'image/jpeg', 0.85)
    }
    img.src = URL.createObjectURL(file)
  })
}

export default function ReceiptScanner({ onClose, inventoryItems, categories, onAddToInventory, onUpdateInventory }) {
  const { t } = useTranslation()
  const [showCamera,  setShowCamera]  = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [items,       setItems]       = useState(null)
  const [selected,    setSelected]    = useState(new Set())
  const [addingNew,   setAddingNew]   = useState(null) // item to create as new

  async function processImage(base64) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Match each item to inventory
      const matched = data.items.map(item => {
        const lower = item.name.toLowerCase()
        const match = inventoryItems?.find(i =>
          i.name.toLowerCase() === lower ||
          (i.name.toLowerCase().includes(lower) && lower.length > 3) ||
          (lower.includes(i.name.toLowerCase()) && i.name.length > 3)
        )
        return { ...item, inventoryItem: match || null }
      })
      setItems(matched)
      setSelected(new Set(matched.map((_, i) => i)))
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  async function handleFile(file) {
    const base64 = await resizeImage(file)
    await processImage(base64)
  }

  function toggleItem(i) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  async function handleConfirm() {
    const chosen = items.filter((_, i) => selected.has(i))
    for (const item of chosen) {
      if (item.inventoryItem) {
        // Update existing inventory item
        const newQty = (item.inventoryItem.quantity || 0) + (item.quantity || 1)
        await onUpdateInventory(item.inventoryItem.id, newQty)
      }
      // Items without match are skipped — user can add them manually via the + button
    }
    onClose()
  }

  // Result view
  if (items) return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col"
      style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
      <header className="bg-white border-b border-gray-100 px-4 pb-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 text-lg">←</button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">{t.receiptFound ?? 'Artikel gefunden'}</h1>
        <button onClick={handleConfirm}
          className="px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium">
          {t.receiptConfirm ?? 'Ins Inventar'} ({items.filter((_, i) => selected.has(i) && items[i].inventoryItem).length})
        </button>
      </header>

      <p className="text-xs text-gray-500 px-4 py-2 bg-white border-b border-gray-100 shrink-0">
        {t.receiptInventoryHint ?? '✓ = Inventar wird aktualisiert · + = Neuen Artikel anlegen'}
      </p>

      <main className="flex-1 overflow-y-auto">
        <div className="bg-white divide-y divide-gray-50">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              {item.inventoryItem ? (
                <button onClick={() => toggleItem(i)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 transition-all
                    ${selected.has(i) ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {selected.has(i) ? '✓' : '○'}
                </button>
              ) : (
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-500
                  flex items-center justify-center text-xs shrink-0">?</span>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{item.name}</p>
                {item.inventoryItem ? (
                  <p className="text-xs text-green-600">
                    → {item.inventoryItem.name} · {item.inventoryItem.quantity} {item.inventoryItem.unit}
                    {selected.has(i) ? ` + ${item.quantity || 1} = ${(item.inventoryItem.quantity || 0) + (item.quantity || 1)}` : ''}
                  </p>
                ) : (
                  <p className="text-xs text-orange-500">{t.receiptNoMatch ?? 'Kein Artikel gefunden'}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm text-gray-400">
                  {item.quantity ? `${item.quantity}${item.unit ? ' ' + item.unit : ''}` : ''}
                </span>
                {!item.inventoryItem && (
                  <button onClick={() => setAddingNew(item)}
                    className="w-7 h-7 rounded-lg bg-primary-100 text-primary-600
                      flex items-center justify-center text-sm font-bold hover:bg-primary-200 transition-all">
                    +
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {addingNew && (
        <AddItemModal
          open={true}
          onClose={() => setAddingNew(null)}
          categories={categories}
          prefill={{ name: addingNew.name, qty: addingNew.quantity || 1, unit: addingNew.unit || 'Stück' }}
          onAdd={async (newItem) => {
            await onAddToInventory(newItem)
            // Mark as matched in the list
            setItems(prev => prev.map((it, idx) =>
              it.name === addingNew.name ? { ...it, inventoryItem: { ...newItem, name: newItem.name } } : it
            ))
            setAddingNew(null)
          }}
        />
      )}
    </div>
  )

  // Scan view
  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col"
      style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
      <header className="bg-white border-b border-gray-100 px-4 pb-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 text-lg">←</button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">{t.receiptScan ?? 'Kassenbon scannen'}</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">{t.receiptScanning ?? 'Kassenbon wird analysiert…'}</p>
          </div>
        ) : (
          <>
            <span className="text-7xl">🧾</span>
            <p className="text-gray-600 text-center text-sm leading-relaxed">
              {t.receiptInstruction ?? 'Fotografiere deinen Kassenbon. Die KI erkennt alle Artikel automatisch.'}
            </p>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div className="flex flex-col gap-3 w-full">
              {isIOS ? (
                <label className="w-full py-4 rounded-2xl bg-primary-500 text-white font-semibold
                  text-center cursor-pointer flex items-center justify-center gap-2">
                  📷 {t.receiptPhoto ?? 'Foto aufnehmen'}
                  <input type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                </label>
              ) : (
                <button onClick={() => setShowCamera(true)}
                  className="w-full py-4 rounded-2xl bg-primary-500 text-white font-semibold
                    flex items-center justify-center gap-2">
                  📷 {t.receiptPhoto ?? 'Foto aufnehmen'}
                </button>
              )}
              <label className="w-full py-3.5 rounded-2xl border border-gray-200 text-gray-600
                text-sm font-medium text-center cursor-pointer flex items-center justify-center gap-2
                hover:bg-gray-50 transition-all">
                🖼️ {t.receiptGallery ?? 'Aus Galerie wählen'}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
            </div>
          </>
        )}
      </main>

      {showCamera && (
        <ReceiptCamera
          onCapture={async base64 => { setShowCamera(false); await processImage(base64) }}
          onClose={() => setShowCamera(false)}
          t={t}
        />
      )}
    </div>
  )
}

function ReceiptCamera({ onCapture, onClose, t }) {
  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
      .then(stream => {
        streamRef.current = stream
        videoRef.current.srcObject = stream
        videoRef.current.playsInline = true
        videoRef.current.muted = true
        videoRef.current.play()
        setReady(true)
      })
      .catch(() => onClose())
    return () => streamRef.current?.getTracks().forEach(tr => tr.stop())
  }, [])

  async function takeSnapshot() {
    const video = videoRef.current
    const ratio = Math.min(1200 / video.videoWidth, 1200 / video.videoHeight, 1)
    const canvas = document.createElement('canvas')
    canvas.width  = Math.round(video.videoWidth  * ratio)
    canvas.height = Math.round(video.videoHeight * ratio)
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    streamRef.current?.getTracks().forEach(tr => tr.stop())
    canvas.toBlob(blob => {
      const reader = new FileReader()
      reader.onload = e => onCapture(e.target.result.split(',')[1])
      reader.readAsDataURL(blob)
    }, 'image/jpeg', 0.85)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button onClick={() => { streamRef.current?.getTracks().forEach(tr => tr.stop()); onClose() }}
          className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center text-xl">×</button>
        <p className="text-white text-sm font-medium">{t.receiptScan ?? 'Kassenbon scannen'}</p>
        <div className="w-9" />
      </div>
      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} playsInline muted />
        {!ready && <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white/60 text-sm">Kamera wird gestartet…</p>
        </div>}
      </div>
      <div className="px-4 py-4 shrink-0">
        <button onClick={takeSnapshot} disabled={!ready}
          className="w-full py-4 rounded-2xl bg-primary-500 text-white font-semibold text-lg
            flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all">
          📸 {t.barcodeTakePhoto ?? 'Foto aufnehmen'}
        </button>
      </div>
    </div>
  )
}
