import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useRecipes(householdId) {
  const { user } = useAuth()
  const [recipes,  setRecipes]  = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!householdId) return
    fetchRecipes()
  }, [householdId])

  async function fetchRecipes() {
    setLoading(true)
    const { data } = await supabase
      .from('recipes')
      .select('*, recipe_ingredients(*)')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })
    setRecipes(data ?? [])
    setLoading(false)
  }

  async function addRecipe({ name, name_de, name_en, name_es, category, category_de, category_en, category_es, image_url, source_url, servings, instructions, instructions_de, instructions_en, instructions_es, ingredients }) {
    const { data, error } = await supabase
      .from('recipes')
      .insert({ household_id: householdId, name: name_de || name, name_de: name_de || null, name_en: name_en || null, name_es: name_es || null, category: category || null, category_de: category_de || null, category_en: category_en || null, category_es: category_es || null, image_url: image_url || null, source_url: source_url || null, servings: servings || 4, instructions: instructions_de || instructions || null, instructions_de: instructions_de || null, instructions_en: instructions_en || null, instructions_es: instructions_es || null, created_by: user.id })
      .select()
      .single()
    if (error || !data) return { error }

    if (ingredients?.length > 0) {
      await supabase.from('recipe_ingredients').insert(
        ingredients.map(i => ({ recipe_id: data.id, name: i.name, name_de: i.name_de || null, name_en: i.name_en || null, name_es: i.name_es || null, quantity: i.quantity || null, unit: i.unit || null, item_id: i.item_id || null }))
      )
    }
    await fetchRecipes()
    return { error: null, id: data.id }
  }

  async function updateRecipe(id, { name, name_de, name_en, name_es, category, category_de, category_en, category_es, servings, image_url, source_url, instructions, instructions_de, instructions_en, instructions_es, ingredients }) {
    console.log('[updateRecipe] id:', id, 'image_url:', image_url?.slice(0, 60))
    const { error } = await supabase.from('recipes').update({
      name: name_de || name,
      name_de: name_de || null, name_en: name_en || null, name_es: name_es || null,
      category: category || null, category_de: category_de || null, category_en: category_en || null, category_es: category_es || null,
      servings,
      image_url: image_url || null,
      source_url: source_url || null,
      instructions: instructions_de || instructions || null,
      instructions_de: instructions_de || null, instructions_en: instructions_en || null, instructions_es: instructions_es || null,
    }).eq('id', id)
    console.log('[updateRecipe] DB error:', error?.message ?? 'none')
    if (ingredients) {
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', id)
      if (ingredients.length > 0) {
        await supabase.from('recipe_ingredients').insert(
          ingredients.map(i => ({ recipe_id: id, name: i.name, name_de: i.name_de || null, name_en: i.name_en || null, name_es: i.name_es || null, quantity: i.quantity || null, unit: i.unit || null, item_id: i.item_id || null }))
        )
      }
    }
    await fetchRecipes()
    const { data: updated, error: fetchError } = await supabase.from('recipes').select('*, recipe_ingredients(*)').eq('id', id).single()
    console.log('[updateRecipe] fetched updated image_url:', updated?.image_url?.slice(0, 60), 'fetchError:', fetchError?.message)
    return updated
  }

  async function deleteRecipe(id) {
    await supabase.from('recipes').delete().eq('id', id)
    setRecipes(prev => prev.filter(r => r.id !== id))
  }

  async function uploadImage(file) {
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('recipe-images').upload(path, file)
    if (error) return null
    const { data } = supabase.storage.from('recipe-images').getPublicUrl(path)
    return data.publicUrl
  }

  return { recipes, loading, addRecipe, updateRecipe, deleteRecipe, uploadImage, fetchRecipes }
}
