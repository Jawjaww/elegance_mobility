# Support des trajets à plusieurs étapes (multi-stop)

Les trajets avec plusieurs arrêts sont maintenant pris en charge dans l'application Vector Elegans. Cette fonctionnalité permet aux clients de définir un ou plusieurs arrêts intermédiaires entre le point de départ et la destination finale.

## Structure de données

### Table principale: `rides`
Cette table conserve sa structure existante, avec:
- `pickup_address`: Point de départ initial
- `dropoff_address`: Destination finale

### Nouvelle table: `ride_stops`
Cette table stocke tous les arrêts intermédiaires:

```sql
CREATE TABLE public.ride_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL, -- Ordre de l'arrêt dans l'itinéraire
  address TEXT NOT NULL,       -- Adresse de l'arrêt
  lat NUMERIC NULL,            -- Latitude
  lon NUMERIC NULL,            -- Longitude
  estimated_arrival TIMESTAMP WITH TIME ZONE NULL, -- Heure d'arrivée estimée
  estimated_wait_time INTEGER NULL,               -- Temps d'attente estimé en minutes
  notes TEXT NULL,                                -- Notes pour le chauffeur
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Comment utiliser cette fonctionnalité

### Créer une réservation avec plusieurs arrêts

```typescript
// Exemple de création d'une réservation avec plusieurs arrêts
const booking = {
  pickup_address: "123 Rue de Départ, Paris",
  dropoff_address: "789 Rue d'Arrivée, Paris",
  pickup_time: new Date().toISOString(),
  estimated_price: 50,
  // Autres détails de la réservation...
  
  // Arrêts intermédiaires
  stops: [
    {
      address: "456 Rue Intermédiaire, Paris",
      lat: 48.8566,
      lon: 2.3522,
      estimated_wait_time: 10, // Minutes d'attente à cet arrêt
      notes: "Prendre le colis à la réception"
    }
  ]
};

// Créer la réservation
const result = await bookingService.createBooking(booking);
```

### Récupérer une réservation avec ses arrêts

```typescript
// Les arrêts sont automatiquement inclus dans la réponse
const { data: booking } = await bookingService.getBookingById("ride-id");

// Accéder aux arrêts
const stops = booking.stops;
```

### Ajouter un arrêt à une réservation existante

```typescript
// Ajouter un nouvel arrêt à une réservation existante
await bookingService.addRideStop("ride-id", {
  address: "555 Rue Supplémentaire, Paris",
  lat: 48.85,
  lon: 2.34,
  notes: "Deuxième arrêt ajouté"
});
```

## Considérations importantes

1. **Tarification**: Les arrêts supplémentaires peuvent impacter le prix total de la course, selon votre politique de tarification.

2. **Temps de trajet**: Chaque arrêt ajoute du temps au trajet global, à la fois pour le détour et pour le temps d'attente.

3. **Limitations**: Selon votre modèle d'affaires, vous pourriez vouloir limiter le nombre d'arrêts par trajet ou facturer des frais supplémentaires.

4. **Interface utilisateur**: L'interface devra être mise à jour pour permettre l'ajout, la suppression et la réorganisation des arrêts intermédiaires.
