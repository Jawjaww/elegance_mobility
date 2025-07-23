-- Script pour tester la récupération des documents existants
-- Ce script simule un profil avec des documents déjà uploadés

-- 1. Vérifier un driver existant avec ses documents
SELECT 
    d.id,
    d.user_id,
    d.first_name,
    d.last_name,
    d.document_urls,
    d.status
FROM drivers d
WHERE d.user_id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74'
LIMIT 1;

-- 2. Vérifier la structure du champ document_urls
SELECT 
    d.first_name,
    d.last_name,
    jsonb_pretty(d.document_urls) as documents_formates
FROM drivers d
WHERE d.document_urls IS NOT NULL
LIMIT 3;

-- 3. Extraire les types de documents disponibles
SELECT 
    d.id,
    d.first_name,
    d.last_name,
    jsonb_object_keys(d.document_urls) as type_document
FROM drivers d
WHERE d.document_urls IS NOT NULL;

-- 4. Compter les documents par type
SELECT 
    jsonb_object_keys(d.document_urls) as type_document,
    COUNT(*) as nombre_drivers
FROM drivers d
WHERE d.document_urls IS NOT NULL
GROUP BY jsonb_object_keys(d.document_urls)
ORDER BY nombre_drivers DESC;

-- 5. Exemple de mise à jour d'un document (pour test)
-- Cette requête montre comment ajouter/mettre à jour un document
/*
UPDATE drivers 
SET document_urls = COALESCE(document_urls, '{}'::jsonb) || 
    '{"driving_license": "https://iodsddzustunlahxafif.supabase.co/storage/v1/object/public/driver-documents/user-id/driving_license.pdf"}'::jsonb
WHERE user_id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74';
*/

-- 6. Vérifier les champs obligatoires pour la validation complète
SELECT 
    d.first_name,
    d.last_name,
    d.phone,
    d.date_of_birth,
    d.address_line1,
    d.city,
    d.postal_code,
    d.emergency_contact_name,
    d.emergency_contact_phone,
    d.company_name,
    d.driving_license_number,
    d.vtc_card_number,
    d.document_urls,
    d.status,
    CASE 
        WHEN d.first_name IS NOT NULL 
         AND d.last_name IS NOT NULL 
         AND d.phone IS NOT NULL 
         AND d.date_of_birth IS NOT NULL 
         AND d.address_line1 IS NOT NULL 
         AND d.city IS NOT NULL 
         AND d.postal_code IS NOT NULL 
         AND d.emergency_contact_name IS NOT NULL 
         AND d.emergency_contact_phone IS NOT NULL 
         AND d.company_name IS NOT NULL 
         AND d.driving_license_number IS NOT NULL 
         AND d.vtc_card_number IS NOT NULL 
         AND d.document_urls ? 'driving_license'
         AND d.document_urls ? 'vtc_card'
        THEN 'COMPLET'
        ELSE 'INCOMPLET'
    END as validation_manuelle
FROM drivers d
WHERE d.user_id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74';

-- 7. Identifier les champs manquants pour un driver spécifique
SELECT 
    d.user_id,
    d.first_name,
    d.last_name,
    CASE WHEN d.first_name IS NULL THEN 'first_name manquant' END,
    CASE WHEN d.last_name IS NULL THEN 'last_name manquant' END,
    CASE WHEN d.phone IS NULL THEN 'phone manquant' END,
    CASE WHEN d.date_of_birth IS NULL THEN 'date_of_birth manquant' END,
    CASE WHEN d.address_line1 IS NULL THEN 'address_line1 manquant' END,
    CASE WHEN d.city IS NULL THEN 'city manquant' END,
    CASE WHEN d.postal_code IS NULL THEN 'postal_code manquant' END,
    CASE WHEN d.emergency_contact_name IS NULL THEN 'emergency_contact_name manquant' END,
    CASE WHEN d.emergency_contact_phone IS NULL THEN 'emergency_contact_phone manquant' END,
    CASE WHEN d.company_name IS NULL THEN 'company_name manquant' END,
    CASE WHEN d.driving_license_number IS NULL THEN 'driving_license_number manquant' END,
    CASE WHEN d.vtc_card_number IS NULL THEN 'vtc_card_number manquant' END,
    CASE WHEN NOT (d.document_urls ? 'driving_license') THEN 'document permis manquant' END,
    CASE WHEN NOT (d.document_urls ? 'vtc_card') THEN 'document carte VTC manquant' END
FROM drivers d
WHERE d.user_id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74';
