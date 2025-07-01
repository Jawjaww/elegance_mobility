# 🛡️ ARCHITECTURE COMPLÈTE - RÔLES ET RLS (2025)

## 🎯 **STRATÉGIE VALIDÉE ET FONCTIONNELLE**

**✅ Architecture debuggée et corrigée le 30 juin 2025**  
**🚀 Erreurs 403 définitivement résolues**

## 📊 **VISION D'ENSEMBLE DE L'ARCHITECTURE**

### **🔑 Architecture d'Authentification**

```
Frontend (Next.js) 
    ↓ JWT Token avec app_metadata.role
Supabase Auth
    ↓ Politiques RLS (utilisant JWT)
Tables (drivers, rides, users)
    ↓ Données filtrées par rôle
```

## 🎯 **RÔLES DÉFINIS DANS LE SYSTÈME**

### **📋 Hiérarchie des Rôles**

1. **`app_driver`** - Chauffeurs de la plateforme
2. **`app_customer`** - Clients qui réservent des courses  
3. **`app_admin`** - Administrateurs avec accès étendu
4. **`app_super_admin`** - Super administrateurs (accès total)

### **📍 Localisation des Rôles**

- **🔐 Dans le JWT** : `app_metadata.role = "app_driver"` (source de vérité pour RLS)
- **💾 En base** : `auth.users.raw_app_meta_data ->> 'role'` (persistance)
- **⚡ Temps réel** : Les politiques RLS utilisent **UNIQUEMENT** le JWT

## 🛡️ **POLITIQUES RLS PAR TABLE**

### **📁 Table `drivers`**

```sql
-- ✅ Accès au profil personnel
CREATE POLICY "drivers_own_access" ON drivers
FOR ALL USING (user_id = auth.uid());

-- ✅ Accès admin complet
CREATE POLICY "drivers_admin_access" ON drivers
FOR ALL USING (
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('app_admin', 'app_super_admin')
);
```

**Permissions :**
- 🚗 **Driver** : Accès à son propre profil uniquement
- 👑 **Admin** : Accès à tous les profils drivers

### **📁 Table `rides`**

```sql
-- ✅ Voir les courses disponibles (CRITIQUE)
CREATE POLICY "rides_available_for_drivers" ON rides
FOR SELECT USING (
  driver_id IS NULL 
  AND status = 'pending'
  AND (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'app_driver'
);

-- ✅ Accepter une course (UPDATE avec vérification)
CREATE POLICY "rides_accept_by_driver" ON rides
FOR UPDATE USING (
  -- Peut modifier si c'est une course disponible OU sa course assignée
  (
    (driver_id IS NULL AND status = 'pending') -- Course disponible
    OR 
    (driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())) -- Sa course
  )
  AND (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'app_driver'
) WITH CHECK (
  -- Après modification, doit être assignée au driver connecté
  driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
  -- ET statut valide pour un driver
  AND status IN ('scheduled', 'in-progress', 'completed', 'cancelled')
);

-- ✅ Voir ses courses assignées
CREATE POLICY "rides_assigned_to_driver" ON rides
FOR SELECT USING (
  driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
);

-- ✅ Voir ses propres courses (clients)
CREATE POLICY "rides_own_customer" ON rides
FOR SELECT USING (user_id = auth.uid());

-- ✅ Créer des courses (clients)
CREATE POLICY "rides_create_customer" ON rides
FOR INSERT WITH CHECK (user_id = auth.uid());

-- ✅ Accès admin complet
CREATE POLICY "rides_admin_all" ON rides
FOR ALL USING (
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('app_admin', 'app_super_admin')
);
```

**Permissions :**
- 🚗 **Driver** : Voir courses disponibles + ses courses assignées + accepter/modifier/terminer
- 👤 **Customer** : Voir/créer ses propres courses
- 👑 **Admin** : Accès total à toutes les courses

### **📁 Table `users`**

```sql
-- ✅ Voir son profil
CREATE POLICY "user_read_own" ON users
FOR SELECT USING (id = auth.uid());

-- ✅ Modifier son profil
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ✅ Créer son profil
CREATE POLICY "Users can create own profile" ON users
FOR INSERT WITH CHECK (auth.uid() = id);

-- ✅ Accès admin
CREATE POLICY "admin_full_access_users" ON users
FOR ALL USING (is_admin());
```

## 🎯 **PATTERN DE VÉRIFICATION DES RÔLES**

### **✅ PATTERN CORRECT (JWT) - OBLIGATOIRE**

```sql
-- Pour vérifier un rôle spécifique
(auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'app_driver'

-- Pour vérifier plusieurs rôles admin
(auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('app_admin', 'app_super_admin')
```

### **❌ PATTERN INCORRECT (Cause des 403)**

```sql
-- ❌ NE PAS UTILISER - Cause des erreurs 403
auth.users.raw_app_meta_data ->> 'role' = 'app_driver'

-- ❌ NE PAS UTILISER - Obsolète  
EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND ...)
```

## 🔄 **FLUX D'AUTORISATION VALIDÉ**

### **🎯 Scénario : Driver consulte les courses disponibles**

1. **🌐 Frontend** : Requête avec JWT token
2. **🔐 JWT** : Contient `app_metadata.role = "app_driver"`
3. **🛡️ RLS** : Politique `rides_available_for_drivers` s'active
4. **✅ Vérification** : 
   - Course sans driver (`driver_id IS NULL`)
   - Statut pending (`status = 'pending'`)
   - Rôle driver dans JWT (`(auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'app_driver'`)
5. **📊 Résultat** : Courses disponibles retournées

### **🎯 Scénario : Driver accepte une course**

1. **🌐 Frontend** : PATCH avec JWT token
2. **🛡️ RLS UPDATE** : Politique `rides_accept_by_driver` 
3. **✅ USING** : Course disponible OU course assignée + rôle driver dans JWT
4. **✅ WITH CHECK** : `driver_id` assigné + status valide (scheduled, in-progress, completed, cancelled)
5. **📊 Résultat** : Course assignée au driver avec nouveau statut

### **🎯 Scénario : Driver change statut d'une course**

1. **🌐 Frontend** : PATCH pour changer statut (scheduled → in-progress)
2. **🛡️ RLS UPDATE** : Même politique `rides_accept_by_driver`
3. **✅ USING** : Course assignée au driver + rôle driver
4. **✅ WITH CHECK** : Driver reste assigné + nouveau statut valide
5. **📊 Résultat** : Statut mis à jour avec succès

## 🚨 **ERREURS COMMUNES À ÉVITER**

### **1. Utiliser `raw_app_meta_data` au lieu du JWT**
```sql
❌ auth.users.raw_app_meta_data ->> 'role'
✅ (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role'
```

### **2. Oublier le cast JSONB**
```sql
❌ auth.jwt() ->> 'app_metadata' ->> 'role'
✅ (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role'
```

### **3. Mélanger les sources d'autorisation**
```sql
❌ Mélanger JWT + auth.users dans la même politique
✅ Utiliser soit JWT, soit auth.users, pas les deux
```

## 🔧 **MAINTENANCE ET DEBUG**

### **🔍 Vérifier les rôles d'un utilisateur**

```sql
-- Voir le rôle dans auth.users
SELECT raw_app_meta_data ->> 'role' FROM auth.users WHERE id = 'user-uuid';

-- Simuler la vérification JWT (dans l'app)
SELECT (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role';
```

### **🛡️ Tester une politique RLS**

```sql
-- Désactiver RLS temporairement pour test
ALTER TABLE rides DISABLE ROW LEVEL SECURITY;
-- ... faire des tests ...
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
```

### **📊 Lister toutes les politiques**

```sql
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

### **🚨 Diagnostic des erreurs 403**

```sql
-- Vérifier que auth.uid() fonctionne
SELECT auth.uid(), auth.role();

-- Tester la vérification JWT
SELECT (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role';
```

## 📋 **CHECKLIST POUR NOUVELLES POLITIQUES**

### **✅ Avant de créer une politique RLS :**

1. **🔐 Utiliser le JWT** : `(auth.jwt() ->> 'app_metadata')::jsonb ->> 'role'`
2. **⚡ Éviter auth.users** dans les politiques RLS
3. **🎯 Tester avec un utilisateur réel** 
4. **📊 Vérifier les permissions** pour chaque rôle
5. **🚨 Tester les cas d'erreur** (token expiré, rôle incorrect)

## 🎉 **RÉSULTAT DE CETTE ARCHITECTURE**

- ✅ **Sécurité granulaire** par rôle et table
- ✅ **Performance optimale** avec JWT en temps réel
- ✅ **Maintenance simplifiée** avec patterns cohérents
- ✅ **Évolutivité** pour ajouter de nouveaux rôles
- ✅ **Debug facilité** avec patterns clairs
- ✅ **Erreurs 403 éliminées** définitivement

## 🚀 **EXEMPLE D'IMPLÉMENTATION RÉUSSIE**

**Utilisateur testé :** `dc62bd52-0ed7-495b-9055-22635d6c5e74`  
**Rôle JWT :** `app_driver`  
**Email :** `be.j@icloud.com`  
**Statut :** ✅ **Fonctionne parfaitement**

---

**🎯 Architecture validée et fonctionnelle depuis le 30 juin 2025**  
**👨‍💻 Debuggée et optimisée par une équipe de développeurs experts**  
**🚀 Prête pour la production** 🎉
