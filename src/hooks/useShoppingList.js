import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useShoppingList(householdId) {
  const { user } = useAuth()
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!householdId) return
    fetchItems()

    const channel = supabase
      .channel('shopping_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list',
          filter: `household_id=eq.${householdId}` }, fetchItems)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [householdId])

  async function fetchItems() {
    const { data } = await supabase
      .from('shopping_list')
      .select('*, profiles(display_name)')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true })
    setItems(data ?? [])
    setLoading(false)
  }

  async function addItem({ name, quantity, unit, item_id }) {
    // Prüfen ob Artikel schon auf der Liste
    const exists = items.find(i => i.item_id === item_id && !i.checked)
    if (exists) return { error: null, alreadyExists: true }

    const { error } = await supabase.from('shopping_list').insert({
      household_id: householdId,
      item_id:      item_id || null,
      name,
      quantity:     Number(quantity) || 1,
      unit:         unit || 'Stück',
      added_by:     user.id,
    })
    return { error }
  }

  async function addLowItems(lowItems) {
    const toAdd = lowItems.filter(item =>
      !items.find(i => i.item_id === item.id && !i.checked)
    )
    if (toAdd.length === 0) return { count: 0 }
    const { error } = await supabase.from('shopping_list').insert(
      toAdd.map(item => ({
        household_id: householdId,
        item_id:      item.id,
        name:         item.name,
        quantity:     1,
        unit:         item.unit,
        added_by:     user.id,
      }))
    )
    return { error, count: toAdd.length }
  }

  async function checkItem(listItemId, purchasedQty, inventoryItemId) {
    // Bestand aktualisieren wenn mit Inventar verknüpft
    if (inventoryItemId && purchasedQty > 0) {
      const { data: invItem } = await supabase
        .from('items').select('quantity').eq('id', inventoryItemId).single()
      if (invItem) {
        await supabase.from('items')
          .update({ quantity: invItem.quantity + Number(purchasedQty) })
          .eq('id', inventoryItemId)
      }
    }
    // Als erledigt markieren
    const { error } = await supabase
      .from('shopping_list')
      .update({ checked: true, quantity: Number(purchasedQty) || 0 })
      .eq('id', listItemId)
    return { error }
  }

  async function uncheckItem(listItemId, inventoryItemId, originalQty) {
    // Bestand zurücksetzen
    if (inventoryItemId && originalQty > 0) {
      const { data: invItem } = await supabase
        .from('items').select('quantity').eq('id', inventoryItemId).single()
      if (invItem) {
        await supabase.from('items')
          .update({ quantity: Math.max(0, invItem.quantity - Number(originalQty)) })
          .eq('id', inventoryItemId)
      }
    }
    const { error } = await supabase
      .from('shopping_list').update({ checked: false }).eq('id', listItemId)
    return { error }
  }

  async function removeItem(listItemId) {
    const { error } = await supabase.from('shopping_list').delete().eq('id', listItemId)
    if (!error) setItems(prev => prev.filter(i => i.id !== listItemId))
    return { error }
  }

  async function clearChecked() {
    const checkedIds = items.filter(i => i.checked).map(i => i.id)
    if (checkedIds.length === 0) return
    await supabase.from('shopping_list').delete().in('id', checkedIds)
    setItems(prev => prev.filter(i => !i.checked))
  }

  const unchecked = items.filter(i => !i.checked)
  const checked   = items.filter(i => i.checked)

  return { items, unchecked, checked, loading,
    addItem, addLowItems, checkItem, uncheckItem, removeItem, clearChecked }
}
