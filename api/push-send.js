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

// Einheit übersetzen
function translateUnit(unit, lang) {
  if (unit === 'Stück') {
    if (lang === 'en') return 'piece'
    if (lang === 'es') return 'pieza'
  }
  return unit
}

// Texte pro Sprache
const TEXTS = {
  de: {
    low_stock_title:    '⚠️ Niedriger Bestand',
    low_stock_body:     (name, qty, unit) => `${name}: noch ${qty} ${unit}`,
    shopping_title:     '🛒 Einkaufsliste',
    shopping_body:      (name) => `${name} wurde zur Einkaufsliste hinzugefügt`,
    version_title:      '🚀 Neues Update',
    version_body:       (v) => `Version ${v} ist verfügbar!`,
    test_title:         '🔔 Test',
    test_body:          'Push-Benachrichtigungen funktionieren!',
  },
  en: {
    low_stock_title:    '⚠️ Low stock',
    low_stock_body:     (name, qty, unit) => `${name}: only ${qty} ${unit} left`,
    shopping_title:     '🛒 Shopping list',
    shopping_body:      (name) => `${name} was added to the shopping list`,
    version_title:      '🚀 New update',
    version_body:       (v) => `Version ${v} is available!`,
    test_title:         '🔔 Test',
    test_body:          'Push notifications are working!',
  },
  es: {
    low_stock_title:    '⚠️ Stock bajo',
    low_stock_body:     (name, qty, unit) => `${name}: solo quedan ${qty} ${unit}`,
    shopping_title:     '🛒 Lista de compras',
    shopping_body:      (name) => `${name} fue añadido a la lista de compras`,
    version_title:      '🚀 Nueva actualización',
    version_body:       (v) => `¡La versión ${v} está disponible!`,
    test_title:         '🔔 Test',
    test_body:          '¡Las notificaciones push funcionan!',
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { household_id, profile_id, title, body, url, category, meta } = req.body
  if (!household_id || !title) return res.status(400).json({ error: 'Missing params' })

  // Subscriptions + Sprache des Empfängers laden
  let query = supabase
    .from('push_subscriptions')
    .select('subscription, profile_id, preferences, profiles(lang)')
    .eq('household_id', household_id)

  if (profile_id) query = query.neq('profile_id', profile_id)

  const { data: subs } = await query
  if (!subs || subs.length === 0) return res.status(200).json({ sent: 0 })

  console.log(`[push-send] household=${household_id} category=${category} subs=${subs.length} excludeSelf=${!!profile_id}`)
  let sent = 0

  for (const sub of subs) {
    // Präferenzen prüfen
    if (category && sub.preferences && sub.preferences[category] === false) continue

    // Sprache des Empfängers
    const lang = sub.profiles?.lang || 'de'
    const tx = TEXTS[lang] || TEXTS.de

    // Lokalisierten Text bestimmen
    let localTitle = title
    let localBody = body

    if (category === 'low_stock' && meta) {
      localTitle = tx.low_stock_title
      localBody = tx.low_stock_body(meta.name, meta.qty, translateUnit(meta.unit, lang))
    } else if (category === 'shopping_list' && meta) {
      localTitle = tx.shopping_title
      localBody = tx.shopping_body(meta.name)
    } else if (category === 'new_version' && meta) {
      localTitle = tx.version_title
      localBody = tx.version_body(meta.version)
    } else if (category === 'test') {
      localTitle = tx.test_title
      localBody = tx.test_body
    }

    try {
      await webpush.sendNotification(sub.subscription, JSON.stringify({
        title: localTitle,
        body:  localBody,
        url:   url || '/',
      }))
      console.log(`[push-send] ✓ sent to profile=${sub.profile_id} lang=${sub.profiles?.lang} title="${localTitle}"`)
      sent++
    } catch (err) {
      console.error(`[push-send] ✗ error profile=${sub.profile_id} status=${err.statusCode}`, err.body)
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from('push_subscriptions')
          .delete()
          .eq('profile_id', sub.profile_id)
          .eq('household_id', household_id)
      }
    }
  }

  console.log(`[push-send] done sent=${sent}`)
  return res.status(200).json({ sent })
}
