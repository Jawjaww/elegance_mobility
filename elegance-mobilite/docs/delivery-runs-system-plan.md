# Système de Gestion des Courses

## Architecture

### Components
- `DeliveryDatePicker` : Sélecteur de date interactif
- `DailyRunsList` : Liste des courses groupées par jour
- `RunCard` : Carte détaillée d'une course
- `DriverAssignment` : Interface d'attribution des chauffeurs
- `RunStatusBadge` : Badge de statut de course

### State Management
- Store Zustand pour les courses
- Real-time subscriptions Supabase
- State local pour les filtres de date

## Database Schema

```sql
-- Mise à jour de la table courses
ALTER TABLE courses ADD COLUMN
    status VARCHAR NOT NULL DEFAULT 'pending',
    time_window_start TIMESTAMP NOT NULL,
    time_window_end TIMESTAMP NOT NULL,
    customer_name VARCHAR NOT NULL,
    customer_phone VARCHAR,
    customer_email VARCHAR,
    delivery_notes TEXT,
    assigned_driver_id UUID REFERENCES drivers(id),
    vehicle_id UUID REFERENCES vehicles(id),
    updated_at TIMESTAMP DEFAULT NOW()
;

-- Trigger pour les notifications
CREATE OR REPLACE FUNCTION notify_course_update()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'course_updates',
        json_build_object(
            'id', NEW.id,
            'status', NEW.status,
            'assigned_driver_id', NEW.assigned_driver_id,
            'vehicle_id', NEW.vehicle_id
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER course_update_trigger
AFTER UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION notify_course_update();
```

## Features Implementation

### 1. Interface de Date
```typescript
// Composant avec date-picker et filtres
const DeliveryDatePicker = () => {
  // Integration avec react-datepicker
  // Filtres : Jour, Semaine, Mois
  // Callback pour mise à jour des courses
}
```

### 2. Listing des Courses
```typescript
// Vue groupée par jour
const DailyRunsList = () => {
  // Groupement des courses par date
  // Tri par fenêtre horaire
  // Affichage statut et détails essentiels
}
```

### 3. Détails des Courses
```typescript
// Carte détaillée
const RunCard = () => {
  // Adresse avec carte miniature
  // Infos client
  // Statut et contrôles
  // Actions : Assigner, Modifier, Annuler
}
```

### 4. Attribution des Chauffeurs
```typescript
// Interface d'attribution
const DriverAssignment = () => {
  // Liste des chauffeurs disponibles
  // Véhicule auto-assigné
  // Validation des contraintes
}
```

### 5. Mises à jour temps réel
```typescript
// Hook personnalisé
const useRealtimeRuns = () => {
  // Subscription Supabase
  // Mise à jour optimiste
  // Gestion des erreurs
}
```

## Workflow

1. Admin ouvre la vue des courses
2. Sélectionne une date/période
3. Voit toutes les courses pour cette période
4. Peut :
   - Filtrer/Trier les courses
   - Assigner des chauffeurs
   - Modifier les statuts
   - Voir les mises à jour en temps réel

## Notifications

- Notification push au chauffeur lors de l'attribution
- Notification email au client lors des changements de statut
- Notifications dans l'interface admin pour les mises à jour

## Prochaines étapes

1. Créer les composants de base
2. Mettre en place la base de données
3. Implémenter les mises à jour en temps réel
4. Développer l'interface d'attribution
5. Ajouter le système de notifications