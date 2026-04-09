import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

async function trackHistory({ itemId, householdId, profileId, from, to, source = 'manual' }) {
  if (from === to) return // Keine Änderung
  await supabase.from('item_history').insert({
    item_id:       itemId,
    household_id:  householdId,
    profile_id:    profileId,
    quantity_from: from,
    quantity_to:   to,
    source,
  })
}

export function useInventory(householdId, profileId, sendPush) {
  const [items,      setItems]      = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    if (!householdId) return
    fetchAll()

    // Realtime-Subscription für Live-Updates
    const channel = supabase
      .channel('inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items',
          filter: `household_id=eq.${householdId}` }, fetchItems)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories',
          filter: `household_id=eq.${householdId}` }, fetchCategories)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [householdId])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchItems(), fetchCategories()])
    setLoading(false)
  }

  async function fetchItems() {
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('household_id', householdId)
      .order('name')
    setItems(data ?? [])
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('household_id', householdId)
      .order('name')
    setCategories(data ?? [])
  }

  async function addItem({ name, quantity, unit, category_id, min_quantity }) {
    const { error } = await supabase.from('items').insert({
      household_id: householdId,
      name,
      quantity: Number(quantity),
      unit: unit || 'Stück',
      category_id: category_id || null,
      min_quantity: Number(min_quantity ?? 0),
    })
    return { error }
  }

  async function updateQuantity(itemId, newQty) {
    const oldItem = items.find(i => i.id === itemId)
    const safeQty = Math.max(0, newQty)
    // Sofort lokal updaten für flüssige UI
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: safeQty } : i))
    const { error } = await supabase
      .from('items')
      .update({ quantity: safeQty })
      .eq('id', itemId)
    if (error) {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: oldItem?.quantity ?? i.quantity } : i))
    } else if (oldItem) {
      trackHistory({ itemId, householdId, profileId, from: oldItem.quantity, to: safeQty, source: 'manual' })
      // Push wenn Artikel jetzt niedrig ist
      const updatedItem = items.find(i => i.id === itemId)
      if (updatedItem && updatedItem.min_quantity != null && safeQty <= updatedItem.min_quantity) {
        sendPush?.({
          title: '⚠️ Niedriger Bestand',
          body: `${updatedItem.name}: noch ${safeQty} ${updatedItem.unit}`,
        })
      }
    }
    return { error }
  }

  async function updateItem(itemId, fields) {
    const { error } = await supabase
      .from('items')
      .update(fields)
      .eq('id', itemId)
    return { error }
  }

  async function deleteItem(itemId) {
    const { error } = await supabase.from('items').delete().eq('id', itemId)
    if (!error) setItems(prev => prev.filter(i => i.id !== itemId))
    return { error }
  }

  async function addCategory({ name, color, icon, name_en, name_es, name_de }) {
    const { error } = await supabase.from('categories').insert({
      household_id: householdId,
      name,
      color: color || '#6366f1',
      icon: icon || null,
      name_en: name_en || null,
      name_es: name_es || null,
      name_de: name_de || null,
    })
    return { error }
  }

  async function updateCategory(categoryId, fields) {
    const { error } = await supabase.from('categories').update(fields).eq('id', categoryId)
    if (!error) {
      setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...fields } : c))
    }
    return { error }
  }

  async function deleteCategory(categoryId) {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId)
    if (!error) {
      setCategories(prev => prev.filter(c => c.id !== categoryId))
      // Items mit dieser Kategorie auf null setzen
      setItems(prev => prev.map(i => i.category_id === categoryId ? { ...i, category_id: null } : i))
    }
    return { error }
  }

  // Artikel, bei denen quantity < min_quantity
  const lowItems = items.filter(i => i.min_quantity != null && i.quantity <= i.min_quantity)

  return {
    items, categories, loading, lowItems,
    addItem, updateQuantity, updateItem, deleteItem,
    addCategory, updateCategory, deleteCategory,
  }
}
