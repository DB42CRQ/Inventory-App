import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { profile_id, household_id, subscription } = req.body
  if (!profile_id || !household_id || !subscription) {
    return res.status(400).json({ error: 'Missing params' })
  }

  const { error } = await supabase.from('push_subscriptions').upsert({
    profile_id,
    household_id,
    subscription,
  }, { onConflict: 'profile_id,household_id' })

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ ok: true })
}
