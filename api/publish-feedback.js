import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

webpush.setVapidDetails(
  'mailto:admin@inventory42.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { version_id } = req.body
  if (!version_id) return res.status(400).json({ error: 'Missing version_id' })

  // 1. Feedback auf published setzen
  const { error } = await supabase
    .from('feedback')
    .update({ status: 'published' })
    .eq('version_id', version_id)
    .eq('status', 'deployed')

  if (error) console.error(`[publish-feedback] feedback update error:`, error.message)

  // 2. Version holen für Push-Text
  const { data: version } = await supabase
    .from('versions')
    .select('version, household_id')
    .eq('id', version_id)
    .single()

  if (!version) return res.status(200).json({ updated: true })

  // 3. Alle Push-Subscriptions der App holen (haushaltsunabhängig)
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('subscription, preferences, profile_id')

  console.log(`[publish-feedback] version=${version.version} subs=${subs?.length ?? 0}`)

  // 4. Push an alle schicken
  let sent = 0
  for (const sub of subs ?? []) {
    if (sub.preferences?.new_version === false) continue
    try {
      await webpush.sendNotification(sub.subscription, JSON.stringify({
        title: '🚀 Neues Update',
        body: `Version ${version.version} ist verfügbar!`,
        url: '/',
      }))
      sent++
    } catch (err) {
      if (err.statusCode === 410) {
        await supabase.from('push_subscriptions').delete()
          .eq('profile_id', sub.profile_id)
      }
    }
  }

  console.log(`[publish-feedback] pushed to ${sent} subscribers`)
  return res.status(200).json({ updated: true, pushed: sent })
}
