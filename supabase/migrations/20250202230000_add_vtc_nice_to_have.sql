-- ============================================================================
-- MIGRATION: Fonctionnalités additionnelles VTC (Nice to have)
-- Ces tables sont recommandées pour une expérience complète mais ne sont
-- pas bloquantes pour le lancement d'un MVP.
-- ============================================================================

-- ============================================================================
-- 1. SYSTÈME DE PAIEMENT
-- ============================================================================

create table if not exists "public"."payments" (
    "id" uuid not null default gen_random_uuid(),
    "ride_id" uuid references public.rides(id) on delete set null,
    "user_id" uuid references auth.users(id) on delete set null,
    "amount" numeric(10,2) not null,
    "currency" text not null default 'EUR',
    "method" text not null check (method in ('card', 'cash', 'corporate', 'wallet')),
    "status" text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed')),
    "stripe_payment_intent_id" text,
    "stripe_customer_id" text,
    "receipt_url" text,
    "paid_at" timestamp with time zone,
    "refunded_at" timestamp with time zone,
    "refund_amount" numeric(10,2),
    "failure_reason" text,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_payments_ride_id ON public.payments(ride_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_id ON public.payments(stripe_payment_intent_id);

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;

-- Politiques
DROP POLICY IF EXISTS "users_view_own_payments" ON public.payments;
CREATE POLICY "users_view_own_payments" ON public.payments
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_all_access_payments" ON public.payments;
CREATE POLICY "admin_all_access_payments" ON public.payments
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND (u.raw_app_meta_data->>'role' = 'app_admin' 
                 OR u.raw_app_meta_data->>'role' = 'app_super_admin')
        )
    );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_payments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS payments_updated_at ON public.payments;
CREATE TRIGGER payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_timestamp();

-- ============================================================================
-- 2. TRACKING GPS TEMPS RÉEL (Positions des chauffeurs)
-- ============================================================================

create table if not exists "public"."driver_locations" (
    "id" uuid not null default gen_random_uuid(),
    "driver_id" uuid not null references public.drivers(id) on delete cascade,
    "ride_id" uuid references public.rides(id) on delete set null,
    "lat" numeric(10,8) not null,
    "lon" numeric(11,8) not null,
    "accuracy" numeric, -- précision en mètres
    "speed" numeric, -- vitesse en km/h
    "heading" numeric, -- direction en degrés (0-360)
    "altitude" numeric,
    "battery_level" integer, -- niveau batterie téléphone (0-100)
    "is_online" boolean not null default true,
    "is_on_ride" boolean not null default false,
    "recorded_at" timestamp with time zone not null default now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON public.driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_ride_id ON public.driver_locations(ride_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_recorded_at ON public.driver_locations(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_locations_current ON public.driver_locations(driver_id, recorded_at DESC);

-- Index géospatial (permet les requêtes de proximité)
-- Note: Nécessite l'extension postgis, sinon on utilise une approche simplifiée

-- RLS
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations FORCE ROW LEVEL SECURITY;

-- Politiques
-- Les chauffeurs peuvent voir leurs propres positions
DROP POLICY IF EXISTS "drivers_view_own_locations" ON public.driver_locations;
CREATE POLICY "drivers_view_own_locations" ON public.driver_locations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = driver_locations.driver_id
            AND d.user_id = auth.uid()
        )
    );

-- Les clients peuvent voir la position du chauffeur de leur course en cours
DROP POLICY IF EXISTS "clients_view_driver_on_ride" ON public.driver_locations;
CREATE POLICY "clients_view_driver_on_ride" ON public.driver_locations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.rides r
            WHERE r.id = driver_locations.ride_id
            AND r.user_id = auth.uid()
            AND r.status = 'in-progress'
        )
    );

-- Les admins peuvent tout voir
DROP POLICY IF EXISTS "admin_view_all_locations" ON public.driver_locations;
CREATE POLICY "admin_view_all_locations" ON public.driver_locations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND (u.raw_app_meta_data->>'role' = 'app_admin' 
                 OR u.raw_app_meta_data->>'role' = 'app_super_admin')
        )
    );

-- Nettoyage automatique des anciennes positions (garder 24h)
CREATE OR REPLACE FUNCTION cleanup_old_driver_locations()
RETURNS void AS $$
BEGIN
    DELETE FROM public.driver_locations
    WHERE recorded_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 3. SYSTÈME DE NOTIFICATIONS
-- ============================================================================

create table if not exists "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "ride_id" uuid references public.rides(id) on delete set null,
    "type" text not null check (type in (
        'ride_created', 'ride_accepted', 'ride_started', 'ride_completed',
        'ride_cancelled', 'driver_arrived', 'payment_received', 'payment_failed',
        'promo_code_used', 'driver_documents_expiring', 'system'
    )),
    "title" text not null,
    "message" text not null,
    "data" jsonb default '{}'::jsonb, -- données additionnelles (liens, IDs...)
    "channel" text not null default 'push' check (channel in ('push', 'email', 'sms', 'in_app')),
    "priority" text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
    "is_read" boolean not null default false,
    "read_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_ride_id ON public.notifications(ride_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;

-- Politiques
DROP POLICY IF EXISTS "users_view_own_notifications" ON public.notifications;
CREATE POLICY "users_view_own_notifications" ON public.notifications
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_all_access_notifications" ON public.notifications;
CREATE POLICY "admin_all_access_notifications" ON public.notifications
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND (u.raw_app_meta_data->>'role' = 'app_admin' 
                 OR u.raw_app_meta_data->>'role' = 'app_super_admin')
        )
    );

-- Fonction pour marquer comme lu
CREATE OR REPLACE FUNCTION mark_notification_read(notification_uuid uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = true, read_at = now()
    WHERE id = notification_uuid
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 4. AVIS DÉTAILLÉS (REVIEWS)
-- ============================================================================

create table if not exists "public"."reviews" (
    "id" uuid not null default gen_random_uuid(),
    "ride_id" uuid not null references public.rides(id) on delete cascade,
    "reviewer_id" uuid not null references auth.users(id) on delete cascade, -- celui qui laisse l'avis
    "reviewee_id" uuid not null references auth.users(id) on delete cascade, -- celui qui reçoit l'avis (chauffeur ou client)
    "rating" integer not null check (rating >= 1 AND rating <= 5),
    "comment" text,
    "categories" jsonb default '{}'::jsonb, -- {punctuality: 5, cleanliness: 4, driving: 5}
    "is_reported" boolean not null default false,
    "report_reason" text,
    "moderated_at" timestamp with time zone,
    "moderated_by" uuid references auth.users(id),
    "is_visible" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_reviews_ride_id ON public.reviews(ride_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_visible ON public.reviews(reviewee_id, is_visible) WHERE is_visible = true;

-- Contrainte unique : un avis par course et par sens
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique ON public.reviews(ride_id, reviewer_id, reviewee_id);

-- RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews FORCE ROW LEVEL SECURITY;

-- Politiques
DROP POLICY IF EXISTS "users_view_visible_reviews" ON public.reviews;
CREATE POLICY "users_view_visible_reviews" ON public.reviews
    FOR SELECT TO authenticated
    USING (is_visible = true OR reviewer_id = auth.uid());

DROP POLICY IF EXISTS "users_create_own_review" ON public.reviews;
CREATE POLICY "users_create_own_review" ON public.reviews
    FOR INSERT TO authenticated
    WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_review" ON public.reviews;
CREATE POLICY "users_update_own_review" ON public.reviews
    FOR UPDATE TO authenticated
    USING (reviewer_id = auth.uid() AND is_visible = true)
    WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "admin_moderate_reviews" ON public.reviews;
CREATE POLICY "admin_moderate_reviews" ON public.reviews
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND (u.raw_app_meta_data->>'role' = 'app_admin' 
                 OR u.raw_app_meta_data->>'role' = 'app_super_admin')
        )
    );

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS reviews_updated_at ON public.reviews;
CREATE TRIGGER reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer la note moyenne d'un chauffeur
CREATE OR REPLACE FUNCTION calculate_driver_rating(driver_uuid uuid)
RETURNS TABLE(avg_rating numeric, total_reviews bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(r.rating), 2) as avg_rating,
        COUNT(*) as total_reviews
    FROM public.reviews r
    WHERE r.reviewee_id = (
        SELECT user_id FROM public.drivers WHERE id = driver_uuid
    )
    AND r.is_visible = true;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 5. ADRESSES FAVORITES (pour clients réguliers)
-- ============================================================================

create table if not exists "public"."favorite_addresses" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "name" text not null, -- "Maison", "Bureau", "Aéroport CDG"...
    "address" text not null,
    "lat" numeric(10,8),
    "lon" numeric(11,8),
    "place_id" text, -- Google Places ID ou équivalent
    "type" text check (type in ('home', 'work', 'airport', 'train_station', 'other')),
    "is_default" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_favorite_addresses_user ON public.favorite_addresses(user_id);

-- Contrainte : max 10 favoris par utilisateur
CREATE OR REPLACE FUNCTION check_favorite_address_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM public.favorite_addresses WHERE user_id = NEW.user_id) >= 10 THEN
        RAISE EXCEPTION 'Maximum 10 adresses favorites par utilisateur';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS favorite_address_limit ON public.favorite_addresses;
CREATE TRIGGER favorite_address_limit
    BEFORE INSERT ON public.favorite_addresses
    FOR EACH ROW
    EXECUTE FUNCTION check_favorite_address_limit();

-- RLS
ALTER TABLE public.favorite_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_addresses FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_favorites" ON public.favorite_addresses;
CREATE POLICY "users_manage_own_favorites" ON public.favorite_addresses
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE public.payments IS 'Transactions de paiement (Stripe, espèces, etc.)';
COMMENT ON TABLE public.driver_locations IS 'Positions GPS temps réel des chauffeurs';
COMMENT ON TABLE public.notifications IS 'Système de notifications push/email/sms';
COMMENT ON TABLE public.reviews IS 'Avis et notations détaillés entre clients et chauffeurs';
COMMENT ON TABLE public.favorite_addresses IS 'Adresses favorites des clients (maison, bureau...)';
