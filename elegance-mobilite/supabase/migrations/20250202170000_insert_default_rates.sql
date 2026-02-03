-- Migration: Insertion des tarifs par défaut
-- Pour les types de véhicules standards

INSERT INTO rates (vehicle_type, base_price, price_per_km, min_price, created_at, updated_at)
VALUES 
  ('STANDARD', 15.00, 2.50, 20.00, NOW(), NOW()),
  ('EXECUTIVE', 30.00, 4.00, 50.00, NOW(), NOW()),
  ('LUXURY', 60.00, 7.00, 100.00, NOW(), NOW()),
  ('VAN', 25.00, 3.50, 40.00, NOW(), NOW()),
  ('ECO', 10.00, 1.80, 15.00, NOW(), NOW())
ON CONFLICT (vehicle_type) DO UPDATE SET
  base_price = EXCLUDED.base_price,
  price_per_km = EXCLUDED.price_per_km,
  min_price = EXCLUDED.min_price,
  updated_at = NOW();

COMMENT ON TABLE rates IS 'Tarifs par type de véhicule';
