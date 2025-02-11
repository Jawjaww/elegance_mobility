-- Insérer les tarifs de base pour chaque type de véhicule
INSERT INTO rates (vehicle_type, price_per_km, base_price) 
VALUES 
    ('STANDARD', 2.50, 45.00),
    ('LUXURY', 3.50, 75.00),
    ('VAN', 3.00, 55.00)
ON CONFLICT (vehicle_type) 
DO UPDATE SET 
    price_per_km = EXCLUDED.price_per_km,
    base_price = EXCLUDED.base_price,
    updated_at = CURRENT_TIMESTAMP;
