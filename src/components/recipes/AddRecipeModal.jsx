import { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { Button, Input } from '../ui'

export default function AddRecipeModal({ onClose, onSave, uploadImage, categories }) {
  const { t } = useTranslation()
  const [mode,       setMode]       = useState('manual') // 'manual' | 'photo' | 'url'
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [form,       setForm]       = useState({ name: '', category: '', servings: 4, image_url: '', source_url: '' })
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '', unit: '' }])
  const [newCat,     setNewCat]     = useState(false)

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
    await onSave({
      ...form,
      ingredients: ingredients.filter(i => i.name.trim()),
    })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 text-lg">←</button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">{t.recipesAdd ?? 'Rezept hinzufügen'}</h1>
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
            <label className="flex-1 py-2.5 rounded-xl border border-dashed border-primary-300
              bg-primary-50 text-primary-600 text-sm font-medium text-center cursor-pointer
              hover:bg-primary-100 transition-all flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /> : '📷'}
              {t.recipesFromPhoto ?? 'Foto'}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={loading} />
            </label>
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
                <div className="flex gap-2">
                  <input type="number" value={ing.quantity} onChange={e => updateIngredient(i, 'quantity', e.target.value)}
                    placeholder={t.recipesQty ?? 'Menge'}
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-center
                      focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <input value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)}
                    placeholder={t.recipesUnit ?? 'Einheit'}
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500" />
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
    </div>
  )
}
