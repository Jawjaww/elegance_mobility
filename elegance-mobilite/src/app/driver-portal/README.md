# 🚗 Driver Portal - PWA

Application mobile-first pour chauffeurs avec réception de courses en temps réel.

## ✨ Features

### PWA (Progressive Web App)
- 📱 Installation sur écran d'accueil (iOS/Android)
- 🔔 Push notifications
- 💾 Offline support (Service Worker)
- 🔒 Écran toujours allumé (Wake Lock)

### Temps Réel
- 📡 WebSocket pour nouvelles courses instantanées
- 📍 GPS tracking continu
- 📳 Vibration + son quand course arrive
- ⏱️ Compte à rebours 15s pour accepter

## 📱 Installation

### iOS (Safari)
1. Ouvrir `/driver-portal` dans Safari
2. Tapper 
3. Sélectionner "Sur l'écran d'accueil"

### Android (Chrome)
1. Ouvrir `/driver-portal` dans Chrome
2. Attendre la popup "Installer"
3. Ou menu ⋮ → "Installer l'application"

## 🎮 Usage

1. **Se connecter** - `/driver-portal/login`
2. **Activer "En Ligne"** - Bouton vert sur le dashboard
3. **Attendre une course** - L'app reste ouverte en fond
4. **Accepter la course** - Modal slide-up avec compte à rebours
5. **Navigation** - Vers client puis destination

## 📁 Structure

```
driver-portal/
├── layout.tsx              # Layout PWA + AuthCheck
├── page.tsx               # Redirect → /dashboard
├── dashboard/
│   └── page.tsx           # Dashboard principal (mode online/offline)
├── login/
│   ├── page.tsx           # Page login chauffeur
│   └── DriverLoginForm.tsx
├── rides/
│   ├── page.tsx           # Mes courses
│   └── available/
│       └── page.tsx       # Courses disponibles
├── earnings/
│   └── page.tsx           # Revenus
├── schedule/
│   └── page.tsx           # Planning
└── profile/
    └── page.tsx           # Profil
```

## 🔧 Architecture

### Hooks
| Hook | Description |
|------|-------------|
| `useRealtimeRides` | Écoute WebSocket courses pending |
| `useDriverLocation` | Tracking GPS + envoi Supabase |
| `useWakeLock` | Empêche écran de s'éteindre |
| `usePWA` | Gestion installation PWA |

### Store (Zustand)
```typescript
interface DriverState {
  isOnline: boolean
  activeRide: Ride | null
  availableRide: Ride | null  // Course entrante
  currentLocation: { lat, lng, heading }
  stats: { todayEarnings, todayRides, onlineTimeMinutes, rating }
}
```

### Components
| Component | Description |
|-----------|-------------|
| `OnlineToggle` | Gros bouton GO ONLINE/OFFLINE |
| `RideRequestModal` | Modal slide-up course entrante |
| `DriverMap` | Carte MapLibre avec position |

## 🔔 Flow Course

```
Client crée course
       ↓
Supabase Realtime INSERT
       ↓
useRealtimeRides reçoit event
       ↓
Vibration + Son + Push Notification
       ↓
RideRequestModal s'affiche (15s)
       ↓
Driver accepte → accept_ride()
       ↓
Course locked au driver
       ↓
Navigation vers client
```

## 🔌 API Supabase

### Functions SQL
```sql
-- Update position GPS
update_driver_location(lat, lng, heading, speed)

-- Accepter une course
accept_ride(ride_id, driver_id)

-- Mettre hors ligne
set_driver_offline()

-- Trouver chauffeurs proches
find_nearby_drivers(lat, lng, radius_km)
```

### Tables
- `rides` - Courses (avec status, driver_id)
- `driver_locations` - Positions GPS temps réel
- `notifications` - Notifications push

## 🎨 Design Mobile

- **Max-width**: 512px (mobile optimized)
- **Touch targets**: Min 44x44px
- **Animations**: Framer Motion
- **Carte**: MapLibre GL (dark mode)

## 🚀 Développement

```bash
# Tester en mode mobile
npm run dev
# Ouvrir Chrome DevTools → Device Toolbar → iPhone SE

# Vérifier PWA
# Chrome DevTools → Lighthouse → PWA
# ou → Application → Manifest / Service Workers
```

## 📝 TODO

- [ ] Ajouter turn-by-turn navigation
- [ ] Implementer offline queue pour positions
- [ ] Ajouter chat client-driver
- [ ] Background geolocation (capacitor?)
- [ ] Vérifier permissions iOS (location always)
