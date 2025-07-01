# 📚 INDEX DE LA DOCUMENTATION - ELEGANCE MOBILITÉ

## 🎯 **DOCUMENTATION ESSENTIELLE (À JOUR)**

### **🛡️ Sécurité et Authentification**
- **`roles-rls-architecture-finale.md`** 🔥 **PRINCIPALE** - Architecture complète des rôles et RLS
- **`SOLUTION-ERREURS-403-FINALE.md`** 🎯 **RÉSOLUTION** - Solution définitive aux erreurs 403

### **🧹 Maintenance et Nettoyage**
- **`NETTOYAGE-EFFECTUE.md`** ✅ **RÉCENT** - Résumé du nettoyage du projet
- **`scripts/fix-jwt-rls-final.sql`** 🔧 **SCRIPT** - Correction fonctionnelle des RLS

### **📁 Architecture Générale**
- **`README.md`** 📖 **MISE À JOUR** - Guide principal du projet
- **`project-architecture-overview.md`** 🏗️ Architecture générale

## 🗂️ **DOCUMENTATION SPÉCIALISÉE**

### **🗺️ Cartographie**
- `fix-maplibre-restart-loop.md` - Correction des boucles MapLibre
- `vector-tiles-configuration.md` - Configuration des tuiles vectorielles

### **📱 Frontend**
- `tanstack-zustand-migration.md` - Migration TanStack Query + Zustand
- `portals-navigation.md` - Navigation entre portails

### **🛢️ Base de Données**
- `database-types-migration.md` - Migration des types de données
- `supabase-typing-best-practices.md` - Bonnes pratiques Supabase

## ❌ **DOCUMENTATION OBSOLÈTE (NE PAS UTILISER)**

### **🗑️ Fichiers RLS obsolètes :**
- ~~`roles-strategy-2025.md`~~ → Remplacé par `roles-rls-architecture-finale.md`
- ~~Tous les fichiers `debug-*.sql`~~ → Supprimés après résolution
- ~~Tous les fichiers `diagnostic-*.sql`~~ → Supprimés après résolution

## 🎯 **GUIDE DE LECTURE RAPIDE**

### **🚀 Pour démarrer le projet :**
1. Lire `README.md`
2. Comprendre `roles-rls-architecture-finale.md`

### **🔧 Pour maintenir la sécurité :**
1. Référer à `roles-rls-architecture-finale.md`
2. Utiliser le pattern JWT : `(auth.jwt() ->> 'app_metadata')::jsonb ->> 'role'`
3. Éviter `raw_app_meta_data` dans les politiques RLS

### **🐛 Pour résoudre des erreurs 403 :**
1. Consulter `SOLUTION-ERREURS-403-FINALE.md`
2. Vérifier les patterns dans `roles-rls-architecture-finale.md`
3. Appliquer `scripts/fix-jwt-rls-final.sql` si nécessaire

### **🧹 Pour maintenir le projet :**
1. Consulter `NETTOYAGE-EFFECTUE.md` pour l'organisation
2. Supprimer les fichiers obsolètes régulièrement
3. Documenter les nouvelles fonctionnalités

## 📊 **STATUT DE LA DOCUMENTATION**

- ✅ **À jour** - Correspond à l'état actuel du projet
- 🔥 **Critique** - Documentation essentielle pour le fonctionnement
- 🎯 **Résolution** - Documente la solution à un problème spécifique
- 🧹 **Maintenance** - Guide pour maintenir le projet propre
- ❌ **Obsolète** - Ne plus utiliser, peut être supprimé

---

**📅 Dernière mise à jour :** 30 juin 2025  
**🎯 Statut global :** Documentation complète et à jour  
**🚀 Prêt pour :** Production et maintenance
