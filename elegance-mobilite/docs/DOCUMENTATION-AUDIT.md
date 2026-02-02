# Audit de la Documentation - Février 2026

> Analyse complète des documents dans `/docs` avec recommandations d'action.

---

## 📊 Vue d'Ensemble

| Catégorie | Nombre | Action |
|-----------|--------|--------|
| Documents actifs (à jour) | 6 | ✅ Garder |
| Documents à mettre à jour | 3 | 🔄 Mettre à jour |
| Documents à archiver | 3 | 📦 Archiver |
| Documents à supprimer | 8 | 🗑️ Supprimer |

**Total:** 20 documents analysés | **Taille totale:** ~70KB

---

## ✅ Documents à GARDER (Actifs)

### 1. **ARCHITECTURE-ROLES.md** (7.5 KB)
- **Statut:** ✅ À jour
- **Dernier update:** Février 2026
- **Usage:** Référence principale pour le système de rôles
- **Action:** Aucune

### 2. **DATABASE-SCHEMA.md** (17.8 KB) ⭐ NOUVEAU
- **Statut:** ✅ À jour
- **Dernier update:** Février 2026
- **Usage:** Schéma complet de la BDD depuis `init.sql.sql`
- **Action:** Aucune

### 3. **GITOPS-WORKFLOW.md** (6.4 KB) ⭐ NOUVEAU
- **Statut:** ✅ À jour
- **Dernier update:** Février 2026
- **Usage:** Workflow migrations et déploiement
- **Action:** Aucune

### 4. **supabase_old/migrations/README.md** (6.9 KB) ⭐ NOUVEAU
- **Statut:** ✅ À jour
- **Dernier update:** Février 2026
- **Usage:** Historique complet des 6 migrations SQL
- **Action:** Aucune

### 5. **trigger-assign-user-role.md** (2.3 KB)
- **Statut:** ✅ À jour
- **Dernier update:** Janvier 2025
- **Usage:** Documentation du trigger SQL
- **Action:** Aucune (toujours valide)

### 6. **README.md** (5.1 KB) 
- **Statut:** ✅ À jour
- **Dernier update:** Février 2026
- **Usage:** Index central de la documentation
- **Action:** Maintenir à jour quand les docs changent

---

## 🔄 Documents à METTRE À JOUR

### 1. **driver-workflow.md** (2.6 KB) - 🟡 À VÉRIFIER
```markdown
⚠️ PROBLÈMES IDENTIFIÉS:
- Référence des statuts : 'inactive', 'pending_validation', 'active', 'suspended'
- Dans init.sql.sql, les statuts sont: 'pending_validation', 'active', 'inactive', 
  'on_vacation', 'suspended', 'incomplete'
- Manque 'on_vacation' et 'incomplete' dans la doc
- Les fonctions RPC mentionnées (create_pending_driver, validate_driver) 
  ne sont pas dans init.sql.sql

✅ RECOMMANDATION:
Mettre à jour avec:
1. Tous les statuts du driver_status enum
2. Fonctions réelles présentes dans init.sql.sql
3. Workflow auto-update via trigger (incomplete ↔ pending_validation)
```

**Action:** Mettre à jour avec le vrai workflow depuis `init.sql.sql`

---

### 2. **rls-analysis.md** (2.7 KB) - 🟡 À COMPLÉTER
```markdown
⚠️ PROBLÈMES IDENTIFIÉS:
- Documente uniquement les politiques auth.users
- Ne reflète pas toutes les policies de init.sql.sql
- Manque les policies sur rides, drivers, vehicles, etc.

✅ RECOMMANDATION:
Intégrer ou pointer vers DATABASE-SCHEMA.md qui contient toutes les RLS
Ou mettre à jour avec les vraies policies de init.sql.sql:
- rides_accept_by_driver
- rides_admin_all
- rides_available_for_drivers
- drivers_admin_access
- etc.
```

**Action:** Compléter avec toutes les RLS ou fusionner dans DATABASE-SCHEMA.md

---

### 3. **portals-navigation.md** (2.7 KB) - 🟡 À VÉRIFIER
```markdown
⚠️ À VÉRIFIER:
- Structure des portails correcte ?
- Routes toujours valides ?
- Rôles corrects ?

✅ RECOMMANDATION:
Vérifier que les routes mentionnées existent toujours:
- /backoffice-portal/*
- /driver-portal/*
- /client-portal/* → /my-account ?
```

**Action:** Vérifier les routes avec le code actuel

---

## 📦 Documents à ARCHIVER (Conservés mais pas pour usage actif)

### 1. **ce-qui-manque.md** (11 KB) - 📦 ARCHIVER
```markdown
📋 CONTENU: Article générique sur les PWA/optimisations (HTTP/3, Workbox, etc.)
🎯 STATUT: Pas spécifique au projet, informations génériques

✅ RECOMMANDATION:
- Déplacer vers docs/archive/vision-technique/
- Ou supprimer si ce n'est pas une roadmap active
- Ce n'est pas une documentation opérationnelle
```

**Action:** Déplacer vers `docs/archive/`

---

### 2. **migration-roles-24012026.md** (9.5 KB) - 📦 ARCHIVER
```markdown
📋 CONTENU: Scripts SQL de migration des rôles (janvier 2026)
🎯 STATUT: Migration déjà effectuée (user_profiles.role)
⚠️ NOTE: La structure actuelle utilise app_metadata.role, pas user_profiles.role

✅ RECOMMANDATION:
- Archiver comme historique
- Ne pas utiliser pour référence (la stratégie a changé)
```

**Action:** Déplacer vers `docs/archive/migrations-historiques/`

---

### 3. **ROLES-MIGRATION-SUMMARY.md** (7.8 KB) - 📦 ARCHIVER
```markdown
📋 CONTENU: Résumé de la factorisation des rôles (février 2026)
🎯 STATUT: Historique de la migration effectuée

✅ RECOMMANDATION:
- Garder temporairement comme traçabilité
- Archiver dans 3-6 mois quand tout sera stabilisé
- Ou fusionner avec ARCHITECTURE-ROLES.md
```

**Action:** Garder pour l'instant, archiver plus tard

---

## 🗑️ Documents à SUPPRIMER (Remplacés par les nouveaux)

### Documents déjà marqués OBSOLÈTES (supprimer):

| Document | Raison | Remplacement |
|----------|--------|--------------|
| `types-adaptation.md` (2.9 KB) | Utilise `user?.role` | ARCHITECTURE-ROLES.md |
| `supabase-typing-best-practices.md` (4.6 KB) | Patterns obsolètes | ARCHITECTURE-ROLES.md |
| `auth-implementation-final.md` (5.6 KB) | `user.role` direct | ARCHITECTURE-ROLES.md |
| `roles-strategy-2025.md` (4.2 KB) | Approche obsolète | ARCHITECTURE-ROLES.md |

### Autres documents à supprimer:

| Document | Raison | Action |
|----------|--------|--------|
| `database-types-migration.md` (2.2 KB) | Migration effectuée, info générique | 🗑️ Supprimer |
| `generals-rules.md` (1.6 KB) | Trop vague, pas d'info actionable | 🗑️ Supprimer |
| `loading-system-guide.md` (3.5 KB) | Info sur composants UI, pas critique | 🗑️ Supprimer ou fusionner dans README UI |
| `edge-function-tarif-calculate.md` (4.1 KB) | Edge function peut ne plus être utilisée (trigger SQL maintenant) | 🗑️ Vérifier puis supprimer |
| `auth-client-server-architecture.md` (4.7 KB) | Info basique déjà couverte par GITOPS-WORKFLOW.md | 🗑️ Fusionner ou supprimer |

---

## 🎯 Plan d'Action Recommandé

### Phase 1: Suppression Immédiate (Sécurisé)
```bash
# Documents obsolètes déjà marqués
rm docs/types-adaptation.md
rm docs/supabase-typing-best-practices.md
rm docs/auth-implementation-final.md
rm docs/roles-strategy-2025.md

# Documents non critiques
cp docs/loading-system-guide.md docs/archive/ 2>/dev/null || true
rm docs/loading-system-guide.md

rm docs/generals-rules.md
rm docs/database-types-migration.md
```

### Phase 2: Archivage
```bash
mkdir -p docs/archive/{vision-technique,migrations-historiques}

mv docs/ce-qui-manque.md docs/archive/vision-technique/
mv docs/migration-roles-24012026.md docs/archive/migrations-historiques/
```

### Phase 3: Mise à jour
```bash
# À faire manuellement:
# 1. Mettre à jour driver-workflow.md avec le vrai workflow
# 2. Mettre à jour rls-analysis.md ou pointer vers DATABASE-SCHEMA.md
# 3. Vérifier portals-navigation.md
```

### Phase 4: Vérification
```bash
# Vérifier que les Edge Functions sont encore utilisées
ls supabase/functions/
# Si price-calculator n'existe plus → supprimer edge-function-tarif-calculate.md
```

---

## 📁 Structure Finale Proposée

```
docs/
├── README.md                           # ✅ Index central
├── ARCHITECTURE-ROLES.md              # ✅ Rôles
├── DATABASE-SCHEMA.md                 # ✅ Schéma BDD
├── GITOPS-WORKFLOW.md                 # ✅ Workflow
│
├── supabase_old/
│   └── migrations/
│       ├── README.md                  # ✅ Historique migrations
│       └── *.sql                      # ✅ Fichiers SQL
│
├── ⚠️ À mettre à jour:
│   ├── driver-workflow.md             # 🔄 Vérifier statuts
│   ├── rls-analysis.md                # 🔄 Compléter
│   └── portals-navigation.md          # 🔄 Vérifier routes
│
├── 📦 Archive (docs/archive/):
│   ├── vision-technique/
│   │   └── ce-qui-manque.md
│   ├── migrations-historiques/
│   │   └── migration-roles-24012026.md
│   └── ROLES-MIGRATION-SUMMARY.md     # (temporaire)
│
└── 🗑️ Supprimés:
    ├── types-adaptation.md
    ├── supabase-typing-best-practices.md
    ├── auth-implementation-final.md
    ├── roles-strategy-2025.md
    ├── database-types-migration.md
    ├── generals-rules.md
    └── loading-system-guide.md
```

---

## 📊 Réduction de la Dette Technique

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| Documents racine | 20 | 8 | -60% |
| Taille totale | ~70 KB | ~45 KB | -35% |
| Documents obsolètes | 8 | 0 | -100% |
| Documents archivés | 0 | 3 | +3 |

**Bénéfices:**
- 🔍 Plus de confusion possible (pas de docs obsolètes)
- 🚀 Navigation facilitée
- ✅ Source de vérité claire
- 📚 Documentation maintenable

---

**Date d'analyse:** Février 2026  
**Recommandation:** Exécuter Phase 1 et 2 immédiatement, Phase 3 dans la semaine.
