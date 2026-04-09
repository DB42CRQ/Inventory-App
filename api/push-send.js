import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { household_id, profile_id, title, body, url, category } = req.body
  if (!household_id || !title) return res.status(400).json({ error: 'Missing params' })

  let query = supabase
    .from('push_subscriptions')
    .select('subscription, profile_id, preferences')
    .eq('household_id', household_id)

  if (profile_id) query = query.neq('profile_id', profile_id)

  const { data: subs, error: dbError } = await query

  if (!subs || subs.length === 0) return res.status(200).json({ sent: 0 })

  const payload = JSON.stringify({ title, body, url: url || '/' })
  let sent = 0

  for (const sub of subs) {
    // Präferenzen prüfen
    if (category && sub.preferences) {
      if (sub.preferences[category] === false) continue
    }

    try {
      await webpush.sendNotification(sub.subscription, payload)
      sent++
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from('push_subscriptions')
          .delete()
          .eq('profile_id', sub.profile_id)
          .eq('household_id', household_id)
      }
    }
  }

  return res.status(200).json({ sent })
}
