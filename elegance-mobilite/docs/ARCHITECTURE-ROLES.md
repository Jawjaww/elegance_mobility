# Architecture des Rôles - Référence Unique

> **Document de référence unique pour le système de rôles.**
> Date: Février 2026
> Dernier update: Factorisation complète du système de rôles

---

## 🎯 Vue d'Ensemble

Le système de rôles utilise **une seule source de vérité** : `getAppRole()`

### Flux complet

```
Inscription → Trigger SQL → JWT (app_metadata.role) → getAppRole()
     ↑                                              ↓
 portal_type                                    Vérification
(driver/customer/admin)                      (partout dans l'app)
```

---

## 📋 Rôles Disponibles

```typescript
export type AppRole = 
  | 'app_customer'      // Client standard
  | 'app_driver'        // Chauffeur
  | 'app_admin'         // Administrateur
  | 'app_super_admin'   // Super administrateur
```

---

## 🔧 Point d'Entrée Unique

### `src/lib/types/common.types.ts`

```typescript
export function getAppRole(user?: User | null): string | undefined {
  return (
    (user as any)?.app_metadata?.role ||      // Standard Supabase
    (user as any)?.raw_app_meta_data?.role || // Direct DB
    (user as any)?.user_metadata?.role ||     // Fallback
    user?.role                                // Legacy fallback
  );
}

// Helpers utilisant getAppRole
export function isAdmin(user?: User | null): boolean {
  const role = getAppRole(user);
  return role === 'app_admin' || role === 'app_super_admin';
}

export function isDriver(user?: User | null): boolean {
  return getAppRole(user) === 'app_driver';
}

export function isCustomer(user?: User | null): boolean {
  return getAppRole(user) === 'app_customer';
}
```

---

## 📝 Inscription (Frontend)

### Chauffeur
```typescript
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      portal_type: 'driver',  // Déclenche le trigger
      first_name,
      last_name,
    }
  }
})
```

### Client
```typescript
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      portal_type: 'customer',  // Déclenche le trigger
      first_name,
      last_name,
    }
  }
})
```

---

## 🗄️ Trigger SQL (Backend)

**Migration:** `supabase/migrations/20250613_setup_role_assignment.sql`

```sql
CREATE OR REPLACE FUNCTION public.assign_user_role_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data ? 'portal_type' THEN
    CASE NEW.raw_user_meta_data->>'portal_type'
      WHEN 'driver' THEN
        NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "app_driver"}'::jsonb;
      WHEN 'customer' THEN
        NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "app_customer"}'::jsonb;
      WHEN 'admin' THEN
        NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "app_admin"}'::jsonb;
      ELSE
        RAISE EXCEPTION 'portal_type non reconnu: %', NEW.raw_user_meta_data->>'portal_type';
    END CASE;
  ELSE
    RAISE EXCEPTION 'portal_type est requis lors de l''inscription.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## ✅ Utilisation Correcte (Exemples)

### Server Component
```typescript
import { getServerUser } from '@/lib/database/server'
import { getAppRole, isAdmin } from '@/lib/types/common.types'

export default async function Page() {
  const user = await getServerUser()
  
  // ❌ AVANT (Obsolète)
  if (user?.role === 'app_admin') { ... }
  
  // ✅ APRÈS (Correct)
  const userRole = getAppRole(user)
  if (userRole === 'app_admin') { ... }
  
  // ✅ Ou utiliser les helpers
  if (isAdmin(user)) { ... }
}
```

### Client Component
```typescript
import { getAppRole } from '@/lib/types/common.types'

function UserMenu({ user }) {
  // ❌ AVANT (Obsolète)
  const isAdminUser = user.role === 'app_admin'
  
  // ✅ APRÈS (Correct)
  const userRole = getAppRole(user)
  const isAdminUser = userRole === 'app_admin'
}
```

### Action Server
```typescript
import { getAppRole } from '@/lib/types/common.types'

export async function login(formData: FormData) {
  const { data } = await supabase.auth.signInWithPassword({ ... })
  
  // ❌ AVANT (Obsolète)
  const userRole = data.user.role
  
  // ✅ APRÈS (Correct)
  const userRole = getAppRole(data.user as any)
}
```

### Guards
```typescript
// src/components/auth/RoleGuard.tsx
function extractRoleFromUser(user: any): string | undefined {
  // Utilise getAppRole pour cohérence
  return getAppRole(user);
}
```

---

## 🚫 Erreurs Courantes à Éviter

| ❌ Incorrect | ✅ Correct |
|-------------|-----------|
| `user.role === 'app_admin'` | `getAppRole(user) === 'app_admin'` |
| `data.user.role` | `getAppRole(data.user)` |
| `user?.app_metadata?.role` direct | `getAppRole(user)` |
| Comparaison avec rôle natif PostgreSQL | Comparaison avec `app_metadata.role` |

---

## 🔄 Récupération du Rôle Serveur

### `src/lib/database/server.ts`

```typescript
export async function getServerUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Utilise getAppRole pour cohérence
  const role = getAppRole(user as any)
  
  return {
    ...user,
    role: role as AppRole
  } as User
}
```

---

## 🛡️ RLS (Row Level Security)

Les politiques RLS utilisent `auth.jwt() -> 'raw_app_meta_data' ->> 'role'` :

```sql
-- Exemple de politique
CREATE POLICY "Drivers access own rides"
ON rides FOR SELECT
USING (
  driver_id = auth.uid() 
  AND (auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'app_driver'
);

-- Admin policy
CREATE POLICY "Admin full access"
ON rides FOR ALL
USING (
  (auth.jwt() -> 'raw_app_meta_data' ->> 'role') IN ('app_admin', 'app_super_admin')
);
```

---

## 📁 Fichiers Clés

| Fichier | Description |
|---------|-------------|
| `src/lib/types/common.types.ts` | `getAppRole()`, `isAdmin()`, `isDriver()`, `isCustomer()` |
| `src/lib/database/server.ts` | `getServerUser()` utilisant `getAppRole()` |
| `src/components/auth/RoleGuard.tsx` | Guards utilisant `getAppRole()` |
| `supabase/migrations/20250613_setup_role_assignment.sql` | Trigger SQL |

---

## 🧪 Tests

Vérifier que tout est cohérent :

```bash
# Chercher les utilisations incorrectes de user.role
grep -r "user\.role" src/ --include="*.ts" --include="*.tsx"

# Chercher les utilisations correctes
grep -r "getAppRole" src/ --include="*.ts" --include="*.tsx"
```

---

## 📚 Documents Connexes (À jour)

- `trigger-assign-user-role.md` - Documentation du trigger SQL
- `rls-analysis.md` - Analyse des politiques RLS
- `portals-navigation.md` - Navigation entre portails

## 📚 Documents Obsolètes (Ne plus utiliser)

- ❌ `types-adaptation.md` - Utilise `user?.role` (obsolète)
- ❌ `supabase-typing-best-practices.md` - Utilise `user?.role` (obsolète)
- ❌ `auth-implementation-final.md` - Utilise `user.role` (obsolète)
- ❌ `roles-strategy-2025.md` - Utilise `user.role` (obsolète)

---

## 🔄 Migration depuis l'Ancien Système

Si vous trouvez du code utilisant l'ancien système :

```typescript
// 1. Identifier le pattern
user.role === 'app_admin'

// 2. Importer getAppRole
import { getAppRole } from '@/lib/types/common.types'

// 3. Remplacer
const userRole = getAppRole(user)
userRole === 'app_admin'

// Ou utiliser les helpers
import { isAdmin } from '@/lib/types/common.types'
isAdmin(user)
```

---

**✅ Règle d'or : Toujours utiliser `getAppRole()` pour lire le rôle d'un utilisateur.**
