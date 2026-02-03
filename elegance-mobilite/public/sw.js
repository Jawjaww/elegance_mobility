/**
 * Service Worker - Elegance Driver PWA
 * Gestion offline, background sync, push notifications
 */

const CACHE_NAME = 'elegance-driver-v1'
const STATIC_ASSETS = [
  '/driver-portal',
  '/driver-portal/dashboard',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Installation - Mise en cache des assets critiques
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Activation - Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch - Stratégie Cache First, puis Network
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes API ou WebSocket
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase') ||
      event.request.url.includes('ws://')) {
    return
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response
      }
      return fetch(event.request).then(fetchResponse => {
        // Mettre en cache les nouvelles requêtes GET
        if (event.request.method === 'GET' && fetchResponse.status === 200) {
          const clone = fetchResponse.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone)
          })
        }
        return fetchResponse
      })
    }).catch(() => {
      // Fallback offline si disponible
      if (event.request.mode === 'navigate') {
        return caches.match('/driver-portal')
      }
    })
  )
})

// Background Sync - Sync locations en attente
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-locations') {
    console.log('[SW] Syncing locations...')
    event.waitUntil(syncPendingLocations())
  }
})

// Push Notification - Nouvelle course
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event)
  
  let data = {}
  try {
    data = event.data.json()
  } catch (e) {
    data = { title: 'Nouvelle notification', body: event.data.text() }
  }

  const options = {
    body: data.body || 'Nouvelle course disponible !',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: data.rideId ? `ride-${data.rideId}` : 'notification',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 500],
    data: data,
    actions: data.actions || [
      { action: 'open', title: 'Ouvrir' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Elegance Driver', 
      options
    )
  )
})

// Clic sur notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action)
  event.notification.close()

  const rideId = event.notification.data?.rideId
  
  if (event.action === 'accept' && rideId) {
    event.waitUntil(
      clients.openWindow(`/driver-portal/rides/${rideId}?action=accept`)
    )
  } else if (event.action === 'decline' && rideId) {
    // Envoyer message au client pour refuser
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clients => {
        if (clients.length > 0) {
          clients[0].postMessage({
            type: 'DECLINE_RIDE',
            rideId: rideId
          })
        }
      })
    )
  } else {
    // Ouvrir l'app
    event.waitUntil(
      clients.openWindow(rideId ? `/driver-portal/rides/${rideId}` : '/driver-portal')
    )
  }
})

// Message depuis le client
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Fonctions utilitaires
async function syncPendingLocations() {
  // Récupérer les locations en attente depuis IndexedDB
  // et les envoyer au serveur
  return new Promise((resolve) => {
    // Implementation...
    resolve()
  })
}
