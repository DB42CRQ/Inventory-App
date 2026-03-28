import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const STORAGE_KEY = 'active_household_id'

export function useHousehold() {
  const { user } = useAuth()
  const [household,   setHousehold]   = useState(null)
  const [households,  setHouseholds]  = useState([])
  const [members,     setMembers]     = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!user) {
      setHousehold(null)
      setHouseholds([])
      setLoading(false)
      return
    }
    fetchHouseholds()
  }, [user])

  async function fetchHouseholds() {
    setLoading(true)

    // Nur Haushalte laden wo der aktuelle User wirklich Mitglied ist
    const { data } = await supabase
      .from('household_members')
      .select('household_id, role, households(id, name, created_at)')
      .eq('profile_id', user.id)

    if (!data || data.length === 0) {
      // Kein Haushalt — localStorage leeren damit kein alter Wert stört
      localStorage.removeItem(STORAGE_KEY)
      setHousehold(null)
      setHouseholds([])
      setLoading(false)
      return
    }

    const list = data.map(d => ({ ...d.households, role: d.role }))
    setHouseholds(list)

    // Aktiven Haushalt aus localStorage — aber nur wenn User wirklich Mitglied ist
    const savedId = localStorage.getItem(STORAGE_KEY)
    const active  = list.find(h => h.id === savedId) ?? list[0]
    localStorage.setItem(STORAGE_KEY, active.id)
    setHousehold(active)
    fetchMembers(active.id)
  }

  async function fetchMembers(householdId) {
    const { data } = await supabase
      .from('household_members')
      .select('role, profiles(id, display_name, avatar_url, email)')
      .eq('household_id', householdId)
    setMembers(data?.map(m => ({ ...m.profiles, role: m.role })) ?? [])
    setLoading(false)
  }

  function switchHousehold(householdId) {
    const target = households.find(h => h.id === householdId)
    if (!target) return
    localStorage.setItem(STORAGE_KEY, householdId)
    setHousehold(target)
    setMembers([])
    fetchMembers(householdId)
  }

  async function createHousehold(name) {
    const { data: hh, error } = await supabase
      .from('households')
      .insert({ name })
      .select()
      .single()
    if (error) return { error }

    const { error: memError } = await supabase
      .from('household_members')
      .insert({ household_id: hh.id, profile_id: user.id, role: 'owner' })
    if (memError) return { error: memError }

    localStorage.setItem(STORAGE_KEY, hh.id)
    window.location.reload()
    return { error: null }
  }

  async function joinHousehold(householdId) {
    const { data: hh, error } = await supabase
      .from('households')
      .select()
      .eq('id', householdId)
      .single()
    if (error) return { error }

    const { error: memError } = await supabase
      .from('household_members')
      .insert({ household_id: householdId, profile_id: user.id, role: 'member' })
    if (memError) return { error: memError }

    localStorage.setItem(STORAGE_KEY, householdId)
    window.location.reload()
    return { error: null }
  }

  return {
    household, households, members, loading,
    createHousehold, joinHousehold, switchHousehold,
    refetch: fetchHouseholds
  }
}
