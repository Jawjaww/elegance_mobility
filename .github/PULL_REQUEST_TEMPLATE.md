## 📝 Description

<!-- Décrivez brièvement les changements -->

## 🗄️ Changements Database

Les migrations SQL vivent dans **`infra-supabase`** (pas dans ce repo). Si cette PR touche le schéma :

- [ ] Migration ajoutée dans `infra-supabase/supabase/migrations/`
- [ ] `./scripts/prepare-db-change.sh` exécuté en local (infra-supabase)
- [ ] `database.types.ts` resynchronisé (infra + ce repo si le bot ne l’a pas encore fait)

## ✅ Checklist

- [ ] Pas de fichier SQL dans `elegance-mobilite/supabase/migrations/` (dossier réservé, voir README)
- [ ] Les vérifications `./scripts/verify-setup.sh` passent (si applicable)
- [ ] Les vérifications `./scripts/verify-vtc-compliance.sh` passent (si applicable)

## 🧪 Tests effectués

```bash
# Résultat des tests
./scripts/verify-setup.sh
# ✅ Tous les tests passent
```

## 📸 Captures d'écran (si applicable)

<!-- Schema Designer, résultats de tests... -->

## 🔗 Issues liées

Fixes # (numéro d'issue)

## ⚠️ Breaking Changes

<!-- Y a-t-il des changements cassants ? -->
- [ ] Non
- [ ] Oui (décrire ci-dessous)

