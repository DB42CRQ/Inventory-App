import { useState, lazy, Suspense } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { Button } from '../ui'
import AddRecipeModal from './AddRecipeModal'
import { ImagePickerModal } from './AddRecipeModal'

export default function RecipeDetail({ recipe, onClose, onDelete, onUpdate, inventoryItems, addToShoppingList, uploadImage, categories }) {
  const { t, lang } = useTranslation()

  function getCatName(r) {
    if (lang === 'en' && r.category_en) return r.category_en
    if (lang === 'es' && r.category_es) return r.category_es
    return r.category_de || r.category || ''
  }

  function getInstructions(r) {
    if (lang === 'en' && r.instructions_en) return r.instructions_en
    if (lang === 'es' && r.instructions_es) return r.instructions_es
    return r.instructions_de || r.instructions || null
  }

  function getIngName(ing) {
    if (lang === 'en' && ing.name_en) return ing.name_en
    if (lang === 'es' && ing.name_es) return ing.name_es
    return ing.name_de || ing.name || ''
  }
  const [confirm,      setConfirm]      = useState(false)
  const [showEdit,     setShowEdit]     = useState(false)
  const [showImgPicker, setShowImgPicker] = useState(false)
  const [adding,    setAdding]    = useState(false)
  const [added,     setAdded]     = useState(false)
  const [sharing,   setSharing]   = useState(false)
  const [shared,    setShared]    = useState(false)


  // Check which ingredients are already in inventory
  function getInventoryMatch(ing) {
    const ingLower = getIngName(ing).toLowerCase()
    return inventoryItems?.find(item => {
      const itemLower = item.name.toLowerCase()
      // Exact match
      if (itemLower === ingLower) return true
      // Inventory name is contained in ingredient name (e.g. "Mehl" in "Weizenmehl")
      if (ingLower.includes(itemLower) && itemLower.length > 3) return true
      return false
    })
  }

  // Initialize checkedOff based on inventory match
  const [checkedOff, setCheckedOff] = useState(() => new Set(
    (recipe.recipe_ingredients || [])
      .filter(i => !!inventoryItems?.find(item => {
        const ingLower = getIngName(i).toLowerCase()
        const itemLower = item.name.toLowerCase()
        return itemLower === ingLower || (ingLower.includes(itemLower) && itemLower.length > 3)
      }))
      .map(i => i.id)
  ))

  async function handleShare() {
    setSharing(true)
    try {
      // Generate token if not exists
      let token = recipe.share_token
      if (!token) {
        const res = await fetch('/api/recipe-share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipe_id: recipe.id })
        })
        const data = await res.json()
        token = data.token
      }
      const url = `${window.location.origin}/recipe/${token}`
      await navigator.clipboard.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 3000)
    } catch {}
    setSharing(false)
  }

  function toggleIngredient(id) {
    setCheckedOff(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toAdd = recipe.recipe_ingredients?.filter(i => !checkedOff.has(i.id)) ?? []

  async function addMissingToList() {
    setAdding(true)
    for (const ing of toAdd) {
      await addToShoppingList({
        name: ing.name,
        quantity: ing.quantity || 1,
        unit: ing.unit || 'Stück',
        item_id: null,
      })
    }
    setAdding(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 text-lg">←</button>
        <h1 className="font-bold text-gray-900 text-lg flex-1 truncate">{recipe.name}</h1>
        <button onClick={handleShare} disabled={sharing}
          className={`w-9 h-9 rounded-xl transition-all flex items-center justify-center text-sm
            ${shared ? 'bg-green-100 text-green-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
          {shared ? '✓' : '🔗'}
        </button>
        <button onClick={() => setShowEdit(true)}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all
            flex items-center justify-center text-gray-600 text-sm">✏️</button>
        {!confirm ? (
          <button onClick={() => setConfirm(true)}
            className="text-gray-300 hover:text-red-400 text-2xl leading-none">🗑</button>
        ) : (
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-500">{t.deleteConfirm ?? 'Löschen?'}</span>
            <button onClick={onDelete} className="text-xs text-red-500 font-medium">{t.yes ?? 'Ja'}</button>
            <button onClick={() => setConfirm(false)} className="text-xs text-gray-400">{t.no ?? 'Nein'}</button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto">
        {/* Bild */}
        <div className="relative">
          {recipe.image_url
            ? <img src={recipe.image_url} alt={recipe.name} className="w-full h-52 object-cover" />
            : <div className="w-full h-36 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-5xl">🍳</div>
          }
          <button onClick={() => setShowImgPicker(true)}
            className="absolute bottom-2 right-2 px-3 py-1.5 rounded-xl bg-black/50 text-white
              text-xs font-medium hover:bg-black/70 transition-all">
            🖼️ {t.recipesChangeImage ?? 'Bild ändern'}
          </button>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Meta */}
          <div className="flex items-center gap-3 flex-wrap">
            {getCatName(recipe) && (
              <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-medium">
                {getCatName(recipe)}
              </span>
            )}
            {recipe.servings && (
              <span className="text-sm text-gray-500">
                👤 {recipe.servings} {t.recipesServings ?? 'Portionen'}
              </span>
            )}
            {recipe.source_url && (
              <a href={recipe.source_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary-500 hover:underline">
                🔗 {t.recipesSource ?? 'Quelle'}
              </a>
            )}
          </div>

          {/* Einkaufsliste Button */}
          {toAdd.length > 0 && (
            <button onClick={addMissingToList} disabled={adding || added}
              className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all
                flex items-center justify-center gap-2
                ${added ? 'bg-green-500 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'}
                disabled:opacity-70`}>
              {adding ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t.recipesAdding ?? 'Wird hinzugefügt…'}</>
              ) : added ? (
                <>✅ {t.recipesAddedToList ?? 'Zur Einkaufsliste hinzugefügt!'}</>
              ) : (
                <>🛒 {toAdd.length} {t.recipesMissingToList ?? 'Zutaten auf die Liste'}</>
              )}
            </button>
          )}

          {toAdd.length === 0 && recipe.recipe_ingredients?.length > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 text-sm text-green-700 text-center">
              ✅ {t.recipesAllAvailable ?? 'Alle Zutaten sind im Inventar vorhanden!'}
            </div>
          )}

          {/* Zutaten */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-4 pb-2">
              {t.recipesIngredients ?? 'Zutaten'}
            </p>
            {recipe.recipe_ingredients?.map((ing, i) => {
              const isChecked = checkedOff.has(ing.id)
              return (
                <button key={ing.id || i} onClick={() => toggleIngredient(ing.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all
                    ${i < recipe.recipe_ingredients.length - 1 ? 'border-b border-gray-50' : ''}
                    hover:bg-gray-50 active:bg-gray-100`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 transition-all
                    ${isChecked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {isChecked ? '✓' : '○'}
                  </span>
                  <span className="flex-1 text-sm text-gray-800">
                    {getIngName(ing)}
                  </span>
                  <span className="text-sm text-gray-400 shrink-0">
                    {ing.quantity ? `${ing.quantity} ${ing.unit || ''}` : ing.unit || ''}
                  </span>
                </button>
              )
            })}
            <p className="text-xs text-gray-400 px-4 py-2 border-t border-gray-50">
              {t.recipesIngredientHint ?? 'Tippe zum An-/Abhaken'}
            </p>
          </div>

          {/* Zubereitung */}
          {getInstructions(recipe) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                {t.recipesInstructions ?? 'Zubereitung'}
              </p>
              <div className="flex flex-col gap-3">
                {getInstructions(recipe).split('\n').filter(s => s.trim()).map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full
                      flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed flex-1">{step.trim()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

    {showImgPicker && (
        <ImagePickerModal
          recipeName={recipe.name}
          currentImage={recipe.image_url}
          onSelect={async (url) => {
            await onUpdate({ ...recipe, image_url: url, ingredients: recipe.recipe_ingredients })
            setShowImgPicker(false)
          }}
          onClose={() => setShowImgPicker(false)}
          uploadImage={uploadImage}
          t={t}
        />
      )}

    {showEdit && (
        <AddRecipeModal
          onClose={() => setShowEdit(false)}
          onSave={async (data) => { await onUpdate(data); setShowEdit(false) }}
          uploadImage={uploadImage}
          categories={categories}
          initialData={{ ...recipe, ingredients: recipe.recipe_ingredients }}
        />
      )}
    </div>
  )
}
