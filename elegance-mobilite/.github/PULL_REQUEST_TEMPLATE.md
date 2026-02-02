## 📝 Description

<!-- Décrivez brièvement les changements -->

## 🗄️ Changements Database

<!-- Cochez ce qui s'applique -->
- [ ] Nouvelle table
- [ ] Nouvelle colonne
- [ ] Index ajouté
- [ ] Fonction créée/modifiée
- [ ] RLS activé sur nouvelle table
- [ ] Migration testée en local

## ✅ Checklist

- [ ] J'ai testé les migrations avec `supabase db reset`
- [ ] Les vérifications `./scripts/verify-setup.sh` passent
- [ ] Les vérifications `./scripts/verify-vtc-compliance.sh` passent
- [ ] RLS est activé sur toutes les nouvelles tables
- [ ] Les fonctions SECURITY DEFINER ont un search_path explicite
- [ ] La convention de nommage `YYYYMMDDHHMMSS_description.sql` est respectée

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

