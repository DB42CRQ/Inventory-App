import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useVersions(sendPush) {
  const { user } = useAuth()
  const sendPushRef = useRef(sendPush)
  useEffect(() => { sendPushRef.current = sendPush }, [sendPush])
  const [versions,   setVersions]   = useState([])
  const [newVersion, setNewVersion] = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    if (!user) {
      setVersions([])
      setNewVersion(null)
      setLoading(false)
      return
    }
    fetchVersions()
  }, [user])

  async function fetchVersions() {
    setLoading(true)
    const { data: versionData } = await supabase
      .from('versions')
      .select('*, version_views(profile_id, installed, viewed_at, profiles(display_name, email))')
      .order('created_at', { ascending: false })

    const list = versionData ?? []
    setVersions(list)

    const published = list.filter(v => !v.is_draft)
    if (published.length > 0) {
      const alreadySeen = published[0].version_views?.some(v => v.profile_id === user.id)
      setNewVersion(alreadySeen ? null : published[0])
    } else {
      setNewVersion(null)
    }
    setLoading(false)
  }

  async function markAsSeen(versionId, installed = false) {
    await supabase.from('version_views').upsert({
      profile_id: user.id,
      version_id: versionId,
      installed,
      viewed_at:  new Date().toISOString(),
    })
    setNewVersion(null)
    setVersions(prev => prev.map(v => {
      if (v.id !== versionId) return v
      const existing = v.version_views?.filter(vv => vv.profile_id !== user.id) ?? []
      return { ...v, version_views: [...existing, { profile_id: user.id, installed, viewed_at: new Date().toISOString() }] }
    }))
  }

  async function createVersion(version, notes, notes_en, notes_es, is_draft = false) {
    const { data, error } = await supabase.from('versions').insert({
      version, notes,
      notes_en: notes_en || null,
      notes_es: notes_es || null,
      is_draft
    }).select().single()
    if (!error) {
      await fetchVersions()
      // Push + feedback publish wenn direkt publiziert
      if (!is_draft && data?.id) {
        try {
          const res = await fetch('/api/publish-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ version_id: data.id })
          })
          console.log('[createVersion] publish-feedback status:', res.status)
        } catch (err) {
          console.error('[createVersion] publish-feedback error:', err.message)
        }
      }
    }
    return { error }
  }

  async function publishVersion(id) {
    console.log('[publishVersion] called, id:', id, 'sendPushRef:', !!sendPushRef.current)
    const { error } = await supabase.from('versions').update({ is_draft: false }).eq('id', id)
    if (!error) {
      await fetchVersions()
      // Feedback auf published setzen + Push server-seitig (immer, unabhängig vom lokalen State)
      try {
        const res = await fetch('/api/publish-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ version_id: id })
        })
        console.log('[publishVersion] publish-feedback status:', res.status)
      } catch (err) {
        console.error('[publishVersion] publish-feedback error:', err.message)
      }
    } else {
      console.error('[publishVersion] supabase error:', error.message)
    }
    return { error }
  }

  async function updateDraftNotes(id, notes, notes_en, notes_es) {
    const { data, error } = await supabase.from('versions').update({
      notes,
      notes_en: notes_en || null,
      notes_es: notes_es || null
    }).eq('id', id).select()
    console.log('updateDraftNotes:', { id, notes, error, data })
    if (!error) setVersions(prev => prev.map(v => v.id === id ? { ...v, notes, notes_en, notes_es } : v))
    return { error }
  }

  async function deleteVersion(id) {
    const { error } = await supabase.from('versions').delete().eq('id', id)
    if (!error) {
      setVersions(prev => prev.filter(v => v.id !== id))
      if (newVersion?.id === id) setNewVersion(null)
    }
    return { error }
  }

  const hasNew = !!newVersion
  return { versions, hasNew, newVersion, loading, markAsSeen, createVersion, publishVersion, updateDraftNotes, deleteVersion }
}
