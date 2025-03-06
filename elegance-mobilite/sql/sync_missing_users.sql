-- Script pour vérifier et ajouter les utilisateurs manquants dans la table public.users

-- Insérer les utilisateurs qui existent dans auth.users mais pas dans public.users
INSERT INTO public.users (id, role, created_at, updated_at)
SELECT 
  au.id, 
  'client', -- rôle par défaut
  au.created_at,
  CURRENT_TIMESTAMP
FROM 
  auth.users au
LEFT JOIN 
  public.users pu ON au.id = pu.id
WHERE 
  pu.id IS NULL;

-- Vérifier que l'insertion a fonctionné
SELECT 
  au.id, 
  au.email,
  pu.id IS NOT NULL as exists_in_public_users,
  pu.role
FROM 
  auth.users au
LEFT JOIN 
  public.users pu ON au.id = pu.id;
