-- Table d'extension pour stocker les informations supplémentaires sur les trajets

CREATE TABLE public.ride_details (
  ride_id UUID PRIMARY KEY REFERENCES public.rides(id) ON DELETE CASCADE,
  pickup_lat NUMERIC(10, 6),
  pickup_lon NUMERIC(10, 6),
  dropoff_lat NUMERIC(10, 6),
  dropoff_lon NUMERIC(10, 6),
  distance NUMERIC(10, 2),
  duration NUMERIC(10, 2),
  options TEXT[] DEFAULT '{}',
  vehicle_type public.vehicle_type_enum,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_ride_details_updated_at
BEFORE UPDATE ON public.ride_details
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE public.ride_details ENABLE ROW LEVEL SECURITY;

-- Utilisateurs peuvent voir leurs propres détails de trajet
CREATE POLICY "Users can view their own ride details" ON public.ride_details
  USING (ride_id IN (SELECT id FROM public.rides WHERE user_id = auth.uid()));

-- Conducteurs peuvent voir les détails des trajets qui leur sont assignés
CREATE POLICY "Drivers can view their assigned ride details" ON public.ride_details
  USING (ride_id IN (SELECT id FROM public.rides WHERE driver_id IN 
    (SELECT id FROM public.drivers WHERE user_id = auth.uid())));
