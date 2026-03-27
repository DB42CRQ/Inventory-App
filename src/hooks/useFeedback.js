import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useFeedback() {
  const { user } = useAuth()
  const [feedback,     setFeedback]     = useState([])
  const [isDeveloper,  setIsDeveloper]  = useState(false)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    if (!user) return
    fetchAll()
  }, [user])

  async function fetchAll() {
    setLoading(true)

    // Prüfen ob Developer
    const { data: dev } = await supabase
      .from('developers')
      .select('profile_id')
      .eq('profile_id', user.id)
      .single()
    setIsDeveloper(!!dev)

    // Feedback laden
    const { data } = await supabase
      .from('feedback')
      .select('*, profiles(display_name, email)')
      .order('created_at', { ascending: false })
    setFeedback(data ?? [])
    setLoading(false)
  }

  async function updateStatus(feedbackId, status) {
    const { error } = await supabase
      .from('feedback')
      .update({ status })
      .eq('id', feedbackId)
    if (!error) {
      setFeedback(prev => prev.map(f => f.id === feedbackId ? { ...f, status } : f))
    }
    return { error }
  }

  async function submitFeedback(message, householdId) {
    const { error } = await supabase.from('feedback').insert({
      profile_id:   user.id,
      household_id: householdId ?? null,
      message,
      status:       'submitted',
    })
    if (!error) fetchAll()
    return { error }
  }

  return { feedback, isDeveloper, loading, updateStatus, submitFeedback }
}
