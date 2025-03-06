# Configuration des politiques RLS dans Supabase

Pour permettre aux utilisateurs de créer et de consulter leurs propres réservations, vous devez configurer correctement les politiques RLS (Row Level Security) dans Supabase.

## Table `rides`

1. Allez sur le tableau de bord Supabase
2. Naviguez vers "Database" > "Tables" > "rides"
3. Cliquez sur "Policies"
4. Assurez-vous que RLS est activé

### Politique pour INSERTION

Ajoutez une politique qui permet aux utilisateurs authentifiés de créer leurs propres réservations:

```sql
CREATE POLICY "Users can insert their own rides" ON rides
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### Politique pour SÉLECTION

Ajoutez une politique qui permet aux utilisateurs de voir uniquement leurs réservations:

```sql
CREATE POLICY "Users can view their own rides" ON rides
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
```

### Politique pour MISE À JOUR

Ajoutez une politique qui permet aux utilisateurs de mettre à jour uniquement leurs propres réservations:

```sql
CREATE POLICY "Users can update their own rides" ON rides
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);
```

## Table `ride_details`

Pour la table `ride_details`, vous devriez également configurer des politiques RLS:

1. Activez RLS sur la table `ride_details`

2. Ajoutez une politique pour permettre aux utilisateurs d'insérer des détails pour leurs propres trajets:

```sql
CREATE POLICY "Users can insert their own ride details" ON ride_details
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM rides
    WHERE rides.id = ride_details.ride_id
    AND rides.user_id = auth.uid()
  )
);
```

3. Ajoutez une politique pour permettre aux utilisateurs de voir les détails de leurs propres trajets:

```sql
CREATE POLICY "Users can view their own ride details" ON ride_details
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rides
    WHERE rides.id = ride_details.ride_id
    AND rides.user_id = auth.uid()
  )
);
```

Ces politiques garantiront que les utilisateurs ne peuvent voir et modifier que leurs propres données, tout en leur permettant de créer de nouvelles réservations.
