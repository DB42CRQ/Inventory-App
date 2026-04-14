import { useState, lazy, Suspense } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { Button } from '../ui'
import AddRecipeModal from './AddRecipeModal'

export default function RecipeDetail({ recipe, onClose, onDelete, onUpdate, inventoryItems, addToShoppingList, uploadImage, categories }) {
  const { t, lang } = useTranslation()

  function getCatName(r) {
    if (lang === 'en' && r.category_en) return r.category_en
    if (lang === 'es' && r.category_es) return r.category_es
    return r.category_de || r.category || ''
  }
  const [confirm,   setConfirm]   = useState(false)
  const [showEdit,   setShowEdit]   = useState(false)
  const [adding,    setAdding]    = useState(false)
  const [added,     setAdded]     = useState(false)

  // Check which ingredients are already in inventory
  function getInventoryMatch(ingredientName) {
    const lower = ingredientName.toLowerCase()
    return inventoryItems?.find(item =>
      item.name.toLowerCase() === lower ||
      item.name.toLowerCase().includes(lower) ||
      lower.includes(item.name.toLowerCase())
    )
  }

  const missing = recipe.recipe_ingredients?.filter(i => !getInventoryMatch(i.name)) ?? []
  const available = recipe.recipe_ingredients?.filter(i => getInventoryMatch(i.name)) ?? []

  async function addMissingToList() {
    setAdding(true)
    for (const ing of missing) {
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
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 text-lg">←</button>
        <h1 className="font-bold text-gray-900 text-lg flex-1 truncate">{recipe.name}</h1>
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
        {recipe.image_url && (
          <img src={recipe.image_url} alt={recipe.name} className="w-full h-52 object-cover" />
        )}

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
          {missing.length > 0 && (
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
                <>🛒 {missing.length} {t.recipesMissingToList ?? 'fehlende Zutaten auf die Liste'}</>
              )}
            </button>
          )}

          {missing.length === 0 && recipe.recipe_ingredients?.length > 0 && (
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
              const match = getInventoryMatch(ing.name)
              return (
                <div key={i}
                  className={`flex items-center gap-3 px-4 py-3
                    ${i < recipe.recipe_ingredients.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0
                    ${match ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {match ? '✓' : '○'}
                  </span>
                  <span className="flex-1 text-sm text-gray-800">{ing.name}</span>
                  <span className="text-sm text-gray-400">
                    {ing.quantity ? `${ing.quantity} ${ing.unit || ''}` : ing.unit || ''}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </main>
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
