# BUG-001: Fix Redirection Backoffice

> **Problème:** Admin connecté redirigé vers `already-connected` au lieu du backoffice

---

## 🔧 Correctifs Appliqués

### 1. `already-connected/page.tsx`

**Problème:** Utilisait l'ancienne méthode de détection du rôle  
**Solution:** Utilise maintenant `getAppRole()` et supporte `app_super_admin`

```typescript
import { getAppRole } from "@/lib/types/common.types";

const actualRole = getAppRole(user);

if (actualRole === "app_admin" || actualRole === "app_super_admin") {
  dashboardPath = "/backoffice-portal";
}
```

### 2. `auth/login/page.tsx`

**Problème:** Redirigeait toujours vers `already-connected` sans vérifier le contexte  
**Solution:** Vérifie si l'utilisateur peut accéder directement au portail demandé

```typescript
const from = searchParams?.get("from");
const userRole = getAppRole(session.user);

if (
  from === "admin" &&
  (userRole === "app_admin" || userRole === "app_super_admin")
) {
  router.replace("/backoffice-portal");
  return;
}

if (from === "driver" && userRole === "app_driver") {
  router.replace("/driver-portal/dashboard");
  return;
}
```

---

## 🧪 Tests à Effectuer

### Test 1: Admin connecté va au backoffice

```
1. Se connecter comme admin
2. Aller à: http://localhost:3000/backoffice-portal/
3. ✅ Doit afficher le backoffice
4. ❌ Ne doit PAS rediriger vers already-connected
```

### Test 2: Admin connecté va sur login admin

```
1. Se connecter comme admin
2. Aller à: http://localhost:3000/auth/login?from=admin
3. ✅ Doit rediriger vers /backoffice-portal automatiquement
4. ❌ Ne doit PAS afficher la page de login
```

### Test 3: Client connecté va sur login admin

```
1. Se connecter comme client
2. Aller à: http://localhost:3000/auth/login?from=admin
3. ✅ Doit rediriger vers already-connected (pas les droits)
```

### Test 4: Déconnexion et reconnexion

```
1. Se déconnecter
2. Aller à: http://localhost:3000/backoffice-portal/
3. ✅ Doit rediriger vers /auth/login?from=admin
4. Se connecter comme admin
5. ✅ Doit rediriger vers /backoffice-portal après connexion
```

---

## 🔍 Si le problème persiste

### Vérifier la session côté client:

```javascript
await supabase.auth.getSession();
// Doit retourner la session avec l'utilisateur
```

### Vérifier la session côté serveur:

> Note: le projet utilise désormais le flux client‑JWT par défaut. Dans ce mode, la session côté serveur peut être `null` si aucune logique serveur n'instaure de cookie HttpOnly. Préférez vérifier la session côté client avec `supabase.auth.getSession()` et adaptez les pages serveur si vous avez besoin d'une authentification SSR.

### Vérifier les headers:

Les requêtes côté serveur doivent inclure les en‑têtes d'authentification si vous utilisez une stratégie serveur. Sinon, vérifiez la session côté client.

---

## 📝 Notes

- Le problème pourrait venir d'une désynchronisation entre le client et le serveur
- Supabase SSR doit avoir accès aux cookies pour récupérer la session côté serveur
- Si `getServerUser()` retourne null mais que le client a une session, c'est un problème de cookies

---

**Date:** Février 2026  
**Statut:** En cours de test
