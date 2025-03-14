# Système de Réservation - Documentation Complète

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du système](#architecture-du-système)
3. [Composants du formulaire](#composants-du-formulaire)
4. [Intégration de la carte](#intégration-de-la-carte)
5. [Gestion des données](#gestion-des-données)
6. [Flux de réservation](#flux-de-réservation)
7. [Schéma de base de données](#schéma-de-base-de-données)
8. [Sécurité et validation](#sécurité-et-validation)
9. [Optimisations techniques](#optimisations-techniques)
10. [Dépendances système](#dépendances-système)
11. [Architecture détaillée](#architecture-détaillée)

## Vue d'ensemble

Le système de réservation est une application web complexe permettant aux utilisateurs de réserver des services de transport. Il combine plusieurs technologies et fonctionnalités avancées pour offrir une expérience utilisateur fluide et fiable.

### Fonctionnalités principales

- Sélection d'adresses avec autocomplétion
- Intégration de carte interactive
- Calcul de tarifs en temps réel
- Gestion des disponibilités
- Validation de formulaire multi-étapes
- Persistance des données
- Système de paiement sécurisé

## Architecture du système

### Technologies utilisées

- **Frontend**: Next.js v14.0.0 avec TypeScript v5.0.0
- **UI**: Tailwind CSS v3.3.0 pour le styling
- **Carte**: Leaflet v1.9.0 pour l'affichage cartographique
- **Base de données**: Supabase (PostgreSQL v15)
- **API**: REST + tRPC v10.0.0
- **State Management**: Zustand v4.0.0
- **Validation**: Zod v3.0.0
- **Tests**: Jest v29.0.0 + React Testing Library v14.0.0

### Structure détaillée des composants

```
src/
  ├── components/
  │   ├── reservation/
  │   │   ├── ReservationForm.tsx        # Formulaire principal
  │   │   ├── ConfirmationDetails.tsx    # Détails de confirmation
  │   │   ├── DynamicLocationStep.tsx    # Étape de localisation dynamique
  │   │   ├── LocationStep.tsx           # Étape de localisation
  │   │   └── VehicleStep.tsx            # Étape de sélection du véhicule
  │   ├── common/
  │   │   ├── Button.tsx                 # Boutons réutilisables
  │   │   ├── Input.tsx                  # Champs de saisie
  │   │   └── Modal.tsx                  # Fenêtres modales
  │   └── layout/
  │       ├── Header.tsx                 # En-tête de l'application
  │       └── Footer.tsx                 # Pied de page
  ├── hooks/
  │   ├── useReservation.ts             # Logique de réservation
  │   ├── useAddressAutocomplete.ts      # Autocomplétion d'adresse
  │   ├── useMapInteraction.ts           # Interactions carte
  │   └── usePayment.ts                  # Gestion paiement
  ├── store/
  │   ├── reservationStore.ts            # État global réservation
  │   └── userStore.ts                   # État utilisateur
  ├── services/
  │   ├── api.ts                         # Configuration API
  │   ├── geocoding.ts                   # Service géocodage
  │   └── payment.ts                     # Service paiement
  └── utils/
      ├── validation.ts                  # Fonctions validation
      └── formatting.ts                  # Formatage données
```

## Composants du formulaire

### 1. Saisie d'adresse (AutocompleteInput.tsx)

Le composant AutocompleteInput est utilisé pour la saisie et l'autocomplétion des adresses dans le formulaire de réservation. Il est intégré dans les étapes de localisation (LocationStep.tsx et DynamicLocationStep.tsx).
```

### 2. Intégration carte (MapView.tsx)

```typescript
// MapView.tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useMapInteraction } from '@/hooks/useMapInteraction';

interface MapViewProps {
  pickup?: Address;
  dropoff?: Address;
  onLocationSelect?: (location: LatLng) => void;
}

const MapView: React.FC<MapViewProps> = ({ pickup, dropoff, onLocationSelect }) => {
  const { center, zoom, markers, route } = useMapInteraction(pickup, dropoff);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {/* Implémentation des marqueurs et du trajet */}
    </MapContainer>
  );
};
```

## Gestion des données

### Structure complète de la base de données

```sql
-- Table principale des réservations
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  pickup_address JSONB,
  dropoff_address JSONB,
  pickup_time TIMESTAMP WITH TIME ZONE,
  vehicle_type VARCHAR(50),
  status VARCHAR(20),
  total_distance DECIMAL(10,2),
  base_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('PENDING', 'CONFIRMED', 'canceled', 'COMPLETED'))
);

-- Options de réservation
CREATE TABLE reservation_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES reservations(id),
  option_type VARCHAR(50),
  option_value JSONB,
  additional_cost DECIMAL(10,2),
  CONSTRAINT valid_option_type CHECK (option_type IN ('LUGGAGE', 'PETS', 'WHEELCHAIR', 'CHILD_SEAT'))
);

-- Tarifs et règles de prix
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_type VARCHAR(50),
  base_price DECIMAL(10,2),
  price_per_km DECIMAL(10,2),
  minimum_price DECIMAL(10,2),
  peak_hour_multiplier DECIMAL(3,2),
  effective_from TIMESTAMP WITH TIME ZONE,
  effective_to TIMESTAMP WITH TIME ZONE
);

-- Index pour optimisation
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservation_options ON reservation_options(reservation_id);
```

### Gestion d'état avec Zustand

```typescript
// store/reservationStore.ts
import create from 'zustand';

interface ReservationState {
  currentStep: number;
  pickup: Address | null;
  dropoff: Address | null;
  selectedVehicle: VehicleType | null;
  selectedOptions: ReservationOption[];
  price: {
    base: number;
    options: number;
    total: number;
  };
  setPickup: (address: Address) => void;
  setDropoff: (address: Address) => void;
  // ... autres actions
}

export const useReservationStore = create<ReservationState>((set) => ({
  currentStep: 1,
  pickup: null,
  dropoff: null,
  selectedVehicle: null,
  selectedOptions: [],
  price: {
    base: 0,
    options: 0,
    total: 0
  },
  setPickup: (address) => set({ pickup: address }),
  setDropoff: (address) => set({ dropoff: address }),
  // ... implémentation des autres actions
}));
```

## Sécurité et validation

### Validation complète avec Zod

```typescript
// utils/validation.ts
import { z } from 'zod';

export const AddressSchema = z.object({
  formatted_address: z.string().min(1, 'Adresse requise'),
  osm_id: z.string(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),
  metadata: z.object({
    type: z.string(),
    country: z.string(),
    city: z.string().optional()
  }).optional()
});

export const ReservationSchema = z.object({
  pickup_address: AddressSchema,
  dropoff_address: AddressSchema,
  pickup_time: z.date().min(new Date(), 'La date doit être future'),
  vehicle_type: z.enum(['STANDARD', 'PREMIUM', 'VAN']),
  options: z.array(
    z.object({
      type: z.string(),
      value: z.any()
    })
  ).optional(),
  user_details: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/)
  })
});

// Middleware de validation API
export const validateReservation = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const validatedData = ReservationSchema.parse(req.body);
    // Continue with validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};
```

### Sécurité

1. Authentification des utilisateurs (NextAuth.js)
2. Protection CSRF avec tokens
3. Validation des données (Zod)
4. Rate limiting (API routes)
5. Journalisation des actions
6. Sanitization des entrées
7. Encryption des données sensibles

## Tests

### Tests unitaires et d'intégration

```typescript
// __tests__/components/AddressInput.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddressInput } from '@/components/reservation/AddressInput';

describe('AddressInput', () => {
  it('should handle address selection correctly', async () => {
    const onAddressSelect = jest.fn();
    render(
      <AddressInput
        onAddressSelect={onAddressSelect}
        type="pickup"
      />
    );

    // Test implementation
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Paris' } });

    await waitFor(() => {
      expect(screen.getByText('Paris, France')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Paris, France'));
    expect(onAddressSelect).toHaveBeenCalledWith(expect.objectContaining({
      formatted_address: 'Paris, France'
    }));
  });
});

// __tests__/hooks/useReservation.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useReservation } from '@/hooks/useReservation';

describe('useReservation', () => {
  it('should calculate price correctly', () => {
    const { result } = renderHook(() => useReservation());

    act(() => {
      result.current.setDistance(10);
      result.current.setVehicleType('STANDARD');
    });

    expect(result.current.price).toBe(expectedPrice);
  });
});
```

## Déploiement

### Configuration complète

```typescript
// next.config.js
module.exports = {
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_API_URL: process.env.