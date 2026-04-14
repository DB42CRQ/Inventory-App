import { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { useRecipes } from '../../hooks/useRecipes'
import { Button } from '../ui'
import AddRecipeModal from './AddRecipeModal'
import RecipeDetail from './RecipeDetail'

export default function RecipePage({ onClose, household, inventoryItems, addToShoppingList }) {
  const { t } = useTranslation()
  const { recipes, loading, addRecipe, updateRecipe, deleteRecipe, uploadImage } = useRecipes(household?.id)
  const [showAdd,   setShowAdd]   = useState(false)
  const [selected,  setSelected]  = useState(null)
  const [filterCat, setFilterCat] = useState('')

  const categories = [...new Set(recipes.map(r => r.category).filter(Boolean))]
  const filtered = filterCat ? recipes.filter(r => r.category === filterCat) : recipes

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all
            flex items-center justify-center text-gray-600 text-lg">←</button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">🍳 {t.recipesTitle ?? 'Rezepte'}</h1>
        <button onClick={() => setShowAdd(true)}
          className="w-9 h-9 rounded-xl bg-primary-500 hover:bg-primary-600 transition-all
            flex items-center justify-center text-white text-xl font-bold">+</button>
      </header>

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
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2">{recipe.name}</p>
                  {recipe.category && <p className="text-xs text-primary-500 mt-1">{recipe.category}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {recipe.recipe_ingredients?.length ?? 0} {t.recipesIngredients ?? 'Zutaten'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

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
          onUpdate={async (data) => { await updateRecipe(selected.id, data); setSelected(null) }}
          inventoryItems={inventoryItems}
          addToShoppingList={addToShoppingList}
          uploadImage={uploadImage}
          categories={categories}
        />
      )}
    </div>
  )
}
