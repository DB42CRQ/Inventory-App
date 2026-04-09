import { useState, useEffect } from 'react'

const VAPID_PUBLIC_KEY = 'BEjDj9BHY5W21YwIp3mzXE-gn-7AHz12uBdzq0bJGN7SAMKEdiuZa_dZeddjVYgdXDoPCAS1CnFulu0qsW6kO6Q'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function usePushNotifications(user, household) {
  const [permission,  setPermission]  = useState(() => typeof Notification !== 'undefined' ? Notification.permission : 'default')
  const [subscribed,  setSubscribed]  = useState(false)

  const supported = typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window

  useEffect(() => {
    if (!supported || !user || !household) return
    checkSubscription()
  }, [user?.id, household?.id])

  async function checkSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    } catch {}
  }

  async function subscribe() {
    if (!supported || !user || !household) return false
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      setPermission('granted')
      setSubscribed(true)
      await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id:   user.id,
          household_id: household.id,
          subscription: sub.toJSON(),
        }),
      })
      return true
    } catch {
      setPermission(typeof Notification !== 'undefined' ? Notification.permission : 'default')
      return false
    }
  }

  async function unsubscribe() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
      setSubscribed(false)
      // DB-Eintrag löschen
      if (user && household) {
        await fetch('/api/push-subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_id: user.id, household_id: household.id }),
        })
      }
    } catch {}
  }

  async function sendPush({ title, body, excludeSelf = true, category = null }) {
    if (!household) return
    await fetch('/api/push-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        household_id: household.id,
        profile_id:   excludeSelf ? user?.id : null,
        title,
        body,
        url: '/',
        category,
      }),
    })
  }

  return { supported, permission, subscribed, subscribe, unsubscribe, sendPush }
}
