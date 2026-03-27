import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useVersions() {
  const { user } = useAuth()
  const [versions,    setVersions]    = useState([])
  const [newVersion,  setNewVersion]  = useState(null) // neueste ungesehene Version
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!user) return
    fetchVersions()
  }, [user])

  async function fetchVersions() {
    setLoading(true)

    const { data: versionData } = await supabase
      .from('versions')
      .select('*')
      .order('created_at', { ascending: false })

    const list = versionData ?? []
    setVersions(list)

    if (list.length > 0) {
      // Prüfen ob der User die neueste Version schon gesehen hat
      const { data: viewData } = await supabase
        .from('version_views')
        .select('version_id')
        .eq('profile_id', user.id)
        .eq('version_id', list[0].id)
        .single()

      if (!viewData) {
        setNewVersion(list[0])
      } else {
        setNewVersion(null)
      }
    }
    setLoading(false)
  }

  async function markAsSeen(versionId) {
    await supabase.from('version_views').insert({
      profile_id: user.id,
      version_id: versionId,
    })
    setNewVersion(null)
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
      if (newVersion?.id === id) setNewVersion(null)
    }
    return { error }
  }

  const hasNew = !!newVersion

  return { versions, hasNew, newVersion, loading, markAsSeen, createVersion, deleteVersion }
}
