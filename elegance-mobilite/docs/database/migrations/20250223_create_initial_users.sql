-- Create initial superadmin user
INSERT INTO users (
    email,
    password,  -- To be replaced with a real password hash in production
    role,
    created_at,
    updated_at
) VALUES (
    'superadmin@elegance-mobilite.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyDAQd/Ajo966W',  -- 'changeme123'
    'superAdmin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Create initial admin user
INSERT INTO users (
    email,
    password,
    role,
    created_at,
    updated_at
) VALUES (
    'admin@elegance-mobilite.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyDAQd/Ajo966W',  -- 'changeme123'
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Create a testing company with your client
INSERT INTO users (
    email,
    password,
    role,
    created_at,
    updated_at
) VALUES (
    'manager@entreprise-test.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyDAQd/Ajo966W',  -- 'changeme123'
    'client',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Create a test driver
WITH inserted_user AS (
    INSERT INTO users (
        email,
        password,
        role,
        created_at,
        updated_at
    ) VALUES (
        'chauffeur@elegance-mobilite.com',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyDAQd/Ajo966W',  -- 'changeme123'
        'driver',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ) RETURNING id
)
INSERT INTO drivers (
    user_id,
    name,
    phone,
    status,
    vtc_card_number,
    driving_license_number,
    vtc_card_expiry_date,
    driving_license_expiry_date,
    rating,
    total_rides,
    languages_spoken,
    created_at,
    updated_at
) 
SELECT 
    id,
    'John Doe',
    '+33600000000',
    'active',
    'VTC123456',
    'PERM789012',
    CURRENT_DATE + INTERVAL '2 years',
    CURRENT_DATE + INTERVAL '5 years',
    4.5,
    0,
    ARRAY['french', 'english'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM inserted_user;

-- Add comment
COMMENT ON DATABASE postgres IS 'Initial users created on 2025-02-23';
