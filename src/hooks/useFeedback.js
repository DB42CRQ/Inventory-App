import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useFeedback() {
  const { user } = useAuth()
  const [feedback, setFeedback] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!user) return
    fetchFeedback()
  }, [user])

  async function fetchFeedback() {
    setLoading(true)
    const { data } = await supabase
      .from('feedback')
      .select('*, profiles(display_name, email), versions(version)')
      .order('created_at', { ascending: false })
    setFeedback(data ?? [])
    setLoading(false)
  }

  async function updateStatus(feedbackId, status) {
    const { error } = await supabase
      .from('feedback')
      .update({ status })
      .eq('id', feedbackId)
    if (!error) setFeedback(prev => prev.map(f => f.id === feedbackId ? { ...f, status } : f))
    return { error }
  }

  async function updateVersion(feedbackId, versionId) {
    const { error } = await supabase
      .from('feedback')
      .update({ version_id: versionId || null })
      .eq('id', feedbackId)
    if (!error) {
      await fetchFeedback()
    }
    return { error }
  }

  return { feedback, loading, updateStatus, updateVersion }
}
