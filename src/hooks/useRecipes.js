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

  async function addRecipe({ name, category, image_url, source_url, servings, ingredients }) {
    const { data, error } = await supabase
      .from('recipes')
      .insert({ household_id: householdId, name, category: category || null, image_url: image_url || null, source_url: source_url || null, servings: servings || 4, created_by: user.id })
      .select()
      .single()
    if (error || !data) return { error }

    if (ingredients?.length > 0) {
      await supabase.from('recipe_ingredients').insert(
        ingredients.map(i => ({ recipe_id: data.id, name: i.name, quantity: i.quantity || null, unit: i.unit || null, item_id: i.item_id || null }))
      )
    }
    await fetchRecipes()
    return { error: null, id: data.id }
  }

  async function updateRecipe(id, { name, category, servings, ingredients }) {
    await supabase.from('recipes').update({ name, category: category || null, servings }).eq('id', id)
    if (ingredients) {
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', id)
      if (ingredients.length > 0) {
        await supabase.from('recipe_ingredients').insert(
          ingredients.map(i => ({ recipe_id: id, name: i.name, quantity: i.quantity || null, unit: i.unit || null, item_id: i.item_id || null }))
        )
      }
    }
    await fetchRecipes()
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
