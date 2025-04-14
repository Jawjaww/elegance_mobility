# Architecture d'Authentification - Elegance Mobilité 2025

## Vue d'ensemble

L'architecture d'authentification d'Elegance Mobilité exploite pleinement les capacités avancées de Supabase avec un focus sur les server components de Next.js, la sécurité côté serveur et l'utilisation des rôles natifs PostgreSQL pour une gestion fine des accès aux données.

## Technologies clés

- **Supabase Auth** (dernière version) avec Server-Side Implementation
- **Next.js App Router** avec Server Components
- **Row Level Security (RLS)** de PostgreSQL
- **API getAll et setAll** de Supabase pour une gestion optimisée des sessions
- **Rôles utilisateurs spécifiques** pour un contrôle d'accès granulaire

## Structure de la base de données

### Table rides (principale)

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique de la course (clé primaire) |
| user_id | UUID | Identifiant de l'utilisateur qui a demandé la course |
| driver_id | UUID | Identifiant du conducteur assigné à la course |
| override_vehicle_id | UUID | Identifiant du véhicule utilisé pour la course |
| status | Enum | Statut de la course (pending, completed, canceled, etc.) |
| pickup_address | Text | Adresse de prise en charge |
| pickup_lat | Numeric | Latitude de prise en charge |
| pickup_lon | Numeric | Longitude de prise en charge |
| dropoff_address | Text | Adresse de dépose |
| dropoff_lat | Numeric | Latitude de dépose |
| dropoff_lon | Numeric | Longitude de dépose |
| pickup_time | Timestamp | Date et heure de prise en charge |
| distance | Numeric | Distance de la course en km |
| duration | Integer | Durée de la course en minutes |
| vehicle_type | Text | Type de véhicule utilisé pour la course |
| options | Text[] | Options supplémentaires pour la course |
| estimated_price | Numeric | Prix estimé de la course |
| final_price | Numeric | Prix final de la course |
| created_at | Timestamp | Date de création de la course |
| updated_at | Timestamp | Date de la dernière mise à jour de la course |

## Structure de la base de données

### Table principale: rides

Notre principale table `rides` stocke toutes les réservations de transport avec la structure suivante:

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique de la course (clé primaire) |
| user_id | UUID | Identifiant de l'utilisateur qui a demandé la course |
| driver_id | UUID | Identifiant du conducteur assigné (peut être NULL) |
| override_vehicle_id | UUID | Identifiant du véhicule utilisé (peut être NULL) |
| status | Enum | Statut de la course (pending, completed, canceled, etc.) |
| pickup_address | Text | Adresse de prise en charge |
| pickup_lat | Numeric | Latitude de prise en charge |
| pickup_lon | Numeric | Longitude de prise en charge |
| dropoff_address | Text | Adresse de dépose |
| dropoff_lat | Numeric | Latitude de dépose |
| dropoff_lon | Numeric | Longitude de dépose |
| pickup_time | Timestamp with TZ | Date et heure de prise en charge |
| distance | Numeric | Distance de la course en km |
| duration | Integer | Durée de la course en minutes |
| vehicle_type | Text | Type de véhicule utilisé |
| options | Text[] | Options supplémentaires sous forme de tableau |
| estimated_price | Numeric | Prix estimé de la course |
| final_price | Numeric | Prix final de la course |
| created_at | Timestamp with TZ | Date de création de l'enregistrement |
| updated_at | Timestamp with TZ | Date de dernière mise à jour |

## Architecture technique

### 1. Authentification côté serveur

Contrairement aux implémentations traditionnelles basées sur le client, notre architecture utilise principalement l'authentification côté serveur, ce qui offre plusieurs avantages :

```typescript
// Exemple d'implémentation serveur
import { createServerClient } from '@supabase/ssr'

export async function getServerSession() {
  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => cookieStore.set(name, value, options),
        remove: (name, options) => cookieStore.delete(name, options),
      },
    }
  )
  
  return await supabase.auth.getSession()
}
```

### 2. Utilisation des API getAll et setAll

En 2025, les nouvelles API getAll et setAll de Supabase sont maintenant la méthode recommandée pour gérer les sessions plutôt que les opérations individuelles sur les cookies :

```typescript
// Gestion moderne des cookies avec getAll/setAll
export async function updateSession(request) {
  // Récupérer tous les cookies d'un coup
  const cookies = supabase.auth.cookies.getAll({ request })
  
  // Définir tous les cookies d'un coup pour la réponse
  const response = new Response()
  supabase.auth.cookies.setAll(response, cookies)
  
  return response
}
```

### 3. Rôles natifs PostgreSQL

Notre système utilise les rôles natifs PostgreSQL pour définir des niveaux d'accès précis :

- **anon** : Utilisateurs non authentifiés (accès très limité)
- **authenticated** : Utilisateurs standards (clients)
- **driver** : Chauffeurs avec accès au portail spécifique
- **admin** : Administrateurs avec accès complet au backoffice

Ces rôles sont directement mappés aux politiques RLS de PostgreSQL pour un contrôle d'accès granulaire au niveau de la base de données.

### 4. Politiques RLS (Row Level Security)

Exemple de politique RLS pour la table des réservations :

```sql
-- Politique pour les réservations des clients
CREATE POLICY "Les utilisateurs peuvent voir uniquement leurs propres réservations" 
ON public.rides
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Politique pour les réservations des chauffeurs
CREATE POLICY "Les chauffeurs peuvent voir les réservations qui leur sont assignées" 
ON public.rides
FOR SELECT
TO driver
USING (driver_id = auth.uid() OR status = 'unassigned');

-- Politique pour les admins
CREATE POLICY "Les admins peuvent tout voir et modifier" 
ON public.rides
FOR ALL
TO admin
USING (true);
```

### 5. Middleware d'authentification Next.js

Notre middleware centralise la logique de redirection et de vérification des routes protégées :

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Création du client Supabase pour le middleware
  const supabase = createServerClient(...)
  
  // Vérification de session
  const { data: { session } } = await supabase.auth.getSession()
  
  // Logique de redirection basée sur les rôles
  if (pathname.startsWith('/backoffice-portal') && 
      (!session?.user || !session.user.app_metadata?.role === 'admin')) {
    return NextResponse.redirect(new URL('/backoffice-portal/login', request.url))
  }
  
  // Autres vérifications pour les différents portails...
  
  return NextResponse.next()
}
```

### 6. Automatisation via Supabase

Notre architecture utilise les fonctionnalités d'automatisation de Supabase :

- **Triggers PostgreSQL** pour la mise à jour automatique des statuts
- **Fonctions de base de données** pour les vérifications complexes
- **Webhooks** pour l'intégration avec des systèmes externes (paiements, notifications)
- **Edge Functions** pour la logique métier complexe

```sql
-- Exemple de trigger PostgreSQL pour l'attribution automatique des chauffeurs
CREATE OR REPLACE FUNCTION public.assign_driver_to_ride()
RETURNS TRIGGER AS $$
BEGIN
  -- Logique d'assignation basée sur la proximité et la disponibilité
  -- ...
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_assign_driver
AFTER INSERT ON public.rides
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.assign_driver_to_ride();
```

## Flux d'authentification

1. **Inscription/Connexion**
   - L'utilisateur saisit ses identifiants
   - Authentification gérée par Supabase Auth
   - Création/Récupération de session côté serveur
   - Attribution du rôle basée sur les métadonnées du compte

2. **Accès aux données**
   - Requêtes directes à Supabase depuis les Server Components
   - Filtrage automatique basé sur les politiques RLS
   - Vérifications supplémentaires via middleware pour les routes protégées

3. **Déconnexion**
   - Gestion côté serveur avec nettoyage de session
   - Invalidation des jetons d'accès

## Types Supabase et Structure de Données

### Structure des Types Natifs Supabase

Notre application utilise strictement les types natifs Supabase sans aucun mapping personnalisé :

```typescript
// Structure exacte du type AuthUser de Supabase
export type AuthUser = {
    instance_id: string | null;
    id: string; // UUID
    aud: string | null;
    role: string | null;
    email: string | null;
    encrypted_password: string | null;
    email_confirmed_at: string | null; // Timestamp
    invited_at: string | null; // Timestamp
    confirmation_token: string | null;
    confirmation_sent_at: string | null; // Timestamp
    recovery_token: string | null;
    recovery_sent_at: string | null; // Timestamp
    email_change_token_new: string | null;
    email_change: string | null;
    email_change_sent_at: string | null; // Timestamp
    last_sign_in_at: string | null; // Timestamp
    raw_app_meta_data: object | null; // JSONB
    raw_user_meta_data: object | null; // JSONB
    created_at: string | null; // Timestamp
    updated_at: string | null; // Timestamp
    phone: string | null;
    phone_confirmed_at: string | null; // Timestamp
    phone_change: string | null;
    phone_change_token: string | null;
    phone_change_sent_at: string | null; // Timestamp
    confirmed_at: string | null; // Timestamp
    email_change_token_current: string | null;
    email_change_confirm_status: number | null;
    banned_until: string | null; // Timestamp
    reauthentication_token: string | null;
    reauthentication_sent_at: string | null; // Timestamp
    is_sso_user: boolean;
    deleted_at: string | null; // Timestamp
    is_anonymous: boolean;
};
```

### Principes d'Utilisation

1. **Pas de Mapping Personnalisé**
   - Utilisation directe des types Supabase
   - Adaptation de l'application aux structures Supabase
   - Maintien de la cohérence avec la base de données

2. **Accès aux Données Utilisateur**
   - Utilisation de `raw_user_meta_data` pour les métadonnées
   - Accès aux propriétés via la structure native
   - Respect des nullabilités définies par Supabase

3. **Gestion des Sessions**
   - Types de session conformes à la structure Supabase
   - Utilisation des jetons et métadonnées standards
   - Respect du cycle de vie des sessions Supabase

### Exemples d'Utilisation dans les Composants

```typescript
// Utilisation correcte des métadonnées utilisateur
function UserProfile({ user }: { user: AuthUser }) {
  // Accès aux métadonnées via raw_user_meta_data
  const userName = user.raw_user_meta_data?.name
  const userPhone = user.raw_user_meta_data?.phone

  return (
    <div>
      <h2>{userName || user.email}</h2>
      {userPhone && <p>Téléphone: {userPhone}</p>}
    </div>
  )
}

// Gestion des rôles
function RoleBasedAccess({ user }: { user: AuthUser }) {
  // Vérification du rôle via la structure native
  const isAdmin = user.role === 'app_admin' || user.role === 'app_super_admin'
  const isDriver = user.role === 'app_driver'

  return (
    <nav>
      {isAdmin && <AdminPanel />}
      {isDriver && <DriverDashboard />}
    </nav>
  )
}
```

### Migration des Composants Existants

Pour adapter les composants existants à la structure Supabase :

1. Remplacer `user.user_metadata` par `user.raw_user_meta_data`
2. Utiliser directement `user.role` pour les vérifications de rôles
3. Accéder aux timestamps via les champs natifs (`created_at`, etc.)

## Avantages de cette architecture

- **Sécurité renforcée** : Les clés d'API sensibles restent côté serveur
- **Performance optimisée** : Réduction du bundle JavaScript côté client
- **Maintenance simplifiée** : Centralisation de la logique d'authentification
- **Scalabilité** : Séparation claire des responsabilités et utilisation des capacités natives de PostgreSQL
- **Meilleure expérience développeur** : API cohérentes et simplicité d'implémentation

## Considérations futures

- Exploration de l'authentification à deux facteurs (2FA) pour les comptes administrateurs
- Implémentation de la fédération d'identité pour une connexion simplifiée via des fournisseurs tiers
- Audit régulier des politiques RLS pour s'assurer de leur efficacité et pertinence
