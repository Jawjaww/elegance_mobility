# 🎯 MÉTHODE UNIQUE DE GESTION DES RÔLES

## ✅ **PATTERN OFFICIEL UNIQUE**

```sql
-- 🔥 MÉTHODE UNIQUE POUR TOUTES LES VÉRIFICATIONS DE RÔLE
EXISTS (
  SELECT 1 FROM auth.users au 
  WHERE au.id = auth.uid() 
  AND (au.raw_app_meta_data ->> 'role') = 'ROLE_NAME'
)
```

## 🚫 **MÉTHODES INTERDITES**

- ❌ `get_user_app_role()` - SUPPRIMÉE
- ❌ `auth.jwt()` - OBSOLÈTE
- ❌ Fonctions intermédiaires

## 📋 **RÔLES DISPONIBLES**

- `app_customer` - Client
- `app_driver` - Chauffeur VTC  
- `app_admin` - Administrateur
- `app_super_admin` - Super administrateur

## 🎯 **RÈGLE D'OR**

> Une seule méthode pour tous les rôles dans tout le projet !
