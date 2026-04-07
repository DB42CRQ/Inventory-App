self.addEventListener('push', event => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data:  { url: data.url || '/' },
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data.url)
    })
  )
})
