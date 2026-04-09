import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    const { profile_id, household_id } = req.body
    if (!profile_id || !household_id) return res.status(400).json({ error: 'Missing params' })
    const { error } = await supabase.from('push_subscriptions')
      .delete()
      .eq('profile_id', profile_id)
      .eq('household_id', household_id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { profile_id, household_id, subscription } = req.body
  if (!profile_id || !household_id || !subscription) {
    return res.status(400).json({ error: 'Missing params' })
  }

  // Bestehende Präferenzen nicht überschreiben
  const { data: existing } = await supabase
    .from('push_subscriptions')
    .select('preferences')
    .eq('profile_id', profile_id)
    .eq('household_id', household_id)
    .single()

  const { error } = await supabase.from('push_subscriptions').upsert({
    profile_id,
    household_id,
    subscription,
    preferences: existing?.preferences ?? { low_stock: true, shopping_list: true, new_version: true },
  }, { onConflict: 'profile_id,household_id' })

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ ok: true })
}
