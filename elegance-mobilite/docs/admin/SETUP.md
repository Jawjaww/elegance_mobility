# Configuration du Super Admin

Pour configurer le super administrateur, suivez ces étapes :

1. **Supprimer l'ancien admin**
```bash
node scripts/deleteAdmin.js
```

2. **Appliquer la migration unique**
```bash
# Se connecter à la base de données Supabase
psql [VOTRE_URL_DB]

# Exécuter la migration consolidée
\i database/migrations/20250303_admin_setup.sql
```

3. **Créer le nouveau super admin**
```bash
node scripts/createSuperAdmin.js
```

## Fonctionnement

La nouvelle configuration :
1. Crée un rôle PostgreSQL 'admin' global
2. Pour chaque utilisateur admin :
   - Crée un rôle PostgreSQL basé sur son email (nettoyé)
   - Accorde le rôle admin à ce rôle utilisateur
   - Configure les métadonnées appropriées

## Vérifications

Après l'installation, vérifiez que :

1. Le rôle admin existe :
```sql
SELECT * FROM pg_roles WHERE rolname = 'admin';
```

2. Le rôle utilisateur a été créé (exemple pour "user@example.com") :
```sql
SELECT * FROM pg_roles WHERE rolname = 'user_example_com';
```

3. Les métadonnées sont correctes :
```sql
SELECT email, raw_app_meta_data, raw_user_meta_data 
FROM auth.users 
WHERE raw_app_meta_data->>'role' = 'admin';
```

4. Les politiques sont en place :
```sql
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('rides', 'drivers', 'vehicles');
```

## Dépannage

1. **Si l'erreur "role does not exist" persiste**
   - Vérifiez les rôles créés :
     ```sql
     SELECT rolname FROM pg_roles;
     ```
   - Vérifiez les grants :
     ```sql
     \du
     ```
   - Recréez le rôle manuellement si nécessaire :
     ```sql
     CREATE ROLE user_example_com LOGIN;
     GRANT admin TO user_example_com;
     ```

2. **Si les politiques ne fonctionnent pas**
   - Vérifiez que RLS est activé :
     ```sql
     SELECT relname, relrowsecurity 
     FROM pg_class 
     WHERE relname IN ('rides', 'drivers', 'vehicles');
     ```
   - Vérifiez la fonction is_admin() :
     ```sql
     SELECT is_admin();
     ```

## Notes importantes

- Le nom du rôle PostgreSQL est dérivé de l'email en remplaçant les caractères spéciaux par des underscores
- Exemple : "user@example.com" devient "user_example_com"
- Tous les privilèges sont accordés via le rôle 'admin'
- Chaque utilisateur admin a son propre rôle PostgreSQL
