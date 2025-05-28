# Stratégie de Gestion des Rôles avec Supabase et Next.js 15 (2025)

## Principes Fondamentaux

1. Les rôles sont gérés exclusivement dans Supabase
2. L'application ne fait que vérifier les rôles existants
3. RLS s'occupe de filtrer les données selon les rôles

## Configuration dans Supabase

### 1. Définition des Rôles
Les rôles sont configurés une seule fois dans Supabase :
- app_customer : Utilisateurs standards
- app_driver : Chauffeurs
- app_admin : Administrateurs
- app_super_admin : Super administrateurs

### 2. Stratégie de Création de Rôles Révisée

#### 2.1 Inscription de l'Utilisateur
- Création d'un enregistrement dans auth.users sans attribution immédiate de rôle
- Les utilisateurs sont initialement créés sans rôle spécifique

#### 2.2 Validation des Rôles

Pour les Clients (app_customer):
- Attribution automatique après vérification de l'email
- Pas de validation administrative requise

Pour les Conducteurs (app_driver):
- Validation obligatoire par un administrateur
- Notification envoyée à l'admin pour examen de la demande
- Attribution du rôle uniquement après approbation

#### 2.3 Processus d'Attribution

1. Vérification de l'Email:
   - Attribution automatique du rôle app_customer
   - Déclenchement via Edge Function

2. Notification Admin (Conducteurs):
   - Edge Function pour notifier l'administrateur
   - Interface de validation dans le backoffice

3. Création du Rôle (Conducteurs):
   ```typescript
   // edge-function.ts
   import { createClient } from '@supabase/supabase-js'
   
   export default async function handler(req) {
     const { userId, role } = req.body
     const supabase = createClient('your-supabase-url', 'your-anon-key')
     
     const { error } = await supabase.rpc('create_user_role', {
       user_id: userId,
       role: role,
     })
     
     if (error) {
       return new Response(
         JSON.stringify({ error: error.message }), 
         { status: 400 }
       )
     }
     
     return new Response(
       JSON.stringify({ message: 'Role created successfully' }), 
       { status: 200 }
     )
   }
   ```

## Architecture Applicative

### 1. Server Components
```typescript
// Vérification côté serveur
const user = await getServerUser()
if (!user || user.role !== 'app_customer') {
  redirect('/unauthorized')
}
```

### 2. Politiques RLS
```sql
-- Exemple de politique
create policy "Customers view own data"
on rides
for select
using (
  auth.role() = 'app_customer' 
  and 
  user_id = auth.uid()
);
```

### 3. Client Components
```typescript
// Les composants clients utilisent simplement supabase
// RLS applique automatiquement les restrictions selon le rôle
const { data, error } = await supabase
  .from('rides')
  .select('*');
```

## À Ne Pas Faire

1. Ne pas tenter de SET ROLE dans l'application
2. Ne pas créer/modifier des rôles via le code (sauf via Edge Functions approuvées)
3. Ne pas bypasser RLS avec service_role sauf nécessité absolue
4. Ne pas stocker les rôles en double (base de données + JWT)

## Workflow Type

1. Inscription utilisateur :
   - Via Supabase Auth UI ou API
   - Attribution du rôle selon le processus de validation

2. Authentification :
   - JWT contient le rôle
   - Pas besoin de requête supplémentaire

3. Accès aux données :
   - RLS filtre automatiquement selon le rôle
   - Vérifications supplémentaires dans les Server Components

## Avantages

1. Sécurité :
   - Rôles gérés au niveau base de données
   - Impossible de contourner les restrictions
   
2. Performance :
   - Pas de requêtes supplémentaires pour les rôles
   - Filtrage efficace via RLS

3. Maintenabilité :
   - Logique centralisée dans Supabase
   - Code applicatif plus simple
   - Process de validation clairement défini