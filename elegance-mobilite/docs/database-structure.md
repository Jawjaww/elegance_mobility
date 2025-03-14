# Structure de la base de données Vector Elegans

## Table principale: rides

La table `rides` contient toutes les informations relatives aux trajets. Chaque entrée représente une réservation distincte.

### Structure

```sql
CREATE TABLE public.rides (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NULL REFERENCES users(id),
  status public.ride_status NOT NULL DEFAULT 'pending'::ride_status,
  pickup_address text NOT NULL,
  dropoff_address text NOT NULL,
  pickup_time timestamp with time zone NOT NULL,
  estimated_price numeric NULL,
  driver_id uuid NULL REFERENCES drivers(id),
  override_vehicle_id uuid NULL REFERENCES vehicles(id),
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  pickup_lat numeric NULL,
  pickup_lon numeric NULL,
  dropoff_lat numeric NULL,
  dropoff_lon numeric NULL,
  distance numeric NULL,
  duration integer NULL,
  vehicle_type text NULL,
  options text[] NULL DEFAULT '{}'::text[],
  CONSTRAINT rides_pkey PRIMARY KEY (id)
);
```

### Colonnes principales

- `id`: Identifiant unique de la réservation
- `user_id`: Identifiant de l'utilisateur qui a fait la réservation
- `status`: État de la réservation ('pending', 'confirmed', 'completed', 'canceled')
- `pickup_address`, `dropoff_address`: Adresses textuelles de prise en charge et de destination
- `pickup_time`: Date et heure prévues pour la prise en charge
- `estimated_price`: Prix estimé pour le trajet
- `driver_id`: Identifiant du chauffeur assigné
- `override_vehicle_id`: Identifiant du véhicule spécifique demandé (si différent du véhicule par défaut du chauffeur)
- `pickup_lat`, `pickup_lon`, `dropoff_lat`, `dropoff_lon`: Coordonnées géographiques
- `distance`: Distance du trajet en kilomètres
- `duration`: Durée estimée du trajet en minutes
- `vehicle_type`: Type de véhicule demandé
- `options`: Tableau des options demandées pour le trajet

## Notes sur la conception

1. **Simplification de la structure** : Nous avons consolidé toutes les informations de trajet dans une seule table `rides`, éliminant la redondance et simplifiant les requêtes.

2. **Politiques RLS** : Des politiques de sécurité au niveau des lignes ont été configurées pour garantir que:
   - Les utilisateurs ne peuvent voir et modifier que leurs propres réservations
   - Les chauffeurs ne peuvent voir et modifier que les réservations qui leur sont assignées
   - Les modifications sont restreintes selon l'état de la réservation

3. **Options flexibles** : Le champ `options` est un tableau de texte qui permet de stocker diverses options sans avoir à modifier le schéma.

4. **Horodatages automatiques** : Les champs `created_at` et `updated_at` sont automatiquement mis à jour pour faciliter la gestion des données.
