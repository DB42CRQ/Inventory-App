import { useState, useRef, useEffect } from 'react'
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
import { useTranslation } from '../../i18n/useTranslation'
import { Button, Input } from '../ui'

export default function AddRecipeModal({ onClose, onSave, uploadImage, categories, initialData }) {
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
  })
  const [ingredients, setIngredients] = useState(
    initialData?.ingredients?.length > 0
      ? initialData.ingredients.map(i => ({ name: i.name || '', quantity: i.quantity ?? '', unit: i.unit || '' }))
      : [{ name: '', quantity: '', unit: '' }]
  )
  const [newCat,     setNewCat]     = useState(false)
  const [showCamera,      setShowCamera]      = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const videoRef    = useRef(null)
  const streamRef   = useRef(null)

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const dataUrl = await new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload = ev => res(ev.target.result)
        reader.onerror = rej
        reader.readAsDataURL(file)
      })
      const base64 = dataUrl.split(',')[1]
      const response = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      applyExtracted(data)
      // Upload image
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
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 text-lg">←</button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">{initialData ? (t.recipesEdit ?? 'Rezept bearbeiten') : (t.recipesAdd ?? 'Rezept hinzufügen')}</h1>
        <Button onClick={handleSave} disabled={loading || !form.name.trim()}>
          {loading ? '…' : (t.save ?? 'Speichern')}
        </Button>
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
        <ImagePicker
          recipeName={form.name}
          currentImage={form.image_url}
          onSelect={(url) => { setForm(f => ({ ...f, image_url: url })); setShowImagePicker(false) }}
          onClose={() => setShowImagePicker(false)}
          uploadImage={uploadImage}
          t={t}
        />
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
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    streamRef.current?.getTracks().forEach(tr => tr.stop())
    canvas.toBlob(async blob => {
      const base64 = await new Promise(res => {
        const reader = new FileReader()
        reader.onload = e => res(e.target.result.split(',')[1])
        reader.readAsDataURL(blob)
      })
      onCapture(base64, blob)
    }, 'image/jpeg', 0.9)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
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
            <button key={i} onClick={() => onSelect(photo.url)}
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
