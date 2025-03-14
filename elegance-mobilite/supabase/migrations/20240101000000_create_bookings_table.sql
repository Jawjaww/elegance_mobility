-- Création de la table des réservations

-- Création d'un type enum pour les statuts de réservation
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'canceled');

-- Création de la table des réservations
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_lat NUMERIC(10, 6) NOT NULL,
  pickup_lon NUMERIC(10, 6) NOT NULL,
  dropoff_address TEXT NOT NULL,
  destination_lat NUMERIC(10, 6) NOT NULL,
  destination_lon NUMERIC(10, 6) NOT NULL,
  pickup_time TIMESTAMPTZ NOT NULL,
  vehicle_type TEXT NOT NULL,
  distance NUMERIC(10, 2) NOT NULL,
  duration NUMERIC(10, 2),
  options TEXT[] DEFAULT '{}',
  status booking_status NOT NULL DEFAULT 'pending',
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Ajouter un trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Définir les politiques RLS (Row Level Security) pour la table bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Politiques pour les utilisateurs
-- 1. Les utilisateurs peuvent voir uniquement leurs propres réservations
CREATE POLICY "Users can view their own bookings"
  ON public.bookings
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Les utilisateurs peuvent créer leurs propres réservations
CREATE POLICY "Users can create their own bookings"
  ON public.bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Les utilisateurs peuvent mettre à jour uniquement leurs propres réservations
CREATE POLICY "Users can update their own bookings"
  ON public.bookings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ajout d'un index pour accélérer les recherches par user_id
CREATE INDEX bookings_user_id_idx ON public.bookings(user_id);
