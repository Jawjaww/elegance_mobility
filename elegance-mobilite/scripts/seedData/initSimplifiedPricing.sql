-- Nettoyage des données existantes
TRUNCATE TABLE rates CASCADE;
TRUNCATE TABLE options CASCADE;

-- Insertion des tarifs de base pour chaque type de véhicule
INSERT INTO rates (vehicle_type, price_per_km, base_price) VALUES
    ('berline', 2.50, 45.00),    -- Berline standard: prix de base 45€ + 2.50€/km
    ('van', 3.00, 55.00),        -- Van/Minibus: prix de base 55€ + 3.00€/km
    ('luxe', 3.50, 75.00);       -- Véhicule luxe: prix de base 75€ + 3.50€/km

-- Insertion des options disponibles
INSERT INTO options (name, price) VALUES
    ('Siège bébé', 10.00),           -- Option siège bébé: +10€
    ('Rehausseur', 5.00),            -- Option rehausseur: +5€
    ('Accueil pancarte', 15.00),     -- Service accueil avec pancarte: +15€
    ('Aide bagages', 10.00),         -- Service aide aux bagages: +10€
    ('Arrêt multiple', 20.00);       -- Option arrêt supplémentaire: +20€

-- Vérification des insertions
DO $$
BEGIN
    -- Vérifier les tarifs
    IF NOT EXISTS (SELECT 1 FROM rates WHERE vehicle_type IN ('berline', 'van', 'luxe')) THEN
        RAISE EXCEPTION 'Erreur: Les tarifs de base n''ont pas été correctement insérés';
    END IF;

    -- Vérifier les options
    IF NOT EXISTS (SELECT 1 FROM options WHERE name IN ('Siège bébé', 'Rehausseur', 'Accueil pancarte', 'Aide bagages', 'Arrêt multiple')) THEN
        RAISE EXCEPTION 'Erreur: Les options n''ont pas été correctement insérées';
    END IF;

    -- Log du succès
    RAISE NOTICE 'Initialisation des données réussie';
END $$;