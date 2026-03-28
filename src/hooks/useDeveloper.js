import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useDeveloper() {
  const { user } = useAuth()
  const [isDeveloper, setIsDeveloper] = useState(false)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase
      .from('developers')
      .select('profile_id')
      .eq('profile_id', user.id)
      .single()
      .then(({ data }) => {
        setIsDeveloper(!!data)
        setLoading(false)
      })
  }, [user])

  return { isDeveloper, loading }
}
