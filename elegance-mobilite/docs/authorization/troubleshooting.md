# Troubleshooting de l'Autorisation

## Erreur 500 sur /api/rides

Si vous rencontrez une erreur 500 en accédant à `/api/rides`, cela peut être dû à un manque de configuration RLS (Row Level Security) sur la table rides. 

### Solution

1. Appliquez la migration `20250303_08_rides_policy.sql` pour configurer RLS :
```bash
psql -U postgres -d postgres -f database/migrations/20250303_08_rides_policy.sql
```

Cette migration :
- Active RLS sur la table rides
- Crée la policy permettant l'accès aux admins
- Configure les permissions nécessaires

### Vérification

Après avoir appliqué la migration, vous pouvez vérifier que :
1. La policy est bien créée :
```sql
SELECT * FROM pg_policies WHERE tablename = 'rides';
```

2. RLS est activé sur la table :
```sql
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'rides';
```

3. Les permissions sont correctes :
```sql
\z rides
```

## Autres Problèmes d'Autorisation

Si vous rencontrez d'autres problèmes d'autorisation :

1. Vérifiez que l'utilisateur a le bon rôle dans `auth.users` :
```sql
SELECT email, raw_app_meta_data->>'role' as role 
FROM auth.users;
```

2. Vérifiez que le rôle PostgreSQL est correctement attribué :
```sql
SELECT r.rolname, m.admin_option
FROM pg_auth_members m
JOIN pg_roles a ON (m.admin = a.oid)
JOIN pg_roles r ON (m.member = r.oid)
WHERE a.rolname = 'admin';
