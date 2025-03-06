# Gestion des utilisateurs dans Supabase

## Structure optimisée

Dans Supabase, la gestion des utilisateurs est partagée entre le système d'authentification et votre base de données:

### 1. auth.users (Géré par Supabase)

Cette table est **automatiquement gérée par Supabase Auth** et contient:
- Informations d'authentification (email, mot de passe haché)
- Méthodes d'authentification (email/mot de passe, OAuth, etc.)
- Statut du compte (confirmé, banni, etc.)

**Important**: Ne jamais modifier directement cette table.

### 2. public.users (Notre table personnalisée)

Cette table étend les données utilisateur avec:
- Informations de profil (nom, photo, etc.)
- Rôle dans l'application (client, chauffeur, admin)
- Préférences et paramètres
- Relations avec d'autres tables (réservations, véhicules, etc.)

## Synchronisation automatique

Nous utilisons un **trigger PostgreSQL** pour garantir que chaque fois qu'un utilisateur est créé dans `auth.users`, une entrée correspondante est créée dans `public.users`.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, role, created_at, updated_at)
  VALUES (
    new.id, 
    'client',
    new.created_at,
    new.created_at
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Bonnes pratiques

1. **Clé primaire partagée**: Utilisez toujours `user.id` de l'authentification comme clé primaire dans `public.users`

2. **Suppression en cascade**: Configurez la contrainte de clé étrangère avec `ON DELETE CASCADE` pour que la suppression d'un utilisateur dans le système d'authentification supprime automatiquement ses données associées

3. **Autorisations via RLS**: Utilisez des politiques RLS pour restreindre l'accès aux données en fonction de l'identité de l'utilisateur authentifié:

```sql
CREATE POLICY "Users can view their own profile" ON users
FOR SELECT TO authenticated
USING (id = auth.uid());
```

4. **Ne pas dupliquer les données**: Stockez uniquement les informations supplémentaires dans `public.users` et référencez les données d'authentification via le lien d'ID

Cette approche garantit une gestion propre des utilisateurs sans multiplication inutile des tables.
