# 🚗 Driver PWA - Architecture Temps Réel 2026

> Inspiré de m.uber.com - Expérience native via le web

## 🎯 Objectif
Web App mobile pour chauffeurs avec réception de courses en temps réel, aussi fluide qu'une app native.

---

## 🏗️ Architecture Technique

### Stack Moderne 2026
```
Frontend: Next.js 14 (App Router) + TypeScript
Styling: Tailwind CSS + Framer Motion
State: Zustand (léger, rapide)
Real-time: Supabase Realtime (WebSocket)
PWA: Service Worker + Manifest V3
Notifications: Web Push API + Vibration API
GPS: Geolocation API + Background Geolocation
Storage: IndexedDB (offline)
```

---

## 📱 Features "App Native"

### 1. 🔔 Temps Réel (WebSocket)
```typescript
// Supabase Realtime - Courses disponibles
const channel = supabase
  .channel('available-rides')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'rides', filter: 'status=eq.pending' },
    (payload) => {
      // Nouvelle course disponible !
      showRideRequest(payload.new)
      vibrateDevice()
      playNotificationSound()
    }
  )
  .subscribe()
```

### 2. 📍 Géolocalisation Continue
```typescript
// Background geolocation pour driver en ligne
navigator.geolocation.watchPosition(
  (position) => {
    updateDriverLocation(position.coords)
  },
  null,
  { 
    enableHighAccuracy: true, 
    maximumAge: 10000, 
    timeout: 5000 
  }
)
```

### 3. 📳 Feedback Haptique
```typescript
// Vibration quand course arrive
function vibrateRideRequest() {
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200, 100, 500]) // Pattern: court, pause, court, pause, LONG
  }
}
```

### 4. 🔒 Wake Lock (Écran allumé)
```typescript
// Garder l'écran allumé pendant le travail
let wakeLock: WakeLockSentinel | null = null

async function enableWakeLock() {
  if ('wakeLock' in navigator) {
    wakeLock = await navigator.wakeLock.request('screen')
  }
}
```

### 5. 🔔 Push Notifications (Même app fermée)
```typescript
// Service Worker reçoit push même si app fermée
self.addEventListener('push', (event) => {
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification('Nouvelle course !', {
      body: `Course de ${data.pickup} à ${data.dropoff} - ${data.price}€`,
      icon: '/icons/ride-icon.png',
      badge: '/icons/badge-72x72.png',
      tag: 'new-ride',
      requireInteraction: true, // Ne disparaît pas seul
      actions: [
        { action: 'accept', title: 'Accepter ✅' },
        { action: 'decline', title: 'Refuser ❌' }
      ]
    })
  )
})
```

### 6. 💾 Offline First (IndexedDB)
```typescript
// Stocker courses en cours localement
const db = await openDB('driver-app', 1, {
  upgrade(db) {
    db.createObjectStore('active-rides', { keyPath: 'id' })
    db.createObjectStore('earnings', { keyPath: 'date' })
    db.createObjectStore('location-history', { autoIncrement: true })
  }
})
```

---

## 🎨 UX Mobile-First (Style Uber Driver)

### Écran Principal (Online Mode)
```
┌─────────────────────────────┐
│  🟢 EN LIGNE    ┃    💰 0€  │  ← Header compact
├─────────────────────────────┤
│                             │
│         [CARTE]             │  ← Mapbox/MapLibre 
│         live GPS            │     fullscreen
│                             │
├─────────────────────────────┤
│  📊 Aperçu journée          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━  │
│  🚗 0 courses    ⏱️ -- min  │
│  💰 0€           ⭐ --/5    │
├─────────────────────────────┤
│  [     🟢 GO ONLINE      ]  │  ← Gros bouton principal
└─────────────────────────────┘
```

### Popup Course Entrante (Modal Slide-up)
```
┌─────────────────────────────┐
│         ▔▔▔▔▔▔▔            │  ← Handle pour drag
│                             │
│   🔔 NOUVELLE COURSE !      │
│                             │
│   📍 De: Avenue Champs      │
│      À: Gare du Nord         │
│                             │
│   💶 24.50 €   🕐 12 min    │
│   📏 8.2 km     ⭐ 4.8      │
│                             │
│  ┌─────────────────────┐   │
│  │   🎯  ACCEPTER     │   │  ← Bouton vert MASSIF
│  │    (15s)            │   │     compte à rebours
│  └─────────────────────┘   │
│                             │
│     [  Passer cette course ]│  ← Bouton secondaire
└─────────────────────────────┘
```

### Navigation Active (Course en cours)
```
┌─────────────────────────────┐
│  ⏱️ 8 min    →    📍 2.4 km│  ← ETA + Distance
├─────────────────────────────┤
│                             │
│      [NAVIGATION]           │  ← Turn-by-turn
│      flèche + carte         │
│                             │
├─────────────────────────────┤
│  👤 Marie D.    ☎️ [📞]    │  ← Client + actions
│  ⭐ 4.8                         │
├─────────────────────────────┤
│  [  🏁 Arrivée à destination ]│
└─────────────────────────────┘
```

---

## 🔧 Implémentation Technique

### 1. Service Worker (sw.ts)
```typescript
// public/sw.ts
const CACHE_NAME = 'driver-pwa-v1'
const urlsToCache = [
  '/driver-portal',
  '/driver-portal/dashboard',
  '/styles/main.css',
  '/scripts/app.js'
]

// Installation - cache les assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  )
  self.skipWaiting()
})

// Background Sync - envoi location quand reconnexion
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-location') {
    event.waitUntil(syncPendingLocations())
  }
})

// Push Notification
self.addEventListener('push', (event) => {
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification('Nouvelle course', {
      body: data.message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      actions: [
        { action: 'accept', title: 'Accepter' },
        { action: 'decline', title: 'Refuser' }
      ]
    })
  )
})

// Clic sur notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'accept') {
    event.waitUntil(
      clients.openWindow(`/driver-portal/ride/${event.notification.data.rideId}/accept`)
    )
  }
})
```

### 2. Hook Real-time Courses
```typescript
// hooks/useRealtimeRides.ts
'use client'
import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/database/client'
import { useDriverStore } from '@/stores/driverStore'

export function useRealtimeRides() {
  const { setAvailableRide, clearAvailableRide, isOnline } = useDriverStore()

  useEffect(() => {
    if (!isOnline) return

    const channel = supabase
      .channel('available-rides')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rides',
        filter: 'status=eq.pending'
      }, (payload) => {
        const ride = payload.new
        
        // Vérifier si la course est proche du driver
        if (isRideInRange(ride)) {
          setAvailableRide(ride)
          vibrateDevice()
          playSound('new-ride')
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [isOnline, setAvailableRide])

  const acceptRide = useCallback(async (rideId: string) => {
    const { data, error } = await supabase
      .rpc('accept_ride', { ride_id: rideId })
    
    if (error) throw error
    clearAvailableRide()
    return data
  }, [clearAvailableRide])

  return { acceptRide }
}

function vibrateDevice() {
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100, 50, 300])
  }
}
```

### 3. Hook Geolocation Background
```typescript
// hooks/useDriverLocation.ts
'use client'
import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/database/client'

export function useDriverLocation(isOnline: boolean) {
  const watchId = useRef<number | null>(null)
  const lastUpdate = useRef<number>(0)

  const updateLocation = useCallback(async (position: GeolocationPosition) => {
    // Throttle: max 1 update / 10s
    const now = Date.now()
    if (now - lastUpdate.current < 10000) return
    lastUpdate.current = now

    const { coords } = position
    
    // Envoyer à Supabase
    await supabase.rpc('update_driver_location', {
      lat: coords.latitude,
      lng: coords.longitude,
      heading: coords.heading,
      speed: coords.speed
    })
  }, [])

  useEffect(() => {
    if (!isOnline) {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      }
      return
    }

    // Démarrer le tracking
    watchId.current = navigator.geolocation.watchPosition(
      updateLocation,
      (err) => console.error('GPS Error:', err),
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    )

    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [isOnline, updateLocation])
}
```

### 4. Hook Wake Lock
```typescript
// hooks/useWakeLock.ts
'use client'
import { useEffect, useRef } from 'react'

export function useWakeLock(enabled: boolean) {
  const wakeLock = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return

    const requestWakeLock = async () => {
      try {
        wakeLock.current = await navigator.wakeLock.request('screen')
      } catch (err) {
        console.error('Wake Lock error:', err)
      }
    }

    requestWakeLock()

    // Réactiver si l'utilisateur revient sur l'app
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && enabled) {
        requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      wakeLock.current?.release()
    }
  }, [enabled])
}
```

---

## 📲 Installation PWA

### manifest.json
```json
{
  "name": "Elegance Driver",
  "short_name": "Driver",
  "description": "App chauffeur - Recevez des courses en temps réel",
  "start_url": "/driver-portal",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a0a0a",
  "theme_color": "#10b981",
  "icons": [
    { "src": "/icons/icon-72x72.png", "sizes": "72x72" },
    { "src": "/icons/icon-192x192.png", "sizes": "192x192" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "purpose": "maskable" }
  ]
}
```

---

## 🎬 Flow Utilisateur

1. **Chauffeur ouvre l'app** → PWA installée ou navigateur
2. **Active "En Ligne"** → Wake lock activé, GPS tracking ON
3. **Attend une course** → App reste ouverte en fond
4. **Nouvelle course** → Vibration + Son + Push + Modal slide-up
5. **Accepte en 15s** → Navigation vers client lancée
6. **Arrivée client** → Bouton "Client à bord"
7. **En route destination** → Navigation temps réel
8. **Arrivée** → Paiement auto, note client
9. **Retour étape 3**

---

## 🚀 Prochaines étapes

1. **Configurer le Service Worker**
2. **Créer le manifest.json**
3. **Implémenter les hooks (useRealtimeRides, useDriverLocation)**
4. **Créer l'UI mobile-first (mode online/offline)**
5. **Ajouter sons et vibrations**
6. **Tester sur mobile (iOS Safari + Android Chrome)**

On commence ? 🔥
