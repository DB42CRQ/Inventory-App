import { useState, useRef, useEffect } from 'react'
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
import { useTranslation } from '../../i18n/useTranslation'
import { Button, Input } from '../ui'

export default function AddRecipeModal({ onClose, onSave, uploadImage, categories = [], initialData }) {
  const { t, lang } = useTranslation()
  const [mode,       setMode]       = useState('manual') // 'manual' | 'photo' | 'url'
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [form,       setForm]       = useState({
    name:       initialData?.name       || '',
    category:   initialData?.category   || '',
    servings:   initialData?.servings   || 4,
    image_url:  initialData?.image_url  || '',
    source_url: initialData?.source_url || '',
    instructions: initialData?.instructions_de || initialData?.instructions || '',
  })
  const [ingredients, setIngredients] = useState(
    initialData?.ingredients?.length > 0
      ? initialData.ingredients.map(i => ({ name: i.name || '', quantity: i.quantity ?? '', unit: i.unit || '' }))
      : [{ name: '', quantity: '', unit: '' }]
  )
  const [newCat,     setNewCat]     = useState(false)
  const [showCamera,        setShowCamera]        = useState(false)
  const [showImagePicker,   setShowImagePicker]   = useState(false)
  const [showInstructions,  setShowInstructions]  = useState(false)
  const videoRef    = useRef(null)
  const streamRef   = useRef(null)

  async function resizeImage(file, maxPx = 1200, quality = 0.85) {
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
        }, 'image/jpeg', quality)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const base64 = await resizeImage(file)
      const response = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      applyExtracted(data)
      const url = await uploadImage(file)
      if (url) setForm(f => ({ ...f, image_url: url }))
      setMode('manual')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  async function handleUrl() {
    if (!form.source_url) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.source_url })
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      applyExtracted(data)
      setMode('manual')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  function applyExtracted(data) {
    setForm(f => ({
      ...f,
      name: data.name || f.name,
      category: data.category || f.category,
      servings: data.servings || f.servings,
    }))
    if (data.instructions) setForm(f => ({ ...f, instructions: data.instructions }))
    if (data.image_url && typeof data.image_url === 'string') setForm(f => ({ ...f, image_url: data.image_url }))
    if (data.ingredients?.length > 0) {
      setIngredients(data.ingredients.map(i => ({
        name: i.name || '',
        quantity: i.quantity ?? '',
        unit: i.unit || '',
      })))
    }
  }

  function addIngredient() {
    setIngredients(prev => [...prev, { name: '', quantity: '', unit: '' }])
  }

  function removeIngredient(i) {
    setIngredients(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateIngredient(i, field, value) {
    setIngredients(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setLoading(true)

    // Name übersetzen
    let name_de = form.name, name_en = null, name_es = null
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: form.name })
      })
      const data = await res.json()
      name_de = data.de || form.name
      name_en = data.en || null
      name_es = data.es || null
    } catch {}

    // Kategorie übersetzen
    let category_de = form.category || null
    let category_en = null
    let category_es = null
    if (form.category) {
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: form.category })
        })
        const data = await res.json()
        category_de = data.de || form.category
        category_en = data.en || null
        category_es = data.es || null
      } catch {}
    }

    // Zubereitung übersetzen
    let instructions_de = form.instructions || null
    let instructions_en = null
    let instructions_es = null
    if (form.instructions) {
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: form.instructions })
        })
        const data = await res.json()
        instructions_de = data.de || form.instructions
        instructions_en = data.en || null
        instructions_es = data.es || null
      } catch {}
    }

    // Zutaten übersetzen
    const validIngredients = ingredients.filter(i => i.name.trim())
    let translatedIngredients = validIngredients
    if (validIngredients.length > 0) {
      try {
        const res = await fetch('/api/translate-ingredients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredients: validIngredients.map(i => i.name) })
        })
        const data = await res.json()
        if (data.translations) {
          translatedIngredients = validIngredients.map((ing, i) => ({
            ...ing,
            name_de: data.translations[i]?.de || ing.name,
            name_en: data.translations[i]?.en || null,
            name_es: data.translations[i]?.es || null,
          }))
        }
      } catch {}
    }

    // Unsplash Bild holen wenn keins gesetzt
    let image_url = form.image_url
    if (!image_url && form.name) {
      try {
        const imgRes = await fetch('/api/recipe-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: form.name })
        })
        const imgData = await imgRes.json()
        if (imgData.photos?.length > 0) image_url = imgData.photos[0].url
      } catch {}
    }

    await onSave({
      ...form,
      instructions: instructions_de,
      instructions_de,
      instructions_en,
      instructions_es,
      name: name_de,
      name_de,
      name_en,
      name_es,
      image_url,
      category: category_de,
      category_de,
      category_en,
      category_es,
      ingredients: translatedIngredients,
    })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 pb-3 flex items-center gap-3 shrink-0" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 text-lg">←</button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">{initialData ? (t.recipesEdit ?? 'Rezept bearbeiten') : (t.recipesAdd ?? 'Rezept hinzufügen')}</h1>
        <Button onClick={handleSave} disabled={loading || !form.name.trim()}>
          {loading ? '…' : (t.save ?? 'Speichern')}
        </Button>
        <button onClick={() => setShowInstructions(true)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all shrink-0
            ${form.instructions ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          title={t.recipesInstructions ?? 'Zubereitung'}>
          📝
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* Import Methode */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {t.recipesImport ?? 'Rezept importieren (optional)'}
          </p>
          <div className="flex gap-2">
            {isIOS ? (
              <label className="flex-1 py-2.5 rounded-xl border border-dashed border-primary-300
                bg-primary-50 text-primary-600 text-sm font-medium text-center cursor-pointer
                hover:bg-primary-100 transition-all flex items-center justify-center gap-2">
                {loading ? <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /> : '📷'}
                {t.recipesFromPhoto ?? 'Foto'}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} disabled={loading} />
              </label>
            ) : (
              <button onClick={() => setShowCamera(true)} disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-dashed border-primary-300
                  bg-primary-50 text-primary-600 text-sm font-medium text-center
                  hover:bg-primary-100 transition-all flex items-center justify-center gap-2">
                {loading ? <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /> : '📷'}
                {t.recipesFromPhoto ?? 'Foto'}
              </button>
            )}
            <button onClick={() => setMode(mode === 'url' ? 'manual' : 'url')}
              className="flex-1 py-2.5 rounded-xl border border-dashed border-primary-300
                bg-primary-50 text-primary-600 text-sm font-medium hover:bg-primary-100 transition-all">
              🔗 {t.recipesFromUrl ?? 'URL'}
            </button>
          </div>

          {mode === 'url' && (
            <div className="mt-3 flex gap-2">
              <input value={form.source_url}
                onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))}
                placeholder="https://..."
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <button onClick={handleUrl} disabled={loading || !form.source_url}
                className="px-3 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium
                  disabled:opacity-50">
                {loading ? '…' : '→'}
              </button>
            </div>
          )}
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>

        {/* Grunddaten */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
          {/* Bild */}
          <div className="flex gap-3 items-center">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
              {form.image_url
                ? <img src={form.image_url} className="w-full h-full object-cover" alt="" />
                : <span className="text-3xl">🍳</span>
              }
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <button onClick={() => setShowImagePicker(true)}
                className="w-full py-2 rounded-xl border border-dashed border-primary-300
                  bg-primary-50 text-primary-600 text-sm font-medium hover:bg-primary-100 transition-all">
                🖼️ {form.image_url ? (t.recipesChangeImage ?? 'Bild ändern') : (t.recipesChooseImage ?? 'Bild wählen')}
              </button>
              {form.image_url && (
                <button onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                  className="text-xs text-gray-400 hover:text-red-400 transition-all">
                  {t.recipesRemoveImage ?? 'Bild entfernen'}
                </button>
              )}
            </div>
          </div>

          <Input label={t.recipesName ?? 'Name'} value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />

          <div className="flex gap-2">
            {/* Kategorie */}
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-1">
                {t.recipesCategory ?? 'Kategorie'}
              </label>
              {newCat || categories.length === 0 ? (
                <div className="flex gap-1">
                  <input value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder={t.recipesNewCategory ?? 'Neue Kategorie'}
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  {categories.length > 0 && (
                    <button onClick={() => setNewCat(false)} className="text-gray-400 px-2">×</button>
                  )}
                </div>
              ) : (
                <div className="flex gap-1">
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">—</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => { setNewCat(true); setForm(f => ({ ...f, category: '' })) }}
                    className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center text-xl">+</button>
                </div>
              )}
            </div>

            {/* Portionen */}
            <div className="w-24">
              <label className="text-sm font-medium text-gray-700 block mb-1">
                {t.recipesServings ?? 'Portionen'}
              </label>
              <input type="number" min="1" value={form.servings}
                onChange={e => setForm(f => ({ ...f, servings: Number(e.target.value) }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-center
                  focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
        </div>

        {/* Zutaten */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {t.recipesIngredients ?? 'Zutaten'}
          </p>
          <div className="flex flex-col gap-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex flex-col gap-1.5 pb-2 border-b border-gray-50 last:border-0">
                <div className="flex gap-2 items-center">
                  <input value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)}
                    placeholder={t.recipesIngredientName ?? 'Zutat'}
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <button onClick={() => removeIngredient(i)}
                    className="text-gray-300 hover:text-red-400 text-xl leading-none shrink-0">×</button>
                </div>
                <div className="flex gap-2 w-full">
                  <input type="number" value={ing.quantity} onChange={e => updateIngredient(i, 'quantity', e.target.value)}
                    placeholder={t.recipesQty ?? 'Menge'}
                    className="w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-center
                      focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <select value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)}
                    className="w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">—</option>
                    {(lang === 'en'
                      ? ['g','kg','ml','l','tbsp','tsp','piece','pinch','bunch','can','pack','slice','clove','cup']
                      : lang === 'es'
                      ? ['g','kg','ml','l','cda','cdta','pieza','pizca','manojo','lata','paquete','rebanada','diente','taza']
                      : ['g','kg','ml','l','EL','TL','Stück','Prise','Bund','Dose','Packung','Scheibe','Zehe','Becher']
                    ).map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <button onClick={addIngredient}
            className="mt-3 w-full py-2 rounded-xl border border-dashed border-gray-200
              text-sm text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-all">
            + {t.recipesAddIngredient ?? 'Zutat hinzufügen'}
          </button>
        </div>

      </main>

      {showImagePicker && (
        <ImagePickerModal
          recipeName={form.name}
          currentImage={form.image_url}
          onSelect={(url) => { setForm(f => ({ ...f, image_url: url })); setShowImagePicker(false) }}
          onClose={() => setShowImagePicker(false)}
          uploadImage={uploadImage}
          t={t}
        />
      )}

      {showInstructions && (
        <div className="fixed inset-0 z-[60] bg-gray-50 flex flex-col"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-3 px-4 pb-3 bg-white border-b border-gray-100 shrink-0">
            <button onClick={() => setShowInstructions(false)}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 text-lg">←</button>
            <h2 className="font-semibold text-gray-900 flex-1">{t.recipesInstructions ?? 'Zubereitung'}</h2>
            <button onClick={() => setShowInstructions(false)}
              className="px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium">
              {t.done ?? 'Fertig'}
            </button>
          </div>
          <textarea
            value={form.instructions}
            onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
            placeholder={t.recipesInstructionsPlaceholder ?? 'Zubereitungsschritte…'}
            autoFocus
            className="flex-1 px-4 py-4 text-sm text-gray-800 bg-gray-50
              focus:outline-none resize-none leading-relaxed" />
          <p className="text-xs text-gray-400 text-center py-2 shrink-0">
            {t.recipesInstructionsHint ?? 'Jeden Schritt in eine neue Zeile'}
          </p>
        </div>
      )}

      {showCamera && (
        <RecipeCamera
          onCapture={async (base64, blob) => {
            setShowCamera(false)
            setLoading(true)
            setError('')
            try {
              const response = await fetch('/api/extract-recipe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64 })
              })
              const data = await response.json()
              if (data.error) throw new Error(data.error)
              applyExtracted(data)
              const file = new File([blob], 'recipe.jpg', { type: 'image/jpeg' })
              const url = await uploadImage(file)
              if (url) setForm(f => ({ ...f, image_url: url }))
            } catch (err) {
              setError(err.message)
            }
            setLoading(false)
          }}
          onClose={() => setShowCamera(false)}
          t={t}
        />
      )}
    </div>
  )
}

function RecipeCamera({ onCapture, onClose, t }) {
  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const [ready,   setReady]   = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    startCamera()
    return () => streamRef.current?.getTracks().forEach(tr => tr.stop())
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      videoRef.current.playsInline = true
      videoRef.current.muted = true
      await videoRef.current.play()
      setReady(true)
    } catch {
      setError(t.barcodeCameraError ?? 'Kamera konnte nicht gestartet werden.')
    }
  }

  async function takeSnapshot() {
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    // Resize to max 1200px
    const MAX = 1200
    const ratio = Math.min(MAX / video.videoWidth, MAX / video.videoHeight, 1)
    canvas.width  = Math.round(video.videoWidth  * ratio)
    canvas.height = Math.round(video.videoHeight * ratio)
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    streamRef.current?.getTracks().forEach(tr => tr.stop())
    canvas.toBlob(async blob => {
      const base64 = await new Promise(res => {
        const reader = new FileReader()
        reader.onload = e => res(e.target.result.split(',')[1])
        reader.readAsDataURL(blob)
      })
      onCapture(base64, blob)
    }, 'image/jpeg', 0.85)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 pb-3 shrink-0" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
        <button onClick={() => { streamRef.current?.getTracks().forEach(tr => tr.stop()); onClose() }}
          className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center text-xl">×</button>
        <p className="text-white text-sm font-medium">{t.recipesFromPhoto ?? 'Foto aufnehmen'}</p>
        <div className="w-9" />
      </div>
      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          playsInline muted />
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/60 text-sm">{t.barcodeCameraStarting ?? 'Kamera wird gestartet…'}</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-red-400 text-sm text-center px-8">{error}</p>
          </div>
        )}
      </div>
      <div className="px-4 py-4 shrink-0 flex gap-3">
        <label className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center
          text-xl cursor-pointer shrink-0 active:scale-95 transition-all">
          🖼️
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            streamRef.current?.getTracks().forEach(tr => tr.stop())
            // Resize before sending
            const base64 = await new Promise(res => {
              const img = new Image()
              img.onload = () => {
                const ratio = Math.min(1200 / img.width, 1200 / img.height, 1)
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
            onCapture(base64, file)
          }} />
        </label>
        <button onClick={takeSnapshot} disabled={!ready}
          className="flex-1 py-4 rounded-2xl bg-primary-500 text-white font-semibold text-lg
            flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all">
          📸 {t.barcodeTakePhoto ?? 'Foto aufnehmen'}
        </button>
      </div>
    </div>
  )
}

export function ImagePickerModal({ recipeName, currentImage, onSelect, onClose, uploadImage, t }) {
  const [photos,    setPhotos]    = useState([])
  const [loading,   setLoading]   = useState(false)
  const [query,     setQuery]     = useState(recipeName || '')
  const [searched,  setSearched]  = useState(false)

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/recipe-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      const data = await res.json()
      setPhotos(data.photos ?? [])
      setSearched(true)
    } catch {}
    setLoading(false)
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const url = await uploadImage(file)
    if (url) onSelect(url)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 text-lg">←</button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">{t.recipesChooseImage ?? 'Bild wählen'}</h1>
      </header>

      <div className="px-4 py-3 bg-white border-b border-gray-100 shrink-0">
        <div className="flex gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder={t.recipesImageSearch ?? 'Suchbegriff…'}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <button onClick={search} disabled={loading}
            className="px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium disabled:opacity-50">
            {loading ? '…' : '🔍'}
          </button>
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm text-primary-600 cursor-pointer">
          <span>📁 {t.recipesUploadImage ?? 'Eigenes Bild hochladen'}</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {!searched && !loading && (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            {t.recipesImageHint ?? 'Suche nach einem Bild für dein Rezept'}
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && searched && photos.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">{t.noItemsFound ?? 'Keine Ergebnisse'}</p>
        )}
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, i) => (
            <button key={i} onClick={() => {
              onSelect(photo.url)
            }}
              className={`relative rounded-xl overflow-hidden aspect-square
                ${currentImage === photo.url ? 'ring-2 ring-primary-500' : ''}`}>
              <img src={photo.thumb} alt="" className="w-full h-full object-cover" />
              {currentImage === photo.url && (
                <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                  <span className="text-white text-xl">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
        {photos.length > 0 && (
          <p className="text-xs text-gray-400 text-center mt-4">
            Fotos von <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer"
              className="underline">Unsplash</a>
          </p>
        )}
      </main>
    </div>
  )
}

function InstructionsSection({ value, onChange, t }) {
  const [open,       setOpen]       = useState(!!value)
  const [fullscreen, setFullscreen] = useState(false)

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <button onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-all">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {t.recipesInstructions ?? 'Zubereitung'}
            </span>
            {value && <span className="w-2 h-2 rounded-full bg-primary-400" />}
          </div>
          <span className="text-gray-400 text-sm">{open ? '▾' : '▸'}</span>
        </button>
        {open && (
          <div className="px-4 pb-4 border-t border-gray-50">
            <div className="relative mt-3">
              <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={t.recipesInstructionsPlaceholder ?? 'Zubereitungsschritte…'}
                rows={5}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={() => setFullscreen(true)}
                className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-gray-100
                  hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xs transition-all">
                ⤢
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t.recipesInstructionsHint ?? 'Jeden Schritt in eine neue Zeile'}
            </p>
          </div>
        )}
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-[70] bg-gray-50 flex flex-col"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-3 px-4 pb-3 bg-white border-b border-gray-100 shrink-0">
            <button onClick={() => setFullscreen(false)}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 text-lg">←</button>
            <h2 className="font-semibold text-gray-900 flex-1">{t.recipesInstructions ?? 'Zubereitung'}</h2>
            <button onClick={() => setFullscreen(false)}
              className="px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium">
              {t.done ?? 'Fertig'}
            </button>
          </div>
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={t.recipesInstructionsPlaceholder ?? 'Zubereitungsschritte…'}
            autoFocus
            className="flex-1 px-4 py-4 text-sm text-gray-800 bg-gray-50
              focus:outline-none resize-none leading-relaxed" />
          <p className="text-xs text-gray-400 text-center py-2">
            {t.recipesInstructionsHint ?? 'Jeden Schritt in eine neue Zeile'}
          </p>
        </div>
      )}
    </>
  )
}
