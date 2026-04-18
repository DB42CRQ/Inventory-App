import { useState, useEffect } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { useAuth } from '../../hooks/useAuth'
import { useHousehold } from '../../hooks/useHousehold'
import { useRecipes } from '../../hooks/useRecipes'

export default function RecipeSharePage({ token, onClose }) {
  const { t, lang } = useTranslation()
  const { user } = useAuth()
  const { household } = useHousehold()
  const { addRecipe } = useRecipes(household?.id)
  const [recipe,    setRecipe]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [importing, setImporting] = useState(false)
  const [imported,  setImported]  = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    fetchRecipe()
  }, [token])

  async function fetchRecipe() {
    try {
      const res = await fetch(`/api/recipe-share?token=${token}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setRecipe(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
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

  function getInstructions(r) {
    if (lang === 'en' && r.instructions_en) return r.instructions_en
    if (lang === 'es' && r.instructions_es) return r.instructions_es
    return r.instructions_de || r.instructions || null
  }

  function getCatName(r) {
    if (lang === 'en' && r.category_en) return r.category_en
    if (lang === 'es' && r.category_es) return r.category_es
    return r.category_de || r.category || ''
  }

  async function handleImport() {
    if (!user || !household) return
    setImporting(true)
    try {
      await addRecipe({
        name: recipe.name,
        name_de: recipe.name_de,
        name_en: recipe.name_en,
        name_es: recipe.name_es,
        category: recipe.category,
        category_de: recipe.category_de,
        category_en: recipe.category_en,
        category_es: recipe.category_es,
        image_url: recipe.image_url,
        source_url: recipe.source_url,
        servings: recipe.servings,
        instructions: recipe.instructions,
        instructions_de: recipe.instructions_de,
        instructions_en: recipe.instructions_en,
        instructions_es: recipe.instructions_es,
        ingredients: recipe.recipe_ingredients?.map(i => ({
          name: i.name,
          name_de: i.name_de,
          name_en: i.name_en,
          name_es: i.name_es,
          quantity: i.quantity,
          unit: i.unit,
        }))
      })
      setImported(true)
    } catch (err) {
      setError(err.message)
    }
    setImporting(false)
  }

  if (loading) return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col items-center justify-center gap-4 px-8">
      <span className="text-5xl">😕</span>
      <p className="text-gray-700 font-medium text-center">{t.recipeShareNotFound ?? 'Rezept nicht gefunden'}</p>
      <p className="text-gray-400 text-sm text-center">{t.recipeShareExpired ?? 'Der Link ist ungültig oder abgelaufen.'}</p>
      {onClose && <button onClick={onClose} className="text-primary-500 text-sm">{t.back ?? 'Zurück'}</button>}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 pb-3 flex items-center gap-3 shrink-0"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        {onClose && (
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 text-lg">←</button>
        )}
        <h1 className="font-bold text-gray-900 text-lg flex-1 truncate">{getRecipeName(recipe)}</h1>
      </header>

      <main className="flex-1 overflow-y-auto">
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
              <span className="text-sm text-gray-500">👤 {recipe.servings} {t.recipesServings ?? 'Portionen'}</span>
            )}
          </div>

          {/* Import Button */}
          {user && household ? (
            <button onClick={handleImport} disabled={importing || imported}
              className={`w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2
                ${imported ? 'bg-green-500 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'}
                disabled:opacity-70 transition-all`}>
              {importing ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t.recipeImporting ?? 'Wird importiert…'}</>
              ) : imported ? (
                <>✅ {t.recipeImported ?? 'Importiert!'}</>
              ) : (
                <>📥 {t.recipeImport ?? 'In meinen Haushalt importieren'}</>
              )}
            </button>
          ) : (
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-sm text-primary-700 text-center">
              {t.recipeShareLoginHint ?? 'Melde dich an um dieses Rezept zu importieren.'}
            </div>
          )}

          {/* Zutaten */}
          {recipe.recipe_ingredients?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-4 pb-2">
                {t.recipesIngredients ?? 'Zutaten'}
              </p>
              {recipe.recipe_ingredients.map((ing, i) => (
                <div key={i}
                  className={`flex items-center gap-3 px-4 py-3
                    ${i < recipe.recipe_ingredients.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                  <span className="flex-1 text-sm text-gray-800">{getIngName(ing)}</span>
                  <span className="text-sm text-gray-400 shrink-0">
                    {ing.quantity ? `${ing.quantity} ${ing.unit || ''}` : ing.unit || ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

          {/* Zubereitung */}
          {getInstructions(recipe) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mx-4 mb-4">
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
      </main>
    </div>
  )
}
