# 🌿 Workflow Git - Stratégie de Branches

## Modèle : Git Flow simplifié

```
main        ← Production stable (déploiement automatique)
develop     ← Intégration des features (branche par défaut)
feature/*   ← Nouvelles fonctionnalités
hotfix/*    ← Corrections urgentes en production
release/*   ← Préparation de release (optionnel)
```

---

## 🎯 Règles des branches

### `main` - Production
- ✅ **Code testé et stable uniquement**
- ✅ Déploiement automatique vers la production
- ❌ **PAS de commit direct** (sauf hotfix en urgence)
- Les merges se font via PR depuis `develop` ou `hotfix/*`

### `develop` - Développement
- ✅ Branche de travail par défaut
- ✅ Intégration des nouvelles features
- ✅ Tests d'intégration
- Les merges se font via PR depuis `feature/*`

### `feature/*` - Fonctionnalités
- ✅ Créée depuis `develop`
- ✅ Une branche par fonctionnalité
- ✅ Nommage : `feature/nom-de-la-feature`
- ✅ Supprimée après merge

### `hotfix/*` - Correctifs urgents
- ✅ Créée depuis `main` (en cas de bug critique en prod)
- ✅ Mergée dans `main` ET `develop`
- ✅ Nommage : `hotfix/description-du-bug`

---

## 🔄 Workflow quotidien

### 1. Commencer une nouvelle feature

```bash
# S'assurer d'être à jour
git checkout develop
git pull origin develop

# Créer la branche feature
git checkout -b feature/driver-dashboard-redesign

# Travailler, commit, push
git add .
git commit -m "feat: redesign driver dashboard with framer motion"
git push -u origin feature/driver-dashboard-redesign
```

### 2. Créer une Pull Request

1. Aller sur GitHub
2. Créer PR de `feature/driver-dashboard-redesign` → `develop`
3. Ajouter un reviewer
4. Attendre la validation
5. Merge (squash and merge ou merge commit)

### 3. Déployer en production

```bash
# Quand develop est stable
git checkout main
git pull origin main
git merge develop --no-ff -m "Release: driver dashboard redesign"
git push origin main
```

Ou via PR : `develop` → `main`

---

## 📝 Messages de commit conventionnels

```
feat:     Nouvelle fonctionnalité
fix:      Correction de bug
docs:     Documentation
style:    Formatage (pas de changement de code)
refactor: Refactoring
test:     Tests
chore:    Maintenance (deps, config, etc.)
```

**Format :**
```
type(scope): description courte

Description détaillée si nécessaire

- point 1
- point 2
```

**Exemples :**
```
feat(driver): add earnings chart with animations

fix(auth): prevent infinite redirect on login

docs: add git workflow documentation
```

---

## 🛡️ Protection des branches (GitHub)

À configurer dans Settings > Branches :

### `main`
- ✅ Require pull request before merging
- ✅ Require approvals (1 minimum)
- ✅ Dismiss stale PR approvals
- ✅ Require status checks to pass
- ✅ Restrict pushes that create files

### `develop`
- ✅ Require pull request before merging
- ✅ Require approvals (1 minimum)

---

## 🚀 Commandes rapides

```bash
# Nouvelle feature
feat() { git checkout develop && git pull && git checkout -b feature/$1; }
feat driver-dashboard

# Nouveau hotfix  
hotfix() { git checkout main && git pull && git checkout -b hotfix/$1; }
hotfix fix-login-loop

# Push et créer PR
pr() { git push -u origin $(git branch --show-current) && echo "Créer PR sur GitHub"; }

# Nettoyer les branches locales mergées
clean() { git branch --merged develop | grep -v develop | xargs git branch -d; }
```

---

## 📋 Checklist avant merge

- [ ] Code testé localement
- [ ] Pas de `console.log` oubliés
- [ ] Pas de conflits avec `develop`
- [ ] Build passe (`npm run build`)
- [ ] Review approuvée
- [ ] Description de PR claire

---

## 🔄 En résumé

| Action | Branche source | Branche cible | Méthode |
|--------|---------------|---------------|---------|
| Nouvelle feature | `develop` | `feature/*` | Checkout + PR |
| Intégration feature | `feature/*` | `develop` | PR |
| Déploiement prod | `develop` | `main` | PR |
| Hotfix urgent | `main` | `hotfix/*` | Checkout + PR vers main & develop |

**Golden rule :** `main` est sacrée, jamais de push direct !
