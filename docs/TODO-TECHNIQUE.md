# TODO Technique - Élégance Mobilité

> **Document de suivi des problèmes techniques à résoudre.**  
> **Date de création:** Février 2026

---

## 🔴 CRITIQUE - Bugs en Cours

### 🐛 BUG-001: Redirection boucle Backoffice

**Statut:** 🔴 En cours  
**Impact:** Bloquant pour les admins  
**Description:** Quand un admin connecté essaie d'accéder au backoffice, il est redirigé vers `/auth/already-connected` au lieu du backoffice.

#### Comportement observé:

1. Utilisateur admin se connecte → connexion réussie
2. Redirection vers `/backoffice-portal/`
3. → Redirigé vers `/auth/login?from=admin`
4. → Redirigé vers `/auth/already-connected?redirect=login`
5. Impossible d'accéder au backoffice

#### Hypothèses:

- [ ] `getServerUser()` retourne `null` côté serveur malgré connexion
- [ ] Problème de cookies entre client/serveur
- [ ] Rôle non détecté correctement dans `AdminGuard`
- [ ] Incohérence entre `supabase.auth.getUser()` côté client vs serveur

#### Fichiers concernés:

- `src/app/backoffice-portal/layout.tsx`
- `src/lib/database/server.ts` (`getServerUser`)
- `src/components/auth/RoleGuard.tsx` (`AdminGuard`)
- `src/app/auth/login/page.tsx`

#### Correctifs appliqués:

- ✅ `already-connected/page.tsx` utilise maintenant `getAppRole()`
- ✅ Support de `app_super_admin` ajouté
- ⏳ Investigation cookies/session nécessaire

#### Tests à faire:

```bash
# 1. Vérifier la session côté client
await supabase.auth.getSession() → doit retourner la session

# 2. Vérifier côté serveur (si vous utilisez l'auth côté serveur)
getServerUser() → retourne null ?
```

---

## 🟡 IMPORTANT - Améliorations RLS

### 🔒 RLS-001: Restreindre `rates` et `seasonal_promotions`

**Statut:** 🟡 À faire  
**Priorité:** Haute (sécurité)  
**Description:** Ces tables ont des RLS trop permissives.

#### Politiques actuelles (problématiques):

```sql
-- rates: Tous les authenticated peuvent INSERT/UPDATE/DELETE
Allow INSERT for authenticated users
Allow UPDATE for authenticated users
Allow DELETE for authenticated users

-- seasonal_promotions: Idem
Allow INSERT/UPDATE/DELETE for authenticated users
```

#### Correctif recommandé:

```sql
-- Supprimer les policies permissives
DROP POLICY "Allow INSERT for authenticated users" ON rates;
DROP POLICY "Allow UPDATE for authenticated users" ON rates;
DROP POLICY "Allow DELETE for authenticated users" ON rates;

-- Créer des policies restrictives
CREATE POLICY "Admin can manage rates" ON rates
FOR ALL TO authenticated
USING (get_user_app_role() IN ('app_admin', 'app_super_admin'));

-- Même chose pour seasonal_promotions
```

#### Migration à créer:

```bash
supabase migration new restrict_rates_rls
```

---

## 🟢 MOYEN - Nettoyage

### 🧹 CLEAN-001: Dédoublonner les policies sur `users`

**Statut:** 🟢 À faire  
**Priorité:** Moyenne  
**Description:** 12 policies sur `users`, dont beaucoup de doublons.

#### Doublons identifiés:

| Policies                           | Action                |
| ---------------------------------- | --------------------- |
| `Users can view own profile` × 3   | Garder 1, supprimer 2 |
| `Users can update own profile` × 3 | Garder 1, supprimer 2 |
| `admin_full_access` × 2            | Fusionner             |

#### Migration à créer:

```bash
supabase migration new cleanup_users_policies
```

---

## 📋 Backlog - Améliorations Futures

### 💡 FEAT-001: Supprimer `ROLES-MIGRATION-SUMMARY.md`

**Échéance:** Juin 2026 (dans 3-4 mois)  
**Raison:** Document historique temporaire, sera obsolète quand tout sera stabilisé

### 💡 FEAT-002: Unifier la détection de rôle

**Idée:** Créer un hook React `useUserRole()` pour remplacer tous les `getAppRole()` manuels

```typescript
export function useUserRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  // Détection cohérente partout
}
```

### 💡 FEAT-003: Tests E2E critiques

**Scénarios à tester:**

1. Inscription driver → complétion → validation admin → connexion
2. Client crée course → driver accepte → course terminée
3. Admin modifie tarifs → recalcul prix

---

## ✅ Résolus Récemment

| ID         | Description                            | Date     | Commit |
| ---------- | -------------------------------------- | -------- | ------ |
| ✅ DOC-001 | Créer documentation unifiée            | Fév 2026 | -      |
| ✅ DOC-002 | Supprimer docs obsolètes               | Fév 2026 | -      |
| ✅ FIX-001 | already-connected utilise getAppRole() | Fév 2026 | -      |

---

## 🔄 Workflow de Résolution

### Pour ajouter un TODO:

1. Créer une entrée avec ID unique (BUG-XXX, RLS-XXX, etc.)
2. Décrire le problème et l'impact
3. Identifier les fichiers concernés
4. Proposer une solution

### Pour résoudre un TODO:

1. Cocher les étapes dans le document
2. Tester la solution
3. Mettre à jour la section "Résolus"
4. Si applicable, mettre à jour la documentation

---

**Mainteneur:** Équipe Élégance Mobilité  
**Revue:** Hebdomadaire
