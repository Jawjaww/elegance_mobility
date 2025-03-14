# Configuration des politiques RLS pour la table "rides"

## Étape 1: Activer RLS sur la table rides

```sql
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
```

## Étape 2: Créer les politiques pour les utilisateurs standards

### Politique pour INSERTION - Utilisateurs

Cette politique permet aux utilisateurs authentifiés de créer leurs propres réservations:

```sql
CREATE POLICY "Users can insert their own rides" ON rides
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### Politique pour SÉLECTION - Utilisateurs

Cette politique permet aux utilisateurs de voir uniquement leurs propres réservations:

```sql
CREATE POLICY "Users can view their own rides" ON rides
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
```

### Politique pour MISE À JOUR - Utilisateurs

Cette politique permet aux utilisateurs de mettre à jour uniquement leurs propres réservations et seulement si elles sont en état "pending":

```sql
CREATE POLICY "Users can update their pending rides" ON rides
FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND status = 'pending');
```

### Politique pour SUPPRESSION - Utilisateurs

Cette politique permet aux utilisateurs de supprimer uniquement leurs propres réservations en état "pending":

```sql
CREATE POLICY "Users can delete their pending rides" ON rides
FOR DELETE TO authenticated
USING (auth.uid() = user_id AND status = 'pending');
```

## Étape 3: Créer des politiques pour les administrateurs (optionnel)

Si vous avez un rôle admin défini dans votre application, vous pouvez ajouter ces politiques:

```sql
-- D'abord créer le rôle admin s'il n'existe pas
-- (remplacez cette étape par votre propre méthode de gestion des rôles)
CREATE ROLE admin;

-- Permettre aux administrateurs de voir toutes les réservations
CREATE POLICY "Admins can view all rides" ON rides
FOR SELECT TO admin USING (true);

-- Permettre aux administrateurs de modifier toutes les réservations
CREATE POLICY "Admins can update all rides" ON rides
FOR UPDATE TO admin USING (true);

-- Permettre aux administrateurs de supprimer n'importe quelle réservation
CREATE POLICY "Admins can delete all rides" ON rides
FOR DELETE TO admin USING (true);
```

## Étape 4: Créer des politiques pour les chauffeurs (optionnel)

Si vous voulez que les chauffeurs puissent voir et mettre à jour uniquement leurs propres assignations:

```sql
-- Créer le rôle chauffeur si nécessaire
CREATE ROLE driver;

-- Permettre aux chauffeurs de voir les courses qui leur sont assignées
CREATE POLICY "Drivers can view their assigned rides" ON rides
FOR SELECT TO driver
USING (driver_id = auth.uid());

-- Permettre aux chauffeurs de mettre à jour le statut des courses qui leur sont assignées
CREATE POLICY "Drivers can update their assigned rides" ON rides
FOR UPDATE TO driver
USING (driver_id = auth.uid())
WITH CHECK (driver_id = auth.uid() AND 
           (NEW.status IN ('confirmed', 'completed', 'canceled')));
```

## Vérification des politiques en place

Pour vérifier les politiques existantes sur la table:

```sql
SELECT * FROM pg_policies WHERE tablename = 'rides';
```
