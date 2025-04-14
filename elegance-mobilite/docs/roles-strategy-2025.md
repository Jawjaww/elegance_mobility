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

### 2. Attribution des Rôles
- Via l'interface Supabase
- Lors de l'inscription selon le contexte (portail client vs portail chauffeur)
- Jamais modifié directement par l'application

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
2. Ne pas créer/modifier des rôles via le code
3. Ne pas bypasser RLS avec service_role sauf nécessité absolue
4. Ne pas stocker les rôles en double (base de données + JWT)

## Workflow Type

1. Inscription utilisateur :
   - Via Supabase Auth UI ou API
   - Rôle attribué automatiquement selon le contexte

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