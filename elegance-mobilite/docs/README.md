# Documentation Élégance Mobilité

> **Point d'entrée de la documentation technique.**  
> **Dernière mise à jour:** Février 2026

---

## 📚 Documentation Active (À Jour)

### 🔴 Critique (Lire en premier)

| Document | Description |
|----------|-------------|
| [ARCHITECTURE-ROLES.md](./ARCHITECTURE-ROLES.md) | Système de rôles unifié (`getAppRole()`) |
| [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) | Schéma complet de la BDD (18 tables) |
| [GITOPS-WORKFLOW.md](./GITOPS-WORKFLOW.md) | Workflow migrations et déploiement |
| [driver-workflow.md](./driver-workflow.md) | Workflow chauffeur (6 statuts) |
| [rls-analysis.md](./rls-analysis.md) | 47 policies RLS détaillées |

### 🟡 Important (Référence fréquente)

| Document | Description |
|----------|-------------|
| [portals-navigation.md](./portals-navigation.md) | Routes et navigation |
| [TODO-TECHNIQUE.md](./TODO-TECHNIQUE.md) | ⚠️ Bugs et TODOs en cours |
| [supabase_old/migrations/README.md](./supabase_old/migrations/) | Historique des 6 migrations |

### 🟢 Référence (Lire si besoin)

| Document | Description |
|----------|-------------|
| [trigger-assign-user-role.md](./trigger-assign-user-role.md) | Trigger SQL |
| [edge-function-tarif-calculate.md](./edge-function-tarif-calculate.md) | Edge Function prix |
| [BUG-001-REDIRECTION-FIX.md](./BUG-001-REDIRECTION-FIX.md) | Fix redirection backoffice |

---

## 🗺️ Architecture du Système

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DOCUMENTATION ÉLÉGANCE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🔐 AUTHENTIFICATION & RÔLES                                             │
│  ───────────────────────────                                             │
│  ARCHITECTURE-ROLES.md          → getAppRole(), système de rôles        │
│  trigger-assign-user-role.md    → Trigger SQL d'assignation             │
│                                                                          │
│  📊 BASE DE DONNÉES                                                      │
│  ───────────────────                                                     │
│  DATABASE-SCHEMA.md      → Schéma complet (18 tables, 6 enums)          │
│  rls-analysis.md         → 47 policies RLS détaillées                   │
│  driver-workflow.md      → Workflow chauffeur (6 statuts)               │
│                                                                          │
│  🔄 WORKFLOW & DÉPLOIEMENT                                               │
│  ─────────────────────────                                               │
│  GITOPS-WORKFLOW.md      → Comment modifier la BDD                      │
│  supabase_old/migrations/→ Historique des migrations                    │
│                                                                          │
│  🧭 NAVIGATION                                                           │
│  ─────────────                                                           │
│  portals-navigation.md   → Routes des 4 portails                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Démarrage Rapide

### Nouveau développeur ?
1. 📖 Lire [ARCHITECTURE-ROLES.md](./ARCHITECTURE-ROLES.md)
2. 📖 Lire [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md)
3. 📖 Lire [driver-workflow.md](./driver-workflow.md)
4. ⚙️ Configurer l'environnement local

### Modifier la BDD ?
1. 📖 Lire [GITOPS-WORKFLOW.md](./GITOPS-WORKFLOW.md)
2. 📝 Créer une migration (`supabase migration new`)
3. 🧪 Tester avec `supabase db reset`
4. 🔄 Générer les types TypeScript
5. 📤 PR + Review + Merge

### Bug sur les rôles ?
1. 🔍 Vérifier `getAppRole()` dans `src/lib/types/common.types.ts`
2. 🔍 Vérifier le trigger SQL dans `supabase/migrations/`
3. 📖 Consulter [ARCHITECTURE-ROLES.md](./ARCHITECTURE-ROLES.md)

### Bug sur une course ?
1. 🔍 Vérifier les policies RLS dans [rls-analysis.md](./rls-analysis.md)
2. 🔍 Vérifier le statut driver dans [driver-workflow.md](./driver-workflow.md)
3. 🔍 Vérifier les routes dans [portals-navigation.md](./portals-navigation.md)

---

## 🗂️ Structure des Fichiers

```
docs/
├── README.md                           # 🎯 Ce fichier
│
├── 🔴 CRITIQUE (Lire en premier):
│   ├── ARCHITECTURE-ROLES.md          # Système de rôles unifié
│   ├── DATABASE-SCHEMA.md             # Schéma BDD complet (18 tables)
│   ├── GITOPS-WORKFLOW.md             # Workflow de modification
│   ├── driver-workflow.md             # Workflow chauffeur (6 statuts)
│   └── rls-analysis.md                # 47 policies RLS
│
├── 🟡 IMPORTANT (Référence fréquente):
│   ├── portals-navigation.md          # Routes et navigation
│   ├── edge-function-tarif-calculate.md # Edge Function prix
│   └── trigger-assign-user-role.md    # Trigger SQL
│
├── 🟢 RÉFÉRENCE (Lire si besoin):
│   ├── ROLES-MIGRATION-SUMMARY.md     # Résumé migration (temporaire)
│   └── DOCUMENTATION-AUDIT.md         # Audit docs (février 2026)
│
└── supabase_old/
    ├── migrations/
    │   ├── README.md                  # ⭐ Historique 6 migrations
    │   ├── 20250201_add_get_user_role_rpc.sql
    │   ├── 20250613_setup_role_assignment.sql
    │   ├── 20250613_step2_permanent_role_trigger.sql
    │   ├── 20251114_add_driver_vehicles_metadata.sql
    │   ├── 20251117_unify_vehicles.sql
    │   └── 20251117_update_functions_and_triggers.sql
    │
    └── archive/                       # 📦 Documents archivés
        ├── vision-technique/
        └── migrations-historiques/
```

---

## 📊 Réduction de la Dette Documentation

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| Documents racine | 20 | 12 | **-40%** |
| Docs obsolètes | 8 | 0 | **-100%** |
| Documentation active | 12 | 12 | **+100% fiable** |

---

## 📋 Checklists

### ✅ Modifier la BDD
- [ ] Migration créée avec `supabase migration new`
- [ ] Test local avec `supabase db reset`
- [ ] Types TypeScript régénérés (`supabase gen types`)
- [ ] Documentation mise à jour si changement majeur
- [ ] PR créée avec SQL visible

### ✅ Modifier les rôles
- [ ] `getAppRole()` utilisé partout
- [ ] Pas de `user.role` direct
- [ ] Trigger SQL à jour
- [ ] RLS policies testées
- [ ] [ARCHITECTURE-ROLES.md](./ARCHITECTURE-ROLES.md) mis à jour

### ✅ Ajouter un portail/route
- [ ] Layout avec vérification rôle
- [ ] Route ajoutée à [portals-navigation.md](./portals-navigation.md)
- [ ] Redirections configurées
- [ ] Navigation mobile mise à jour

---

## 🆘 Support par Sujet

| Question | Document |
|----------|----------|
| **Comment fonctionnent les rôles ?** | [ARCHITECTURE-ROLES.md](./ARCHITECTURE-ROLES.md) |
| **Quelles sont les tables ?** | [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) |
| **Comment modifier la BDD ?** | [GITOPS-WORKFLOW.md](./GITOPS-WORKFLOW.md) |
| **Pourquoi ce driver ne peut pas accepter de course ?** | [driver-workflow.md](./driver-workflow.md) |
| **Pourquoi cette requête est refusée ?** | [rls-analysis.md](./rls-analysis.md) |
| **Quelle est la route pour X ?** | [portals-navigation.md](./portals-navigation.md) |
| **Comment calculer un prix ?** | [edge-function-tarif-calculate.md](./edge-function-tarif-calculate.md) |

---

## 🔗 Liens Rapides

- **Code source:** `src/lib/types/common.types.ts` (getAppRole)
- **Migrations:** `supabase/migrations/`
- **Schema BDD:** `supabase/migrations/20260201234023_supabase/migrations/init.sql.sql`
- **Types TypeScript:** `src/lib/types/database.types.ts`

---

**Mainteneur:** Équipe Élégance Mobilité  
**Prochaine revue:** Mars 2026
