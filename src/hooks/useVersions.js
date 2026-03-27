import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const STORAGE_KEY = 'last_seen_version'

export function useVersions(isDeveloper) {
  const { user } = useAuth()
  const [versions,    setVersions]    = useState([])
  const [hasNew,      setHasNew]      = useState(false)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!user) return
    fetchVersions()
  }, [user])

  async function fetchVersions() {
    setLoading(true)
    const { data } = await supabase
      .from('versions')
      .select('*')
      .order('created_at', { ascending: false })
    setVersions(data ?? [])

    // Prüfen ob neue Version seit letztem Besuch
    if (data && data.length > 0) {
      const lastSeen = localStorage.getItem(STORAGE_KEY)
      if (lastSeen !== data[0].id) setHasNew(true)
    }
    setLoading(false)
  }

  function markAsSeen() {
    if (versions.length > 0) {
      localStorage.setItem(STORAGE_KEY, versions[0].id)
      setHasNew(false)
    }
  }

  async function createVersion(version, notes) {
    const { error } = await supabase
      .from('versions')
      .insert({ version, notes })
    if (!error) await fetchVersions()
    return { error }
  }

  async function deleteVersion(id) {
    const { error } = await supabase.from('versions').delete().eq('id', id)
    if (!error) setVersions(prev => prev.filter(v => v.id !== id))
    return { error }
  }

  return { versions, hasNew, loading, markAsSeen, createVersion, deleteVersion }
}
