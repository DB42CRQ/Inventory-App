import { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { useRecipes } from '../../hooks/useRecipes'
import { Button } from '../ui'
import AddRecipeModal from './AddRecipeModal'
import RecipeDetail from './RecipeDetail'


function CategoryManager({ categories, recipes, onRename, onDelete, onClose, t }) {
  const [editing, setEditing] = useState(null)
  const [newName, setNewName] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleRename(cat) {
    if (!newName.trim() || newName === cat) { setEditing(null); return }
    setLoading(true)
    await onRename(cat, newName.trim())
    setEditing(null)
    setLoading(false)
  }

  async function handleDelete(cat) {
    setLoading(true)
    await onDelete(cat)
    setConfirm(null)
    setLoading(false)
  }

  const count = (cat) => recipes.filter(r => r.category === cat).length

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t.recipesCatMgr ?? 'Kategorien verwalten'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-2 max-h-80 overflow-y-auto">
          {categories.map(cat => (
            <div key={cat} className="flex items-center gap-2">
              {editing === cat ? (
                <div className="flex-1 flex gap-2">
                  <input value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRename(cat)}
                    autoFocus
                    className="flex-1 rounded-xl border border-primary-300 px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <button onClick={() => handleRename(cat)} disabled={loading}
                    className="px-3 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium">✓</button>
                  <button onClick={() => setEditing(null)}
                    className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm">×</button>
                </div>
              ) : confirm === cat ? (
                <div className="flex-1 flex items-center gap-2">
                  <span className="flex-1 text-sm text-gray-700">{cat}</span>
                  <span className="text-xs text-gray-400">{t.deleteConfirm ?? 'Löschen?'}</span>
                  <button onClick={() => handleDelete(cat)} disabled={loading}
                    className="text-xs text-red-500 font-medium">{t.yes ?? 'Ja'}</button>
                  <button onClick={() => setConfirm(null)}
                    className="text-xs text-gray-400">{t.no ?? 'Nein'}</button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-800">{cat}</span>
                  <span className="text-xs text-gray-400">{count(cat)}</span>
                  <button onClick={() => { setEditing(cat); setNewName(cat) }}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm flex items-center justify-center">✏️</button>
                  <button onClick={() => setConfirm(cat)}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-400 text-sm flex items-center justify-center">×</button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}



export default function RecipePage({ onClose, household, inventoryItems, addToShoppingList }) {
  const { t, lang } = useTranslation()

  function getCatName(recipe) {
    if (lang === 'en' && recipe.category_en) return recipe.category_en
    if (lang === 'es' && recipe.category_es) return recipe.category_es
    return recipe.category_de || recipe.category || ''
  }

  function getIngName(ing) {
    if (lang === 'en' && ing.name_en) return ing.name_en
    if (lang === 'es' && ing.name_es) return ing.name_es
    return ing.name_de || ing.name || ''
  }

  function getRecipeName(r) {
    if (lang === 'en' && r.name_en) return r.name_en
    if (lang === 'es' && r.name_es) return r.name_es
    return r.name_de || r.name || ''
  }
  const { recipes, loading, addRecipe, updateRecipe, deleteRecipe, uploadImage } = useRecipes(household?.id)
  const [showAdd,   setShowAdd]   = useState(false)
  const [selected,  setSelected]  = useState(null)
  const [filterCat,   setFilterCat]   = useState('')
  const [showFilter,   setShowFilter]   = useState(false)
  const [showCatMgr,   setShowCatMgr]   = useState(false)
  const [filterIngr,   setFilterIngr]   = useState('')

  const categories = [...new Set(recipes.map(r => getCatName(r)).filter(Boolean))]
  const filtered = recipes.filter(r => {
    if (filterCat && getCatName(r) !== filterCat) return false
    if (filterIngr) {
      const lower = filterIngr.toLowerCase()
      // Search in recipe name
      if (getRecipeName(r).toLowerCase().includes(lower)) return true
      // Search in translated ingredient names
      return r.recipe_ingredients?.some(i => getIngName(i).toLowerCase().includes(lower))
    }
    return true
  })

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all
            flex items-center justify-center text-gray-600 text-lg">←</button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">🍳 {t.recipesTitle ?? 'Rezepte'}</h1>
        <button onClick={() => setShowFilter(!showFilter)}
          className={`w-9 h-9 rounded-xl transition-all flex items-center justify-center text-lg
            ${filterIngr ? 'bg-primary-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
          🔍
        </button>
        <button onClick={() => setShowCatMgr(true)}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all
            flex items-center justify-center text-lg">
          🏷️
        </button>
        <button onClick={() => setShowAdd(true)}
          className="w-9 h-9 rounded-xl bg-primary-500 hover:bg-primary-600 transition-all
            flex items-center justify-center text-white text-xl font-bold">+</button>
      </header>

      {showFilter && (
        <div className="bg-white border-b border-gray-100 px-4 py-2 shrink-0">
          <input value={filterIngr} onChange={e => setFilterIngr(e.target.value)}
            placeholder={t.recipesFilterIngr ?? 'Nach Zutat filtern…'}
            autoFocus
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      )}

      {categories.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto shrink-0">
          <button onClick={() => setFilterCat('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
              ${!filterCat ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {t.all ?? 'Alle'}
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat === filterCat ? '' : cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                ${filterCat === cat ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3 text-center">
            <span className="text-5xl">🍳</span>
            <p className="font-medium text-gray-700">{t.recipesEmpty ?? 'Noch keine Rezepte'}</p>
            <p className="text-sm text-gray-400">{t.recipesEmptyHint ?? 'Füge dein erstes Rezept hinzu'}</p>
            <Button onClick={() => setShowAdd(true)}>+ {t.recipesAdd ?? 'Rezept hinzufügen'}</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(recipe => (
              <button key={recipe.id} onClick={() => setSelected(recipe)}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden
                  hover:border-primary-200 hover:shadow-sm transition-all text-left">
                {recipe.image_url ? (
                  <img src={recipe.image_url} alt={recipe.name} className="w-full h-28 object-cover" />
                ) : (
                  <div className="w-full h-28 bg-gradient-to-br from-primary-50 to-primary-100
                    flex items-center justify-center text-4xl">🍳</div>
                )}
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2">{getRecipeName(recipe)}</p>
                  {getCatName(recipe) && <p className="text-xs text-primary-500 mt-1">{getCatName(recipe)}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {recipe.recipe_ingredients?.length ?? 0} {t.recipesIngredients ?? 'Zutaten'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {showCatMgr && (
        <CategoryManager
          categories={categories}
          recipes={recipes}
          onRename={async (oldCat, newCat) => {
            // Translate new category name
            let category_de = newCat, category_en = null, category_es = null
            try {
              const res = await fetch('/api/translate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newCat })
              })
              const data = await res.json()
              // category_de bleibt das Original
              category_en = data.en || null
              category_es = data.es || null
            } catch {}
            for (const r of recipes.filter(r => getCatName(r) === oldCat)) {
              await updateRecipe(r.id, { ...r, ingredients: r.recipe_ingredients, category: category_de, category_de, category_en, category_es })
            }
          }}
          onDelete={async (cat) => {
            for (const r of recipes.filter(r => getCatName(r) === cat)) {
              await updateRecipe(r.id, { ...r, ingredients: r.recipe_ingredients, category: null, category_de: null, category_en: null, category_es: null })
            }
          }}
          onClose={() => setShowCatMgr(false)}
          t={t}
        />
      )}

      {showAdd && (
        <AddRecipeModal
          onClose={() => setShowAdd(false)}
          onSave={async (data) => { await addRecipe(data); setShowAdd(false) }}
          uploadImage={uploadImage}
          categories={categories}
        />
      )}

      {selected && (
        <RecipeDetail
          recipe={selected}
          onClose={() => setSelected(null)}
          onDelete={async () => { await deleteRecipe(selected.id); setSelected(null) }}
          onUpdate={async (data) => {
            const updated = await updateRecipe(selected.id, data)
            if (updated) setSelected(updated)
            else setSelected(null)
          }}
          inventoryItems={inventoryItems}
          addToShoppingList={addToShoppingList}
          uploadImage={uploadImage}
          categories={categories}
        />
      )}
    </div>
  )
}
