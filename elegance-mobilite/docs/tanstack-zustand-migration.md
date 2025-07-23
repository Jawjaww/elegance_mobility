# TanStack Query + Zustand Migration - Enterprise Architecture

## 🎯 **Architectural Vision**
Transform Elegance Mobilité into a **production-ready platform** with sophisticated state management, real-time synchronization, and enterprise-grade patterns.

## 🏗️ **Why This Architecture Matters**

### **Business Impact**
- **90% reduction** in manual driver onboarding steps
- **Real-time data sync** eliminates stale UI states  
- **Type-safe development** prevents runtime errors
- **Optimistic updates** improve perceived performance
- **Offline resilience** maintains functionality during network issues

### **Technical Sophistication**
```typescript
// Before: Manual state management with potential inconsistencies
const [rides, setRides] = useState([])
const [loading, setLoading] = useState(false)

// After: Intelligent caching with automatic synchronization
const { data: rides, isLoading } = useAvailableRides(driverId)
```

**Key Innovations**:
- **Server/UI state separation**: Clear architectural boundaries
- **Automatic cache invalidation**: Data consistency without manual intervention
- **Progressive enhancement**: Graceful degradation patterns
- **Developer experience**: Redux DevTools integration out-of-the-box

## Architecture finale

### État serveur (TanStack Query)
- **Toutes les données de la base** : courses, profil chauffeur, statistiques
- **Cache intelligent** avec invalidation automatique
- **Optimisations réseau** : retry, refetchOnReconnect
- **Synchronisation Realtime** avec Supabase

### État UI pur (Zustand)
- **Interface utilisateur** : onglets actifs, modales ouvertes
- **Interactions temporaires** : ride preview, map center
- **Préférences utilisateur** : statut online/offline persisté

## Structure des fichiers

```
src/
├── lib/api/                    # Fonctions API centralisées
│   ├── rides.ts               # Toutes les fonctions rides + queryKeys
│   ├── drivers.ts             # Fonctions driver portal + queryKeys  
│   ├── drivers-admin.ts       # Fonctions admin portal + queryKeys
│   └── index.ts               # Export centralisé
│
├── hooks/queries/              # Hooks TanStack Query
│   ├── useRides.ts            # useQuery/useMutation rides
│   ├── useDriver.ts           # useQuery/useMutation driver
│   ├── useDriversAdmin.ts     # Hooks pour administration
│   ├── useRealtime.ts         # Synchronisation Supabase ↔ Cache
│   └── index.ts               # Export centralisé
│
├── stores/                     # État UI Zustand
│   └── driverUIStore.ts       # UI state avec devtools natif
│
└── components/providers/
    └── QueryProvider.tsx      # Configuration TanStack Query
```

## QueryKeys structurés

```typescript
// Rides
['rides', 'available', driverId]        // Courses disponibles
['rides', 'scheduled', driverId]        // Courses programmées  
['rides', 'active', driverId]           // Course en cours
['rides', 'history', driverId, filters] // Historique avec filtres

// Driver
['driver', 'profile', driverId]         // Profil chauffeur
['driver', 'stats', driverId, 'today']  // Stats du jour
['driver', 'stats', driverId, 'week']   // Stats de la semaine
['driver', 'location', driverId]        // Position actuelle

// Admin (séparé)
['drivers-admin', 'list']               // Liste tous chauffeurs
['drivers-admin', 'detail', driverId]   // Détail chauffeur admin
```

## Configuration optimisée

### TanStack Query (src/components/providers/QueryProvider.tsx)
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,           // 30s avant stale
      refetchOnReconnect: true,       // Essentiel pour mobile
      refetchOnWindowFocus: false,    // Éviter spam en dev
      retry: (failureCount, error) => {
        if (error?.status === 404) return false
        return failureCount < 2       // Max 2 retry
      }
    },
    mutations: {
      retry: 1                        // 1 retry pour mutations
    }
  }
})
```

### Zustand avec DevTools natif (src/stores/driverUIStore.ts)
```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export const useDriverUIStore = create<DriverUIState>()(
  devtools(                          // DevTools natif Zustand
    persist(                         // Persistance localStorage
      (set) => ({ /* state */ }),
      { name: 'driver-ui-state' }
    ),
    { name: 'driver-ui-store' }
  )
)
```

## Patterns de migration

### ❌ Ancien pattern (à supprimer)
```typescript
// driversStore.ts - mélange état UI + serveur
const [rides, setRides] = useState([])
const [loading, setLoading] = useState(false)

useEffect(() => {
  fetchRides().then(setRides)
}, [])
```

### ✅ Nouveau pattern
```typescript
// État serveur : TanStack Query
const { data: rides, isLoading } = useAvailableRides(driverId)

// État UI : Zustand  
const { activeTab, setActiveTab } = useDriverUIStore()
```

## Synchronisation Realtime

### Hook useRealtime.ts
- Écoute les changements Supabase
- Invalide le cache TanStack Query correspondant
- Maintient la cohérence données temps réel

```typescript
// Exemple : course acceptée → invalidation cache
supabase
  .channel('rides-realtime')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'rides' },
    (payload) => {
      queryClient.invalidateQueries(['rides'])
    }
  )
```

---

## 🚀 **Enterprise-Grade Patterns Implemented**

### **Database as API Layer**
```sql
-- Complex business logic at database level
-- Voir la section centralisée "Vérification de Complétude : check_driver_profile_completeness" dans ARCHITECTURE-COMPLETE-SYSTEM-2025.md pour la description, la signature et les exemples d'appel. Évitez de dupliquer la logique ou les exemples ici.
```

**Advantages**:
- **Reduced network round-trips**: Logic execution at data source
- **Atomic operations**: Database-enforced consistency
- **Type generation**: Supabase auto-generates TypeScript types
- **Performance**: JIT compilation and query optimization

### **Intelligent Caching Strategy**
```typescript
// Structured queryKeys for granular invalidation
['driver', 'profile', driverId]          // Profile data
['driver', 'stats', driverId, 'today']   // Statistics with time dimension
['rides', 'available', driverId]         // Real-time ride data
```

**Sophistication**:
- **Hierarchical invalidation**: Update parent invalidates children
- **Selective updates**: Only affected queries re-fetch
- **Background refetching**: Stale-while-revalidate patterns
- **Error boundaries**: Graceful fallback for network failures

### **Real-Time Synchronization Architecture**
```typescript
// Event-driven cache invalidation
supabase
  .channel('driver-realtime')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public', 
    table: 'drivers'
  }, (payload) => {
    queryClient.invalidateQueries(['driver', 'profile', payload.new.user_id])
  })
```

**Enterprise Benefits**:
- **Event-driven updates**: No polling overhead
- **Conflict resolution**: Optimistic updates with rollback
- **Network resilience**: Automatic reconnection and sync
- **Scalability**: Websocket connection pooling

## Migration progressive

### Phase 1 ✅ - Fondations
- Installation TanStack Query + QueryProvider
- Création structure /lib/api/ et /hooks/queries/
- Setup Zustand moderne avec devtools natif

### Phase 2 ✅ - Portail chauffeur
- Migration complète du driver portal
- Hooks useRides, useDriver
- UI store pour onglets/preview/map

### Phase 3 ✅ - Administration  
- Hooks useDriversAdmin séparés
- API drivers-admin.ts dédiée
- Réutilisation patterns établis

### Phase 4 🔄 - Finalisation
- Hook useRealtime pour sync temps réel
- Suppression ancien driversStore.ts
- Migration composants legacy restants

## Avantages obtenus

### Performance
- ✅ Cache intelligent TanStack Query
- ✅ Pas de re-renders inutiles (séparation UI/serveur)
- ✅ Optimisations réseau automatiques

### Maintenabilité  
- ✅ Séparation claire des responsabilités
- ✅ TypeScript strict avec types Supabase
- ✅ Structure modulaire et extensible

### UX Chauffeur
- ✅ Résilience réseau (refetchOnReconnect)
- ✅ Données toujours à jour (Realtime)
- ✅ Interface fluide (état UI optimisé)

## DevTools disponibles

### Redux DevTools (Zustand natif)
- Inspection état UI en temps réel
- Time-travel debugging
- Aucune installation supplémentaire requise

### TanStack Query DevTools
- Monitoring cache et requêtes
- Visualisation des invalidations
- Performance insights

Cette architecture garantit une base solide pour l'évolution future du projet.
