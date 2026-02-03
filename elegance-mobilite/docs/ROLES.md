# Système de Gestion des Rôles

## Vue d'ensemble

Le système de rôles est **standardisé** entre la base de données et le frontend. Tous les rôles sont stockés dans `auth.users.raw_app_meta_data->>'role'` (côté serveur uniquement).

## Rôles disponibles

| Rôle | Valeur | Description |
|------|--------|-------------|
| Client | `app_customer` | Utilisateur standard (défaut) |
| Chauffeur | `app_driver` | Chauffeur VTC |
| Admin | `app_admin` | Administrateur |
| Super Admin | `app_super_admin` | Super administrateur |

## Hiérarchie des permissions

```
app_super_admin (tous les droits)
    └── app_admin (droits admin)
        └── app_driver (droits chauffeur + client)
            └── app_customer (droits client de base)
```

## Fonctions disponibles

### Backend (PostgreSQL)

```sql
-- Vérification de rôles
SELECT is_admin();           -- true si admin OU super admin
SELECT is_super_admin();     -- true si super admin uniquement
SELECT is_driver();          -- true si chauffeur
SELECT is_customer();        -- true si client (ou pas de rôle)
SELECT get_user_role();      -- Retourne le rôle actuel
SELECT has_any_role(ARRAY['app_admin', 'app_super_admin']); -- Vérifie liste
```

### Frontend (TypeScript)

```typescript
import { 
  isAdmin, isSuperAdmin, isDriver, isCustomer,
  hasAnyRole, formatRoleName, getRoleColor, ROLES 
} from '@/lib/utils/roles'

// Vérifications
isAdmin(userRole)           // true si admin OU super admin
isSuperAdmin(userRole)      // true si super admin uniquement
isDriver(userRole)          // true si chauffeur
isCustomer(userRole)        // true si client (défaut si pas de rôle)

// Utilitaires
hasAnyRole(userRole, [ROLES.ADMIN, ROLES.SUPER_ADMIN])
formatRoleName(userRole)    // "Administrateur", "Chauffeur"...
getRoleColor(userRole)      // Classes Tailwind pour badges
```

## Exemples d'utilisation

### 1. Protection de route (Middleware)

```typescript
// middleware.ts
import { isAdmin, isDriver } from '@/lib/utils/roles'

if (path.startsWith('/backoffice-portal') && !isAdmin(userRole)) {
  return NextResponse.redirect('/login')
}
```

### 2. Affichage conditionnel (React)

```tsx
{isAdmin(user.role) && (
  <AdminPanel />
)}

{isDriver(user.role) && (
  <DriverDashboard />
)}
```

### 3. Protection API

```typescript
// API Route
if (!isAdmin(userRole)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### 4. Navigation dynamique

```typescript
const navItems = [
  { label: 'Accueil', href: '/' },
  ...(isAdmin(userRole) ? [{ label: 'Admin', href: '/admin' }] : []),
  ...(isDriver(userRole) ? [{ label: 'Courses', href: '/rides' }] : []),
]
```

## Sécurité importante

⚠️ **Source de vérité unique** : `auth.users.raw_app_meta_data->>'role'`

- ✅ `raw_app_meta_data` = contrôlé par le serveur (secure)
- ❌ `raw_user_meta_data` = client-side (ne pas utiliser pour l'autorisation)

Les fonctions utilisent **uniquement** `raw_app_meta_data`.

## Assignation des rôles

Les rôles sont assignés automatiquement lors de l'inscription via le trigger `handle_new_user()`.

```typescript
// Inscription avec rôle
const { data } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      // Le trigger gère l'assignation du rôle
      portal_type: 'driver' // ou 'customer', 'admin'
    }
  }
})
```

## Fichiers liés

- `supabase/migrations/20250203020000_standardize_roles.sql` - Fonctions SQL
- `src/lib/utils/roles.ts` - Utilitaires frontend
- `src/lib/utils/roles.example.tsx` - Exemples d'utilisation
- `src/lib/types/common.types.ts` - Type `AppRole`

## Voir aussi

- [Exemples concrets](./src/lib/utils/roles.example.tsx)
- [Migration SQL](./supabase/migrations/20250203020000_standardize_roles.sql)
