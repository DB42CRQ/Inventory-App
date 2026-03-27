import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const STORAGE_KEY = 'last_seen_version'

export function useVersions() {
  const { user } = useAuth()
  const [versions, setVersions] = useState([])
  const [hasNew,   setHasNew]   = useState(false)
  const [loading,  setLoading]  = useState(true)

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

    const list = data ?? []
    setVersions(list)

    if (list.length > 0) {
      const lastSeen = localStorage.getItem(STORAGE_KEY)
      setHasNew(lastSeen !== list[0].id)
    } else {
      setHasNew(false)
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
    const { error } = await supabase.from('versions').insert({ version, notes })
    if (!error) await fetchVersions()
    return { error }
  }

  async function deleteVersion(id) {
    const { error } = await supabase.from('versions').delete().eq('id', id)
    if (!error) {
      const updated = versions.filter(v => v.id !== id)
      setVersions(updated)
      // Badge neu prüfen
      if (updated.length > 0) {
        const lastSeen = localStorage.getItem(STORAGE_KEY)
        setHasNew(lastSeen !== updated[0].id)
      } else {
        setHasNew(false)
      }
    }
    return { error }
  }

  return { versions, hasNew, loading, markAsSeen, createVersion, deleteVersion }
}
