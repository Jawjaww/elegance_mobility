create type "public"."discount_type_enum" as enum ('percentage', 'fixed');

create type "public"."driver_status" as enum ('pending_validation', 'active', 'inactive', 'on_vacation', 'suspended', 'incomplete');

create type "public"."promo_type_enum" as enum ('percentage', 'fixed_amount');

create type "public"."reward_type_enum" as enum ('bonus', 'commission_increase');

create type "public"."ride_status" as enum ('pending', 'scheduled', 'in-progress', 'completed', 'client-canceled', 'driver-canceled', 'admin-canceled', 'no-show', 'delayed');

create type "public"."vehicle_type_enum" as enum ('STANDARD', 'PREMIUM', 'VAN', 'ELECTRIC');

create sequence "public"."rates_id_seq";

create sequence "public"."status_reason_categories_id_seq";


  create table "public"."audit_logs" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "event_type" text not null,
    "service" text not null,
    "ride_id" uuid,
    "calculated_price" numeric(10,2),
    "metadata" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."audit_logs" enable row level security;


  create table "public"."corporate_discounts" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "company_id" uuid,
    "discount_type" public.discount_type_enum not null,
    "percentage" numeric not null,
    "min_monthly_rides" integer,
    "total_budget" numeric,
    "remaining_budget" numeric,
    "start_date" timestamp with time zone not null,
    "end_date" timestamp with time zone,
    "active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."corporate_discounts" enable row level security;


  create table "public"."driver_documents" (
    "id" uuid not null default gen_random_uuid(),
    "driver_id" uuid,
    "document_type" text not null,
    "file_url" text not null,
    "file_name" text,
    "file_size" integer,
    "upload_date" timestamp with time zone default now(),
    "expiry_date" date,
    "validation_status" text default 'pending'::text,
    "rejection_reason" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."driver_rewards" (
    "id" uuid not null default gen_random_uuid(),
    "driver_id" uuid,
    "reward_type" public.reward_type_enum not null,
    "value" numeric not null,
    "rides_threshold" integer,
    "valid_from" timestamp with time zone not null,
    "valid_until" timestamp with time zone not null,
    "is_claimed" boolean not null default false,
    "claimed_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."driver_rewards" enable row level security;


  create table "public"."drivers" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "first_name" text,
    "last_name" text default ''::text,
    "phone" text,
    "status" public.driver_status not null default 'inactive'::public.driver_status,
    "avatar_url" text,
    "current_vehicle_id" uuid,
    "vtc_card_number" text default 'À compléter'::text,
    "driving_license_number" text default 'À compléter'::text,
    "vtc_card_expiry_date" date default '2025-12-31'::date,
    "driving_license_expiry_date" date default '2025-12-31'::date,
    "insurance_number" text,
    "insurance_expiry_date" date,
    "rating" numeric,
    "total_rides" integer default 0,
    "languages_spoken" text[],
    "preferred_zones" text[],
    "availability_hours" jsonb,
    "company_name" text default 'À compléter'::text,
    "company_phone" text default 'À compléter'::text,
    "employee_phone" text default 'À compléter'::text,
    "employee_name" text default 'À compléter'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "document_urls" jsonb default '{}'::jsonb,
    "date_of_birth" date,
    "address_line1" text,
    "address_line2" text,
    "city" text,
    "postal_code" text,
    "emergency_contact_name" text,
    "emergency_contact_phone" text
      );


alter table "public"."drivers" enable row level security;


  create table "public"."options" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text not null,
    "price" numeric(10,2) not null,
    "available" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."options" enable row level security;


  create table "public"."promo_codes" (
    "id" uuid not null default gen_random_uuid(),
    "code" text not null,
    "description" text not null,
    "promo_type" public.promo_type_enum not null,
    "value" numeric not null,
    "min_ride_value" numeric,
    "max_discount" numeric,
    "start_date" timestamp with time zone not null,
    "end_date" timestamp with time zone not null,
    "max_uses" integer,
    "uses_per_user" integer,
    "active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."promo_codes" enable row level security;


  create table "public"."promo_usages" (
    "id" uuid not null default gen_random_uuid(),
    "promo_code_id" uuid,
    "user_id" uuid,
    "ride_id" uuid,
    "discount_amount" numeric not null,
    "used_at" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."promo_usages" enable row level security;


  create table "public"."rates" (
    "id" integer not null default nextval('public.rates_id_seq'::regclass),
    "vehicle_type" public.vehicle_type_enum not null,
    "price_per_km" numeric(10,2) not null,
    "base_price" numeric(10,2) not null,
    "min_price" numeric(10,2) not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."rates" enable row level security;


  create table "public"."ride_status_history" (
    "id" uuid not null default gen_random_uuid(),
    "ride_id" uuid not null,
    "status" character varying not null,
    "previous_status" character varying,
    "changed_by" uuid,
    "changed_at" timestamp with time zone default now(),
    "delay_reason" character varying(50),
    "delay_minutes" integer,
    "notes" text,
    "reason_category" character varying(50),
    "financial_impact" numeric(10,2),
    "external_intervention" boolean default false,
    "location_lat" numeric(10,6),
    "location_lon" numeric(10,6),
    "requires_followup" boolean default false,
    "confirmed_by_client" boolean default false,
    "confirmed_by_driver" boolean default false
      );


alter table "public"."ride_status_history" enable row level security;


  create table "public"."ride_stops" (
    "id" uuid not null default gen_random_uuid(),
    "ride_id" uuid not null,
    "stop_order" integer not null,
    "address" text not null,
    "lat" numeric,
    "lon" numeric,
    "estimated_arrival" timestamp with time zone,
    "estimated_wait_time" integer,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."ride_stops" enable row level security;


  create table "public"."rides" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "driver_id" uuid,
    "override_vehicle_id" uuid,
    "status" public.ride_status not null default 'pending'::public.ride_status,
    "pickup_address" text not null,
    "pickup_lat" numeric,
    "pickup_lon" numeric,
    "dropoff_address" text not null,
    "dropoff_lat" numeric,
    "dropoff_lon" numeric,
    "pickup_time" timestamp with time zone not null,
    "distance" numeric,
    "duration" integer,
    "vehicle_type" text not null,
    "options" text[] default '{}'::text[],
    "estimated_price" numeric,
    "final_price" numeric,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "price" numeric(10,2),
    "pickup_notes" text
      );


alter table "public"."rides" enable row level security;


  create table "public"."seasonal_promotions" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text not null,
    "discount_percentage" numeric not null,
    "vehicle_types" public.vehicle_type_enum[],
    "zones" text[],
    "time_slots" jsonb,
    "start_date" timestamp with time zone not null,
    "end_date" timestamp with time zone not null,
    "active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."seasonal_promotions" enable row level security;


  create table "public"."status_reason_categories" (
    "id" integer not null default nextval('public.status_reason_categories_id_seq'::regclass),
    "category_code" character varying(50) not null,
    "description" text not null,
    "requires_notes" boolean default false,
    "requires_approval" boolean default false
      );


alter table "public"."status_reason_categories" enable row level security;


  create table "public"."user_profiles" (
    "id" bigint generated always as identity not null,
    "user_id" uuid not null,
    "app_metadata" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "role" text
      );



  create table "public"."users" (
    "id" uuid not null,
    "first_name" text,
    "last_name" text,
    "phone" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."users" enable row level security;


  create table "public"."vehicle_documents" (
    "id" uuid not null default gen_random_uuid(),
    "vehicle_id" uuid,
    "document_type" text not null,
    "file_url" text not null,
    "file_name" text,
    "file_size" bigint,
    "upload_date" timestamp with time zone default now(),
    "validation_status" text default 'pending'::text,
    "rejection_reason" text,
    "uploaded_by" uuid
      );



  create table "public"."vehicles" (
    "id" uuid not null default gen_random_uuid(),
    "driver_id" uuid,
    "make" text not null,
    "model" text not null,
    "year" integer,
    "license_plate" text not null,
    "color" text,
    "vehicle_type" public.vehicle_type_enum default 'STANDARD'::public.vehicle_type_enum,
    "seats" integer default 4,
    "is_primary" boolean default false,
    "photos" jsonb default '[]'::jsonb,
    "documents" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "owner_user_id" uuid,
    "owner_name" text,
    "registration_number" text,
    "vin" text,
    "fuel_type" text,
    "first_registration_date" date,
    "insurance_number" text,
    "validation_status" text default 'pending'::text,
    "submitted_by" uuid,
    "submitted_at" timestamp with time zone
      );


alter sequence "public"."rates_id_seq" owned by "public"."rates"."id";

alter sequence "public"."status_reason_categories_id_seq" owned by "public"."status_reason_categories"."id";

CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);

CREATE UNIQUE INDEX corporate_discounts_pkey ON public.corporate_discounts USING btree (id);

CREATE UNIQUE INDEX driver_documents_pkey ON public.driver_documents USING btree (id);

CREATE UNIQUE INDEX driver_rewards_pkey ON public.driver_rewards USING btree (id);

CREATE UNIQUE INDEX driver_vehicles_license_plate_key ON public.vehicles USING btree (license_plate);

CREATE UNIQUE INDEX driver_vehicles_pkey ON public.vehicles USING btree (id);

CREATE INDEX drivers_current_vehicle_id_idx ON public.drivers USING btree (current_vehicle_id);

CREATE UNIQUE INDEX drivers_driving_license_number_key ON public.drivers USING btree (driving_license_number);

CREATE UNIQUE INDEX drivers_pkey ON public.drivers USING btree (id);

CREATE INDEX drivers_status_idx ON public.drivers USING btree (status);

CREATE INDEX drivers_user_id_idx ON public.drivers USING btree (user_id);

CREATE UNIQUE INDEX drivers_user_id_key ON public.drivers USING btree (user_id);

CREATE UNIQUE INDEX drivers_vtc_card_number_key ON public.drivers USING btree (vtc_card_number);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);

CREATE INDEX idx_audit_logs_event_type ON public.audit_logs USING btree (event_type);

CREATE INDEX idx_audit_logs_ride_id ON public.audit_logs USING btree (ride_id);

CREATE INDEX idx_driver_documents_driver_id ON public.driver_documents USING btree (driver_id);

CREATE INDEX idx_driver_documents_type ON public.driver_documents USING btree (document_type);

CREATE INDEX idx_driver_vehicles_driver_id ON public.vehicles USING btree (driver_id);

CREATE INDEX idx_driver_vehicles_primary ON public.vehicles USING btree (driver_id, is_primary);

CREATE INDEX idx_drivers_created_at ON public.drivers USING btree (created_at);

CREATE INDEX idx_drivers_status ON public.drivers USING btree (status);

CREATE INDEX idx_drivers_user_id ON public.drivers USING btree (user_id);

CREATE INDEX idx_vehicle_documents_type ON public.vehicle_documents USING btree (document_type);

CREATE INDEX idx_vehicle_documents_vehicle_id ON public.vehicle_documents USING btree (vehicle_id);

CREATE INDEX idx_vehicles_driver_id ON public.vehicles USING btree (driver_id);

CREATE INDEX idx_vehicles_license_plate ON public.vehicles USING btree (license_plate);

CREATE INDEX idx_vehicles_owner_user_id ON public.vehicles USING btree (owner_user_id);

CREATE UNIQUE INDEX options_name_key ON public.options USING btree (name);

CREATE UNIQUE INDEX options_pkey ON public.options USING btree (id);

CREATE UNIQUE INDEX promo_codes_code_key ON public.promo_codes USING btree (code);

CREATE UNIQUE INDEX promo_codes_pkey ON public.promo_codes USING btree (id);

CREATE UNIQUE INDEX promo_usages_pkey ON public.promo_usages USING btree (id);

CREATE UNIQUE INDEX rates_pkey ON public.rates USING btree (id);

CREATE UNIQUE INDEX rates_vehicle_type_key ON public.rates USING btree (vehicle_type);

CREATE UNIQUE INDEX ride_status_history_pkey ON public.ride_status_history USING btree (id);

CREATE UNIQUE INDEX ride_stops_pkey ON public.ride_stops USING btree (id);

CREATE UNIQUE INDEX rides_pkey ON public.rides USING btree (id);

CREATE UNIQUE INDEX seasonal_promotions_pkey ON public.seasonal_promotions USING btree (id);

CREATE UNIQUE INDEX status_reason_categories_category_code_key ON public.status_reason_categories USING btree (category_code);

CREATE UNIQUE INDEX status_reason_categories_pkey ON public.status_reason_categories USING btree (id);

CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX vehicle_documents_pkey ON public.vehicle_documents USING btree (id);

alter table "public"."audit_logs" add constraint "audit_logs_pkey" PRIMARY KEY using index "audit_logs_pkey";

alter table "public"."corporate_discounts" add constraint "corporate_discounts_pkey" PRIMARY KEY using index "corporate_discounts_pkey";

alter table "public"."driver_documents" add constraint "driver_documents_pkey" PRIMARY KEY using index "driver_documents_pkey";

alter table "public"."driver_rewards" add constraint "driver_rewards_pkey" PRIMARY KEY using index "driver_rewards_pkey";

alter table "public"."drivers" add constraint "drivers_pkey" PRIMARY KEY using index "drivers_pkey";

alter table "public"."options" add constraint "options_pkey" PRIMARY KEY using index "options_pkey";

alter table "public"."promo_codes" add constraint "promo_codes_pkey" PRIMARY KEY using index "promo_codes_pkey";

alter table "public"."promo_usages" add constraint "promo_usages_pkey" PRIMARY KEY using index "promo_usages_pkey";

alter table "public"."rates" add constraint "rates_pkey" PRIMARY KEY using index "rates_pkey";

alter table "public"."ride_status_history" add constraint "ride_status_history_pkey" PRIMARY KEY using index "ride_status_history_pkey";

alter table "public"."ride_stops" add constraint "ride_stops_pkey" PRIMARY KEY using index "ride_stops_pkey";

alter table "public"."rides" add constraint "rides_pkey" PRIMARY KEY using index "rides_pkey";

alter table "public"."seasonal_promotions" add constraint "seasonal_promotions_pkey" PRIMARY KEY using index "seasonal_promotions_pkey";

alter table "public"."status_reason_categories" add constraint "status_reason_categories_pkey" PRIMARY KEY using index "status_reason_categories_pkey";

alter table "public"."user_profiles" add constraint "user_profiles_pkey" PRIMARY KEY using index "user_profiles_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."vehicle_documents" add constraint "vehicle_documents_pkey" PRIMARY KEY using index "vehicle_documents_pkey";

alter table "public"."vehicles" add constraint "driver_vehicles_pkey" PRIMARY KEY using index "driver_vehicles_pkey";

alter table "public"."audit_logs" add constraint "audit_logs_ride_id_fkey" FOREIGN KEY (ride_id) REFERENCES public.rides(id) not valid;

alter table "public"."audit_logs" validate constraint "audit_logs_ride_id_fkey";

alter table "public"."corporate_discounts" add constraint "corporate_discounts_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.users(id) not valid;

alter table "public"."corporate_discounts" validate constraint "corporate_discounts_company_id_fkey";

alter table "public"."driver_documents" add constraint "driver_documents_document_type_check" CHECK ((document_type = ANY (ARRAY['driving_license'::text, 'vtc_card'::text, 'insurance'::text, 'vehicle_registration'::text, 'medical_certificate'::text, 'tax_certificate'::text]))) not valid;

alter table "public"."driver_documents" validate constraint "driver_documents_document_type_check";

alter table "public"."driver_documents" add constraint "driver_documents_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE CASCADE not valid;

alter table "public"."driver_documents" validate constraint "driver_documents_driver_id_fkey";

alter table "public"."driver_documents" add constraint "driver_documents_validation_status_check" CHECK ((validation_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))) not valid;

alter table "public"."driver_documents" validate constraint "driver_documents_validation_status_check";

alter table "public"."driver_rewards" add constraint "driver_rewards_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES public.drivers(id) not valid;

alter table "public"."driver_rewards" validate constraint "driver_rewards_driver_id_fkey";

alter table "public"."drivers" add constraint "drivers_driving_license_number_key" UNIQUE using index "drivers_driving_license_number_key";

alter table "public"."drivers" add constraint "drivers_rating_check" CHECK (((rating IS NULL) OR ((rating >= (0)::numeric) AND (rating <= (5)::numeric)))) not valid;

alter table "public"."drivers" validate constraint "drivers_rating_check";

alter table "public"."drivers" add constraint "drivers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) not valid;

alter table "public"."drivers" validate constraint "drivers_user_id_fkey";

alter table "public"."drivers" add constraint "drivers_user_id_key" UNIQUE using index "drivers_user_id_key";

alter table "public"."drivers" add constraint "drivers_vtc_card_number_key" UNIQUE using index "drivers_vtc_card_number_key";

alter table "public"."drivers" add constraint "future_insurance_expiry" CHECK (((insurance_expiry_date IS NULL) OR (insurance_expiry_date > CURRENT_DATE))) not valid;

alter table "public"."drivers" validate constraint "future_insurance_expiry";

alter table "public"."drivers" add constraint "future_license_expiry" CHECK ((driving_license_expiry_date > CURRENT_DATE)) not valid;

alter table "public"."drivers" validate constraint "future_license_expiry";

alter table "public"."drivers" add constraint "future_vtc_expiry" CHECK ((vtc_card_expiry_date > CURRENT_DATE)) not valid;

alter table "public"."drivers" validate constraint "future_vtc_expiry";

alter table "public"."drivers" add constraint "proper_phone" CHECK ((phone ~ '^[0-9+\s()-]+$'::text)) not valid;

alter table "public"."drivers" validate constraint "proper_phone";

alter table "public"."drivers" add constraint "required_fields" CHECK (((first_name IS NOT NULL) AND (last_name IS NOT NULL) AND (phone IS NOT NULL) AND (vtc_card_number IS NOT NULL) AND (driving_license_number IS NOT NULL) AND (vtc_card_expiry_date IS NOT NULL) AND (driving_license_expiry_date IS NOT NULL))) not valid;

alter table "public"."drivers" validate constraint "required_fields";

alter table "public"."drivers" add constraint "valid_rating" CHECK (((rating IS NULL) OR ((rating >= (0)::numeric) AND (rating <= (5)::numeric)))) not valid;

alter table "public"."drivers" validate constraint "valid_rating";

alter table "public"."options" add constraint "options_name_key" UNIQUE using index "options_name_key";

alter table "public"."options" add constraint "options_price_check" CHECK ((price >= (0)::numeric)) not valid;

alter table "public"."options" validate constraint "options_price_check";

alter table "public"."promo_codes" add constraint "promo_codes_code_key" UNIQUE using index "promo_codes_code_key";

alter table "public"."promo_usages" add constraint "promo_usages_promo_code_id_fkey" FOREIGN KEY (promo_code_id) REFERENCES public.promo_codes(id) not valid;

alter table "public"."promo_usages" validate constraint "promo_usages_promo_code_id_fkey";

alter table "public"."promo_usages" add constraint "promo_usages_ride_id_fkey" FOREIGN KEY (ride_id) REFERENCES public.rides(id) not valid;

alter table "public"."promo_usages" validate constraint "promo_usages_ride_id_fkey";

alter table "public"."promo_usages" add constraint "promo_usages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) not valid;

alter table "public"."promo_usages" validate constraint "promo_usages_user_id_fkey";

alter table "public"."rates" add constraint "rates_base_price_check" CHECK ((base_price >= (0)::numeric)) not valid;

alter table "public"."rates" validate constraint "rates_base_price_check";

alter table "public"."rates" add constraint "rates_price_per_km_check" CHECK ((price_per_km >= (0)::numeric)) not valid;

alter table "public"."rates" validate constraint "rates_price_per_km_check";

alter table "public"."rates" add constraint "rates_vehicle_type_key" UNIQUE using index "rates_vehicle_type_key";

alter table "public"."ride_status_history" add constraint "ride_status_history_reason_category_fkey" FOREIGN KEY (reason_category) REFERENCES public.status_reason_categories(category_code) ON DELETE SET NULL not valid;

alter table "public"."ride_status_history" validate constraint "ride_status_history_reason_category_fkey";

alter table "public"."ride_status_history" add constraint "ride_status_history_ride_id_fkey" FOREIGN KEY (ride_id) REFERENCES public.rides(id) ON DELETE CASCADE not valid;

alter table "public"."ride_status_history" validate constraint "ride_status_history_ride_id_fkey";

alter table "public"."ride_stops" add constraint "ride_stops_ride_id_fkey" FOREIGN KEY (ride_id) REFERENCES public.rides(id) ON DELETE CASCADE not valid;

alter table "public"."ride_stops" validate constraint "ride_stops_ride_id_fkey";

alter table "public"."rides" add constraint "rides_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES public.drivers(id) not valid;

alter table "public"."rides" validate constraint "rides_driver_id_fkey";

alter table "public"."rides" add constraint "rides_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) not valid;

alter table "public"."rides" validate constraint "rides_user_id_fkey";

alter table "public"."status_reason_categories" add constraint "status_reason_categories_category_code_key" UNIQUE using index "status_reason_categories_category_code_key";

alter table "public"."user_profiles" add constraint "user_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_user_id_fkey";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."users" validate constraint "users_id_fkey";

alter table "public"."vehicle_documents" add constraint "vehicle_documents_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE not valid;

alter table "public"."vehicle_documents" validate constraint "vehicle_documents_vehicle_id_fkey";

alter table "public"."vehicles" add constraint "driver_vehicles_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE CASCADE not valid;

alter table "public"."vehicles" validate constraint "driver_vehicles_driver_id_fkey";

alter table "public"."vehicles" add constraint "driver_vehicles_license_plate_key" UNIQUE using index "driver_vehicles_license_plate_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.assign_user_role_on_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.raw_user_meta_data ? 'portal_type' THEN
    CASE NEW.raw_user_meta_data->>'portal_type'
      WHEN 'driver' THEN
        NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "app_driver"}'::jsonb;
      WHEN 'customer' THEN
        NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "app_customer"}'::jsonb;
      WHEN 'admin' THEN
        NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "app_admin"}'::jsonb;
      ELSE
        RAISE EXCEPTION 'portal_type non reconnu: %', NEW.raw_user_meta_data->>'portal_type';
    END CASE;
  ELSE
    RAISE EXCEPTION 'portal_type est requis lors de l''inscription.';
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_update_driver_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  completeness_result record;
BEGIN
  -- Vérifier complétude après modification
  SELECT * INTO completeness_result 
  FROM check_driver_profile_completeness(NEW.user_id);
  
  -- Auto-progression: incomplete → pending_validation
  IF NEW.status = 'incomplete'::driver_status AND completeness_result.is_complete THEN
    NEW.status := 'pending_validation'::driver_status;
  -- Auto-régression: pending_validation → incomplete (si champs supprimés)
  ELSIF NEW.status = 'pending_validation'::driver_status AND NOT completeness_result.is_complete THEN
    NEW.status := 'incomplete'::driver_status;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.before_insert_calculate_ride_price()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  price_result JSON;
BEGIN
  price_result := calculate_ride_price(
    NEW.distance,
    NEW.vehicle_type,
    NEW.options,
    NEW.user_id,
    NEW.pickup_time
  );
  NEW.estimated_price := (price_result->>'final_price')::numeric;
  NEW.final_price := (price_result->>'final_price')::numeric;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.before_update_calculate_ride_price()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  price_result JSON;
BEGIN
  price_result := calculate_ride_price(
    NEW.distance,
    NEW.vehicle_type,
    NEW.options,
    NEW.user_id,
    NEW.pickup_time
  );
  NEW.estimated_price := (price_result->>'final_price')::numeric;
  NEW.final_price := (price_result->>'final_price')::numeric;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_price_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.price := calculate_ride_price(NEW.distance, NEW.vehicle_type, NEW.options);
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_driver_accept_rides(driver_user_id uuid)
 RETURNS TABLE(can_accept boolean, reason text, profile_status text, validation_status text)
 LANGUAGE plpgsql
AS $function$
DECLARE
  driver_record record;
  completeness_result record;
BEGIN
  -- Vérifier si le driver existe
  SELECT * INTO driver_record FROM public.drivers WHERE user_id = driver_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Profil driver introuvable', 'missing', 'none';
    RETURN;
  END IF;
  
  -- Vérification selon le statut (utilise les enums committés)
  CASE driver_record.status
    WHEN 'incomplete' THEN
      RETURN QUERY SELECT 
        false, 
        'Profil incomplet - veuillez remplir tous les champs requis',
        'incomplete',
        'incomplete';
      RETURN;
      
    WHEN 'pending_validation' THEN
      RETURN QUERY SELECT 
        false, 
        'Profil en attente de validation par un administrateur',
        'complete',
        'pending_validation';
      RETURN;
      
    WHEN 'inactive' THEN
      RETURN QUERY SELECT 
        false, 
        'Profil désactivé - activez votre profil pour accepter des courses',
        'exists',
        'inactive';
      RETURN;
      
    WHEN 'suspended' THEN
      RETURN QUERY SELECT 
        false, 
        'Profil suspendu par un administrateur - contactez le support',
        'exists',
        'suspended';
      RETURN;
      
    WHEN 'on_vacation' THEN
      RETURN QUERY SELECT 
        false, 
        'Vous êtes en vacances - modifiez votre statut pour accepter des courses',
        'exists',
        'on_vacation';
      RETURN;
      
    WHEN 'active' THEN
      -- Seul "active" permet de continuer vers la vérification finale
      NULL;
      
    ELSE
      RETURN QUERY SELECT 
        false, 
        format('Statut driver non reconnu: %s', driver_record.status),
        'exists',
        driver_record.status::text;
      RETURN;
  END CASE;
  
  -- Vérification finale pour les drivers "active"
  SELECT * INTO completeness_result 
  FROM check_driver_profile_completeness(driver_user_id);
  
  IF NOT completeness_result.is_complete THEN
    RETURN QUERY SELECT 
      false,
      format('ERREUR: Profil actif mais incomplet (%s%%). Contactez un administrateur.', 
             completeness_result.completion_percentage),
      'inconsistent',
      'active';
    RETURN;
  END IF;
  
  -- ✅ TOUT EST OK
  RETURN QUERY SELECT true, 'Autorisé à accepter des courses', 'complete', 'active';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_driver_profile_completeness(driver_user_id uuid)
 RETURNS TABLE(is_complete boolean, completion_percentage integer, missing_fields text[])
 LANGUAGE plpgsql
AS $function$
DECLARE
  driver_record drivers%ROWTYPE;
  missing_list TEXT[] := '{}';
  checks_total INTEGER := 0;
  completed_fields INTEGER := 0;
  has_plate boolean := false;
  -- liste des valeurs factices à ignorer (ajoute d'autres si besoin)
  fake_values TEXT[] := ARRAY['', 'À compléter'];
BEGIN
  SELECT * INTO driver_record FROM drivers WHERE user_id = driver_user_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, ARRAY['Driver not found']::TEXT[];
    RETURN;
  END IF;

  PERFORM 1; -- no-op

  -- IDENTITÉ
  checks_total := checks_total + 1;
  IF driver_record.first_name IS NOT NULL AND driver_record.first_name <> '' AND driver_record.first_name <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Prénom');
  END IF;

  checks_total := checks_total + 1;
  IF driver_record.last_name IS NOT NULL AND driver_record.last_name <> '' AND driver_record.last_name <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Nom');
  END IF;

  checks_total := checks_total + 1;
  IF driver_record.phone IS NOT NULL AND driver_record.phone <> '' AND driver_record.phone <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Téléphone');
  END IF;

  checks_total := checks_total + 1;
  IF driver_record.date_of_birth IS NOT NULL THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Date de naissance');
  END IF;

  -- ENTREPRISE (si applicable)
  checks_total := checks_total + 1;
  IF driver_record.company_name IS NOT NULL AND driver_record.company_name <> '' AND driver_record.company_name <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Nom entreprise');
  END IF;

  -- ADRESSE
  checks_total := checks_total + 1;
  IF driver_record.address_line1 IS NOT NULL AND driver_record.address_line1 <> '' AND driver_record.address_line1 <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Adresse');
  END IF;

  checks_total := checks_total + 1;
  IF driver_record.city IS NOT NULL AND driver_record.city <> '' AND driver_record.city <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Ville');
  END IF;

  checks_total := checks_total + 1;
  IF driver_record.postal_code IS NOT NULL AND driver_record.postal_code <> '' AND driver_record.postal_code <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Code postal');
  END IF;

  -- NUMÉROS DE DOCUMENTS
  checks_total := checks_total + 1;
  IF driver_record.vtc_card_number IS NOT NULL AND driver_record.vtc_card_number <> '' AND driver_record.vtc_card_number <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Numéro carte VTC');
  END IF;

  checks_total := checks_total + 1;
  IF driver_record.driving_license_number IS NOT NULL AND driver_record.driving_license_number <> '' AND driver_record.driving_license_number <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Numéro permis');
  END IF;

  checks_total := checks_total + 1;
  IF driver_record.insurance_number IS NOT NULL AND driver_record.insurance_number <> '' AND driver_record.insurance_number <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Numéro assurance');
  END IF;

  -- PHOTO DE PROFIL
  checks_total := checks_total + 1;
  IF driver_record.avatar_url IS NOT NULL AND driver_record.avatar_url <> '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Photo de profil');
  END IF;

  -- DOCUMENTS (driver_documents)
  checks_total := checks_total + 1;
  IF EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'driving_license') THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Document permis');
  END IF;

  checks_total := checks_total + 1;
  IF EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'vtc_card') THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Document carte VTC');
  END IF;

  checks_total := checks_total + 1;
  IF EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'insurance') THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Document assurance');
  END IF;

  -- EMERGENCY CONTACT
  checks_total := checks_total + 1;
  IF driver_record.emergency_contact_name IS NOT NULL AND driver_record.emergency_contact_name <> '' AND driver_record.emergency_contact_name <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Contact d''urgence (nom)');
  END IF;

  checks_total := checks_total + 1;
  IF driver_record.emergency_contact_phone IS NOT NULL AND driver_record.emergency_contact_phone <> '' AND driver_record.emergency_contact_phone <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Contact d''urgence (téléphone)');
  END IF;

  -- SEULE vérification véhicule conservée : plaque d'immatriculation du véhicule actif
  checks_total := checks_total + 1;
  SELECT EXISTS(
    SELECT 1 FROM vehicles v
    WHERE v.driver_id = driver_record.id
      AND v.license_plate IS NOT NULL
      AND v.license_plate <> ''
      AND v.license_plate <> 'À compléter'
    LIMIT 1
  ) INTO has_plate;

  IF has_plate THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Plaque d''immatriculation (véhicule actif)');
  END IF;

  -- sécurité division par zéro
  IF checks_total = 0 THEN
    RETURN QUERY SELECT false, 0, COALESCE(missing_list, '{}');
    RETURN;
  END IF;

  RETURN QUERY SELECT
    (array_length(missing_list,1) IS NULL OR array_length(missing_list,1) = 0),
    (completed_fields * 100 / checks_total),
    COALESCE(missing_list, '{}');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN public.is_admin();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_is_super_admin()
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN public.is_super_admin();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_user_role_update()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Les admins peuvent tout faire
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_app_meta_data->>'role' = 'admin'
  ) THEN
    RETURN true;
  END IF;

  -- Les utilisateurs ne peuvent pas changer leur rôle
  RETURN (
    current_setting('request.jwt.claim.sub')::uuid = auth.uid()
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_orphaned_files()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Si un driver est supprimé, nettoyer ses fichiers
  IF TG_OP = 'DELETE' THEN
    -- Supprimer avatar
    DELETE FROM storage.objects 
    WHERE bucket_id = 'driver-avatars' 
    AND name LIKE OLD.id::text || '/%';
    
    -- Supprimer documents
    DELETE FROM storage.objects 
    WHERE bucket_id = 'driver-documents' 
    AND name LIKE OLD.id::text || '/%';
    
    -- Supprimer photos véhicules
    DELETE FROM storage.objects 
    WHERE bucket_id = 'vehicle-photos' 
    AND name LIKE OLD.id::text || '/%';
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_pending_driver(p_first_name text, p_last_name text, p_phone text, p_vtc_card_number text, p_driving_license_number text, p_vtc_card_expiry_date date, p_driving_license_expiry_date date, p_insurance_number text DEFAULT NULL::text, p_insurance_expiry_date date DEFAULT NULL::date, p_languages_spoken text[] DEFAULT NULL::text[], p_preferred_zones text[] DEFAULT NULL::text[], p_company_name text DEFAULT ''::text, p_company_phone text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_driver_id UUID;
BEGIN
  -- Vérification que l'utilisateur est connecté
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Vérification que l'utilisateur n'est pas déjà un chauffeur
  IF EXISTS (SELECT 1 FROM public.drivers WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'User is already registered as a driver';
  END IF;

  -- Vérification des dates d'expiration
  IF p_vtc_card_expiry_date <= CURRENT_DATE OR
     p_driving_license_expiry_date <= CURRENT_DATE OR
     (p_insurance_expiry_date IS NOT NULL AND p_insurance_expiry_date <= CURRENT_DATE) THEN
    RAISE EXCEPTION 'Invalid expiry dates';
  END IF;

  -- Insertion dans la table drivers
  INSERT INTO public.drivers (
    user_id,
    first_name,
    last_name,
    phone,
    vtc_card_number,
    driving_license_number,
    vtc_card_expiry_date,
    driving_license_expiry_date,
    insurance_number,
    insurance_expiry_date,
    languages_spoken,
    preferred_zones,
    company_name,
    company_phone,
    status,
    total_rides
  ) VALUES (
    auth.uid(),
    p_first_name,
    p_last_name,
    p_phone,
    p_vtc_card_number,
    p_driving_license_number,
    p_vtc_card_expiry_date,
    p_driving_license_expiry_date,
    p_insurance_number,
    p_insurance_expiry_date,
    p_languages_spoken,
    p_preferred_zones,
    p_company_name,
    p_company_phone,
    'pending_validation',
    0
  ) RETURNING id INTO v_driver_id;

  -- Mise à jour des métadonnées utilisateur
  UPDATE auth.users 
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{portal_type}',
    '"driver"'
  )
  WHERE id = auth.uid();

  RETURN jsonb_build_object(
    'success', true,
    'driver_id', v_driver_id,
    'message', 'Driver registration pending validation'
  );

EXCEPTION WHEN others THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_user_profile(user_id uuid, user_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  update auth.users
  set role = user_role
  where id = user_id;
  
  return true;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.debug_check_driver_profile_completeness(driver_user_id uuid)
 RETURNS TABLE(is_complete boolean, completion_percentage integer, missing_fields text[], debug_info jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  driver_record record;
  missing text[] := '{}';
  total_fields integer := 8;
  completed_fields integer := 0;
  debug_data jsonb;
BEGIN
  -- Chercher le driver
  SELECT * INTO driver_record FROM public.drivers WHERE user_id = driver_user_id;
  
  IF NOT FOUND THEN
    debug_data := jsonb_build_object(
      'driver_found', false,
      'user_id_searched', driver_user_id
    );
    RETURN QUERY SELECT false, 0, ARRAY['profile_not_found'], debug_data;
    RETURN;
  END IF;
  
  -- Debug: Capturer toutes les valeurs des champs
  debug_data := jsonb_build_object(
    'driver_found', true,
    'driver_id', driver_record.id,
    'user_id', driver_record.user_id,
    'first_name', driver_record.first_name,
    'phone', driver_record.phone,
    'company_name', driver_record.company_name,
    'company_phone', driver_record.company_phone,
    'driving_license_number', driver_record.driving_license_number,
    'driving_license_expiry_date', driver_record.driving_license_expiry_date,
    'vtc_card_number', driver_record.vtc_card_number,
    'vtc_card_expiry_date', driver_record.vtc_card_expiry_date
  );
  
  -- Vérification champ par champ avec debug
  IF driver_record.first_name IS NULL OR trim(driver_record.first_name) = '' THEN
    missing := array_append(missing, 'first_name');
    debug_data := debug_data || jsonb_build_object('first_name_check', 'MISSING');
  ELSE
    completed_fields := completed_fields + 1;
    debug_data := debug_data || jsonb_build_object('first_name_check', 'OK');
  END IF;
  
  IF driver_record.phone IS NULL OR trim(driver_record.phone) = '' THEN
    missing := array_append(missing, 'phone');
    debug_data := debug_data || jsonb_build_object('phone_check', 'MISSING');
  ELSE
    completed_fields := completed_fields + 1;
    debug_data := debug_data || jsonb_build_object('phone_check', 'OK');
  END IF;
  
  IF driver_record.company_name IS NULL OR trim(driver_record.company_name) = '' THEN
    missing := array_append(missing, 'company_name');
    debug_data := debug_data || jsonb_build_object('company_name_check', 'MISSING');
  ELSE
    completed_fields := completed_fields + 1;
    debug_data := debug_data || jsonb_build_object('company_name_check', 'OK');
  END IF;
  
  IF driver_record.company_phone IS NULL OR trim(driver_record.company_phone) = '' THEN
    missing := array_append(missing, 'company_phone');
    debug_data := debug_data || jsonb_build_object('company_phone_check', 'MISSING');
  ELSE
    completed_fields := completed_fields + 1;
    debug_data := debug_data || jsonb_build_object('company_phone_check', 'OK');
  END IF;
  
  IF driver_record.driving_license_number IS NULL OR trim(driver_record.driving_license_number) = '' THEN
    missing := array_append(missing, 'driving_license_number');
    debug_data := debug_data || jsonb_build_object('driving_license_number_check', 'MISSING');
  ELSE
    completed_fields := completed_fields + 1;
    debug_data := debug_data || jsonb_build_object('driving_license_number_check', 'OK');
  END IF;
  
  IF driver_record.driving_license_expiry_date IS NULL THEN
    missing := array_append(missing, 'driving_license_expiry_date');
    debug_data := debug_data || jsonb_build_object('driving_license_expiry_date_check', 'MISSING');
  ELSE
    completed_fields := completed_fields + 1;
    debug_data := debug_data || jsonb_build_object('driving_license_expiry_date_check', 'OK');
  END IF;
  
  IF driver_record.vtc_card_number IS NULL OR trim(driver_record.vtc_card_number) = '' THEN
    missing := array_append(missing, 'vtc_card_number');
    debug_data := debug_data || jsonb_build_object('vtc_card_number_check', 'MISSING');
  ELSE
    completed_fields := completed_fields + 1;
    debug_data := debug_data || jsonb_build_object('vtc_card_number_check', 'OK');
  END IF;
  
  IF driver_record.vtc_card_expiry_date IS NULL THEN
    missing := array_append(missing, 'vtc_card_expiry_date');
    debug_data := debug_data || jsonb_build_object('vtc_card_expiry_date_check', 'MISSING');
  ELSE
    completed_fields := completed_fields + 1;
    debug_data := debug_data || jsonb_build_object('vtc_card_expiry_date_check', 'OK');
  END IF;
  
  -- Ajouter les totaux au debug
  debug_data := debug_data || jsonb_build_object(
    'completed_fields', completed_fields,
    'total_fields', total_fields,
    'missing_count', array_length(missing, 1)
  );
  
  -- Retourner les résultats avec debug
  RETURN QUERY SELECT 
    array_length(missing, 1) IS NULL OR array_length(missing, 1) = 0,
    ROUND((completed_fields::float / total_fields::float) * 100)::integer,
    missing,
    debug_data;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.debug_driver_completeness(driver_user_id uuid)
 RETURNS TABLE(check_name text, field_value text, is_valid boolean, field_category text)
 LANGUAGE plpgsql
AS $function$
DECLARE
  driver_record drivers%ROWTYPE;
BEGIN
  SELECT * INTO driver_record FROM drivers WHERE user_id = driver_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'Driver', 'NOT FOUND', false, 'ERROR';
    RETURN;
  END IF;
  
  -- IDENTITÉ
  RETURN QUERY SELECT 'Prénom', COALESCE(driver_record.first_name, 'NULL'), (driver_record.first_name IS NOT NULL AND driver_record.first_name != ''), 'IDENTITÉ';
  RETURN QUERY SELECT 'Nom', COALESCE(driver_record.last_name, 'NULL'), (driver_record.last_name IS NOT NULL AND driver_record.last_name != ''), 'IDENTITÉ';
  RETURN QUERY SELECT 'Téléphone', COALESCE(driver_record.phone, 'NULL'), (driver_record.phone IS NOT NULL AND driver_record.phone != ''), 'IDENTITÉ';
  RETURN QUERY SELECT 'Date de naissance', COALESCE(driver_record.date_of_birth::text, 'NULL'), (driver_record.date_of_birth IS NOT NULL), 'IDENTITÉ';
  
  -- ENTREPRISE
  RETURN QUERY SELECT 'Nom entreprise', COALESCE(driver_record.company_name, 'NULL'), (driver_record.company_name IS NOT NULL AND driver_record.company_name != ''), 'ENTREPRISE';
  
  -- ADRESSE
  RETURN QUERY SELECT 'Adresse', COALESCE(driver_record.address_line1, 'NULL'), (driver_record.address_line1 IS NOT NULL AND driver_record.address_line1 != ''), 'ADRESSE';
  RETURN QUERY SELECT 'Ville', COALESCE(driver_record.city, 'NULL'), (driver_record.city IS NOT NULL AND driver_record.city != ''), 'ADRESSE';
  RETURN QUERY SELECT 'Code postal', COALESCE(driver_record.postal_code, 'NULL'), (driver_record.postal_code IS NOT NULL AND driver_record.postal_code != ''), 'ADRESSE';
  
  -- DOCUMENTS NUMÉROS
  RETURN QUERY SELECT 'Numéro carte VTC', COALESCE(driver_record.vtc_card_number, 'NULL'), (driver_record.vtc_card_number IS NOT NULL AND driver_record.vtc_card_number != ''), 'DOCUMENTS';
  RETURN QUERY SELECT 'Numéro permis', COALESCE(driver_record.driving_license_number, 'NULL'), (driver_record.driving_license_number IS NOT NULL AND driver_record.driving_license_number != ''), 'DOCUMENTS';
  RETURN QUERY SELECT 'Numéro assurance', COALESCE(driver_record.insurance_number, 'NULL'), (driver_record.insurance_number IS NOT NULL AND driver_record.insurance_number != ''), 'DOCUMENTS';
  
  -- PHOTO
  RETURN QUERY SELECT 'Photo de profil', COALESCE(driver_record.avatar_url, 'NULL'), (driver_record.avatar_url IS NOT NULL), 'PHOTO';
  
  -- VÉHICULE
  RETURN QUERY SELECT 'Véhicule', 
    CASE WHEN EXISTS(SELECT 1 FROM vehicles WHERE driver_id = driver_record.id) THEN 'PRÉSENT' ELSE 'ABSENT' END,
    EXISTS(SELECT 1 FROM vehicles WHERE driver_id = driver_record.id),
    'VÉHICULE';
  
  -- DOCUMENTS PHYSIQUES
  RETURN QUERY SELECT 'Document permis', 
    CASE WHEN EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'driving_license') THEN 'UPLOADÉ' ELSE 'MANQUANT' END,
    EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'driving_license'),
    'FICHIERS';
    
  RETURN QUERY SELECT 'Document carte VTC', 
    CASE WHEN EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'vtc_card') THEN 'UPLOADÉ' ELSE 'MANQUANT' END,
    EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'vtc_card'),
    'FICHIERS';
    
  RETURN QUERY SELECT 'Document assurance', 
    CASE WHEN EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'insurance') THEN 'UPLOADÉ' ELSE 'MANQUANT' END,
    EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'insurance'),
    'FICHIERS';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_driver_file(file_bucket text, file_path text, driver_id_param uuid, document_type_param text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  success BOOLEAN := false;
BEGIN
  -- Supprimer le fichier du storage
  DELETE FROM storage.objects 
  WHERE bucket_id = file_bucket AND name = file_path;
  
  -- Nettoyer les références selon le type
  IF file_bucket = 'driver-avatars' THEN
    UPDATE drivers SET avatar_url = NULL WHERE id = driver_id_param;
    success := true;
  ELSIF file_bucket = 'driver-documents' AND document_type_param IS NOT NULL THEN
    -- Supprimer de driver_documents
    DELETE FROM driver_documents 
    WHERE driver_id = driver_id_param AND document_type = document_type_param;
    
    -- Nettoyer document_urls dans drivers
    UPDATE drivers 
    SET document_urls = document_urls - document_type_param
    WHERE id = driver_id_param;
    success := true;
  END IF;
  
  RETURN success;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_user_and_associated_data(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Supprimer les enregistrements associés dans public.drivers
    DELETE FROM public.drivers WHERE user_id = p_user_id;

    -- Supprimer les enregistrements associés dans public.users
    DELETE FROM public.users WHERE id = p_user_id;

    -- Supprimer l'utilisateur de auth.users
    DELETE FROM auth.users WHERE id = p_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_user_by_id(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete admin record if exists
  DELETE FROM public.admins WHERE id = p_user_id;
  
  -- Delete auth user
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_driver_profile(driver_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
  existing_driver_id uuid;
  new_driver_id uuid;
BEGIN
  -- Vérifier si le profil existe
  SELECT id INTO existing_driver_id 
  FROM public.drivers 
  WHERE user_id = driver_user_id;
  
  IF existing_driver_id IS NOT NULL THEN
    RETURN existing_driver_id;
  END IF;
  
  -- Créer nouveau profil avec statut "incomplete"
  INSERT INTO public.drivers (user_id, status, created_at, updated_at)
  VALUES (driver_user_id, 'incomplete'::driver_status, now(), now())
  RETURNING id INTO new_driver_id;
  
  RETURN new_driver_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fix_all_driver_statuses()
 RETURNS TABLE(updated_count integer, incomplete_count integer, pending_validation_count integer, active_count integer, inactive_count integer, rejected_count integer, suspended_count integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
    updated_drivers INTEGER := 0;
    incomplete_drivers INTEGER := 0;
    pending_validation_drivers INTEGER := 0;
    active_drivers INTEGER := 0;
    inactive_drivers INTEGER := 0;
    rejected_drivers INTEGER := 0;
    suspended_drivers INTEGER := 0;
    driver_rec RECORD;
    update_result RECORD;
BEGIN
    -- Parcourir tous les chauffeurs
    FOR driver_rec IN SELECT * FROM drivers
    LOOP
        -- Utiliser la fonction force_update_driver_status pour mettre à jour le statut
        SELECT * INTO update_result 
        FROM force_update_driver_status(driver_rec.user_id);
        
        -- Compter les mises à jour
        IF update_result.old_status != update_result.new_status THEN
            updated_drivers := updated_drivers + 1;
        END IF;
    END LOOP;
    
    -- Compter les chauffeurs par statut après mise à jour
    SELECT COUNT(*) INTO incomplete_drivers FROM drivers WHERE status = 'incomplete';
    SELECT COUNT(*) INTO pending_validation_drivers FROM drivers WHERE status = 'pending_validation';
    SELECT COUNT(*) INTO active_drivers FROM drivers WHERE status = 'active';
    SELECT COUNT(*) INTO inactive_drivers FROM drivers WHERE status = 'inactive';
    SELECT COUNT(*) INTO rejected_drivers FROM drivers WHERE status = 'rejected';
    SELECT COUNT(*) INTO suspended_drivers FROM drivers WHERE status = 'suspended';
    
    -- Retourner les statistiques
    RETURN QUERY SELECT 
        updated_drivers,
        incomplete_drivers,
        pending_validation_drivers,
        active_drivers,
        inactive_drivers,
        rejected_drivers,
        suspended_drivers;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.force_update_driver_status(driver_user_id uuid)
 RETURNS TABLE(driver_id uuid, old_status public.driver_status, new_status public.driver_status, is_complete boolean, completion_percentage integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    driver_record RECORD;
    validation_result RECORD;
    calculated_status driver_status;
BEGIN
    -- Récupérer le chauffeur
    SELECT * INTO driver_record 
    FROM drivers 
    WHERE user_id = driver_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Driver not found for user_id: %', driver_user_id;
    END IF;
    
    -- Utiliser la fonction existante check_driver_profile_completeness
    SELECT * INTO validation_result 
    FROM check_driver_profile_completeness(driver_user_id) 
    LIMIT 1;
    
    -- Calculer le nouveau statut selon la logique améliorée
    IF validation_result.is_complete THEN
        -- Si complet, mettre en attente de validation
        IF driver_record.status IN ('incomplete', 'pending_validation') THEN
            calculated_status := 'pending_validation';
        ELSE
            -- Garder le statut existant si déjà actif/inactif/rejeté/suspendu
            calculated_status := driver_record.status;
        END IF;
    ELSE
        -- Si incomplet, marquer comme incomplet sauf si statut protégé
        IF driver_record.status IN ('incomplete', 'pending_validation') THEN
            calculated_status := 'incomplete';
        ELSE
            -- Garder le statut existant pour les statuts protégés
            calculated_status := driver_record.status;
        END IF;
    END IF;
    
    -- Mettre à jour si nécessaire
    IF calculated_status != driver_record.status THEN
        UPDATE drivers 
        SET 
            status = calculated_status,
            updated_at = NOW()
        WHERE user_id = driver_user_id;
        
        RAISE NOTICE 'Driver % status updated: % -> %', 
            driver_record.id, driver_record.status, calculated_status;
    END IF;
    
    -- Retourner les résultats
    RETURN QUERY SELECT 
        driver_record.id,
        driver_record.status,
        calculated_status,
        validation_result.is_complete,
        validation_result.completion_percentage;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_driver_completeness_details(target_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(section text, info text, details jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  target_id uuid;
  is_authorized boolean := false;
BEGIN
  IF target_user_id IS NULL THEN
    target_id := auth.uid();
    is_authorized := true;
  ELSE
    target_id := target_user_id;
    is_authorized := (is_admin() OR is_super_admin() OR auth.uid() = target_user_id);
  END IF;

  IF NOT is_authorized THEN
    RETURN QUERY SELECT 'ERREUR'::text, 'Accès non autorisé'::text,
      jsonb_build_object('error', 'Permission refusée');
    RETURN;
  END IF;

  IF NOT EXISTS(SELECT 1 FROM drivers WHERE user_id = target_id) THEN
    RETURN QUERY SELECT 'ERREUR'::text, 'Driver introuvable'::text,
      jsonb_build_object('user_id', target_id);
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 'INFO'::text, 'Utilisateur analysé'::text,
    jsonb_build_object(
      'user_id', target_id,
      'analyzed_by', auth.uid(),
      'is_self_analysis', (auth.uid() = target_id)
    );

  RETURN QUERY
  SELECT 'COMPLETUDE'::text, 'Résultat principal'::text,
    to_jsonb(comp) -- ensure jsonb
  FROM check_driver_profile_completeness(target_id) comp;

  RETURN QUERY
  SELECT 'DÉTAIL'::text, 'Vérification par champ'::text,
    jsonb_agg(
      jsonb_build_object(
        'champ', debug.check_name,
        'valeur', debug.field_value,
        'valide', debug.is_valid,
        'catégorie', debug.field_category
      )
    )
  FROM debug_driver_completeness(target_id) debug;

  RETURN QUERY
  SELECT 'DOCUMENTS'::text, 'Fichiers uploadés'::text,
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'type', dd.document_type,
        'nom', dd.file_name,
        'taille', dd.file_size,
        'date', dd.upload_date -- note: field name in driver_documents is upload_date
      )
    ) FILTER (WHERE dd.id IS NOT NULL), '[]'::jsonb)
  FROM drivers d
  LEFT JOIN driver_documents dd ON d.id = dd.driver_id
  WHERE d.user_id = target_id;

  RETURN QUERY
  SELECT 'VÉHICULES'::text, 'Véhicules enregistrés'::text,
    jsonb_build_object(
      'count', COUNT(v.id),
      'vehicles', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'marque', v.make,
            'modèle', v.model,
            'immatriculation', v.license_plate
          )
        ) FILTER (WHERE v.id IS NOT NULL),
      '[]'::jsonb)
    )
  FROM drivers d
  LEFT JOIN vehicles v ON d.id = v.driver_id
  WHERE d.user_id = target_id
  GROUP BY d.id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_driver_id_from_auth()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT id FROM drivers WHERE user_id = auth.uid() LIMIT 1
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_drivers_completeness_stats()
 RETURNS TABLE(total_drivers integer, complete_drivers integer, incomplete_drivers integer, pending_validation integer, average_completion_percentage numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::integer,
    COUNT(CASE WHEN completeness.is_complete THEN 1 END)::integer,
    COUNT(CASE WHEN NOT completeness.is_complete THEN 1 END)::integer,
    COUNT(CASE WHEN d.status = 'pending_validation' THEN 1 END)::integer,
    ROUND(AVG(completeness.completion_percentage), 2)
  FROM drivers d
  CROSS JOIN LATERAL check_driver_profile_completeness(d.user_id) AS completeness
  WHERE completeness.missing_fields != ARRAY['Driver not found'];
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_incomplete_drivers_report()
 RETURNS TABLE(user_id uuid, first_name text, last_name text, status public.driver_status, is_complete boolean, completion_percentage integer, missing_fields text[])
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    d.user_id, d.first_name, d.last_name, d.status,
    completeness.is_complete, completeness.completion_percentage, completeness.missing_fields
  FROM drivers d
  CROSS JOIN LATERAL check_driver_profile_completeness(d.user_id) AS completeness
  WHERE NOT completeness.is_complete
    AND completeness.missing_fields != ARRAY['Driver not found']
  ORDER BY completeness.completion_percentage DESC, d.created_at ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_safe_email()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN COALESCE(current_setting('my.email'::text, true), '');
EXCEPTION
    WHEN OTHERS THEN
        RETURN '';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_profile(user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  profile jsonb;
begin
  select json_build_object(
    'id', auth.users.id,
    'email', auth.users.email,
    'role', auth.users.role
  )::jsonb into profile
  from auth.users
  where auth.users.id = user_id;
  
  return profile;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN (
    SELECT 
      COALESCE(
        (auth.jwt() -> 'app_metadata' ->> 'role')::text,
        'app_customer' -- Valeur par défaut
      )
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_driver_status_updates()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  driver_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'drivers' THEN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
      driver_id := NEW.id;
    ELSIF TG_OP = 'DELETE' THEN
      driver_id := OLD.id;
    END IF;

  ELSIF TG_TABLE_NAME = 'vehicles' THEN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
      driver_id := NEW.driver_id;
    ELSIF TG_OP = 'DELETE' THEN
      driver_id := OLD.driver_id;
    END IF;

  ELSIF TG_TABLE_NAME = 'driver_documents' THEN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
      driver_id := NEW.driver_id;
    ELSIF TG_OP = 'DELETE' THEN
      driver_id := OLD.driver_id;
    END IF;

  ELSE
    -- Table non prise en charge : ne rien faire
    RETURN NULL;
  END IF;

  -- Appel métier : adaptez si la fonction réelle est différente ou absente
  IF driver_id IS NOT NULL THEN
    PERFORM update_driver_status_by_id(driver_id);
    RAISE NOTICE 'Driver status updated for driver_id: % (triggered by % on %)', driver_id, TG_OP, TG_TABLE_NAME;
  END IF;

  -- Retourner la valeur appropriée selon le moment du trigger
  IF TG_WHEN = 'BEFORE' THEN
    RETURN NEW;
  ELSE
    RETURN NULL;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_signup()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  signup_url text;
BEGIN
  -- Récupérer l'URL d'inscription depuis les métadonnées
  signup_url := current_setting('request.url', true);
  
  -- Attribuer le rôle en fonction de l'URL d'inscription
  IF signup_url LIKE '%/driver/signup%' THEN
    new.app_metadata := 
      jsonb_set(
        COALESCE(new.app_metadata, '{}'::jsonb),
        '{role}',
        '\"app_driver\"'
      );
  ELSE
    new.app_metadata := 
      jsonb_set(
        COALESCE(new.app_metadata, '{}'::jsonb),
        '{role}',
        '\"app_customer\"'
      );
  END IF;
  
  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  -- Créer l'utilisateur dans public.users
  INSERT INTO public.users (
    id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- Si c'est un driver (role est dans raw_user_meta_data), créer le profil driver
  IF (NEW.raw_user_meta_data->>'role') = 'driver' THEN
  INSERT INTO public.drivers (
    user_id,
    status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'incomplete',  -- ✅ Doit être 'incomplete' et non 'pending_validation'
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO NOTHING;
END IF;

  RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    (auth.jwt() -> 'app_metadata'::text)::jsonb ->> 'role'::text 
    = ANY(ARRAY['app_admin', 'app_super_admin'])
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_driver()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT 
    -- Vérification hiérarchique similaire
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'driver'
    )
    OR
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'driver';
$function$
;

CREATE OR REPLACE FUNCTION public.is_super_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT 
      COALESCE(
        (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'superadmin',
        false
      )
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_enhanced_ride_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO ride_status_history (
    ride_id, status, previous_status, changed_by,
    location_lat, location_lng, requires_followup
  ) VALUES (
    NEW.id, NEW.status, OLD.status,
    NULLIF(current_setting('app.current_user_id', true), '')::UUID,
    NEW.current_lat, NEW.current_lng,
    CASE WHEN NEW.status IN ('disputed', 'incident', 'vehicle-breakdown')
         THEN TRUE ELSE FALSE END
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_ride_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO ride_status_history (
    ride_id, status, previous_status, changed_by
  ) VALUES (
    NEW.id, NEW.status, OLD.status,
    current_setting('app.current_user_id', true)::UUID
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_driver_validation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.status = 'pending_validation' AND OLD.status <> NEW.status THEN
    -- logique de notification…
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.setup_admin_policies(admin_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    table_record RECORD;
BEGIN
    -- Create superAdmin policies for each table
    FOR table_record IN 
        SELECT tablename::text 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format(
            'CREATE POLICY "superadmin_all_%I" ON %I
             FOR ALL
             TO public
             USING (auth.uid() = ''%s''::uuid)
             WITH CHECK (auth.uid() = ''%s''::uuid)',
            table_record.tablename, table_record.tablename, admin_id, admin_id
        );
    END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.test_driver_completeness_full(target_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(section text, info text, details jsonb)
 LANGUAGE plpgsql
AS $function$
DECLARE
  test_user_id uuid;
  user_role text;
  is_authorized boolean := false;
BEGIN
  -- Déterminer l'utilisateur à tester
  IF target_user_id IS NULL THEN
    test_user_id := auth.uid(); -- Test de son propre profil
    is_authorized := true;
  ELSE
    test_user_id := target_user_id;
    -- Récupérer le rôle depuis le JWT pour vérifier les permissions
    user_role := (auth.jwt() -> 'app_metadata' ->> 'role');
    -- Autoriser si admin/superadmin ou si c'est son propre profil
    is_authorized := (user_role IN ('admin', 'superadmin') OR auth.uid() = target_user_id);
  END IF;
  
  IF NOT is_authorized THEN
    RETURN QUERY SELECT 'ERREUR'::text, 'Accès non autorisé'::text, 
      jsonb_build_object('error', 'Permission refusée');
    RETURN;
  END IF;
  
  -- Vérifier que le driver existe
  IF NOT EXISTS(SELECT 1 FROM drivers WHERE user_id = test_user_id) THEN
    RETURN QUERY SELECT 'ERREUR'::text, 'Driver introuvable'::text, 
      jsonb_build_object('user_id', test_user_id);
    RETURN;
  END IF;
  
  -- 1. Informations générales
  RETURN QUERY 
  SELECT 'INFO'::text, 'Utilisateur testé'::text, 
    jsonb_build_object(
      'user_id', test_user_id,
      'tested_by', auth.uid(),
      'is_self_test', (auth.uid() = test_user_id)
    );
  
  -- 2. Résultat de complétude
  RETURN QUERY 
  SELECT 'COMPLETUDE'::text, 'Résultat principal'::text,
    row_to_json(comp)::jsonb
  FROM check_driver_profile_completeness(test_user_id) comp;
  
  -- 3. Détail par champ
  RETURN QUERY 
  SELECT 'DÉTAIL'::text, 'Vérification par champ'::text,
    jsonb_agg(
      jsonb_build_object(
        'champ', debug.check_name,
        'valeur', debug.field_value,
        'valide', debug.is_valid,
        'catégorie', debug.field_category
      )
    )
  FROM debug_driver_completeness(test_user_id) debug;
  
  -- 4. Documents uploadés
  RETURN QUERY 
  SELECT 'DOCUMENTS'::text, 'Fichiers uploadés'::text,
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'type', dd.document_type,
        'nom', dd.file_name,
        'taille', dd.file_size,
        'date', dd.upload_date
      )
    ), '[]'::jsonb)
  FROM drivers d
  LEFT JOIN driver_documents dd ON d.id = dd.driver_id
  WHERE d.user_id = test_user_id AND dd.id IS NOT NULL;
  
  -- 5. Véhicules
  RETURN QUERY 
  SELECT 'VÉHICULES'::text, 'Véhicules enregistrés'::text,
    jsonb_build_object(
      'count', COUNT(*),
      'vehicles', COALESCE(jsonb_agg(
        jsonb_build_object(
          'marque', v.make,
          'modèle', v.model,
          'immatriculation', v.license_plate
        )
      ), '[]'::jsonb)
    )
  FROM drivers d
  LEFT JOIN vehicles v ON d.id = v.driver_id
  WHERE d.user_id = test_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_update_driver_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    validation_result RECORD;
    new_status driver_status;
BEGIN
    -- Utiliser la fonction existante
    SELECT * INTO validation_result 
    FROM check_driver_profile_completeness(NEW.user_id) 
    LIMIT 1;
    
    -- Logique de statut améliorée
    IF validation_result.is_complete THEN
        -- Si complet et actuellement incomplet ou en attente
        IF OLD.status IN ('incomplete', 'pending_validation') THEN
            new_status := 'pending_validation';
        ELSE
            -- Garder le statut existant pour les autres cas
            new_status := OLD.status;
        END IF;
    ELSE
        -- Si incomplet
        IF OLD.status IN ('pending_validation', 'incomplete') THEN
            new_status := 'incomplete';
        ELSE
            -- Garder le statut existant pour les autres cas
            new_status := OLD.status;
        END IF;
    END IF;
    
    -- Mettre à jour si nécessaire
    IF new_status != OLD.status THEN
        NEW.status := new_status;
        NEW.updated_at := NOW();
        
        RAISE NOTICE 'Trigger: Driver % status % -> % (complete: %)', 
            NEW.id, OLD.status, new_status, validation_result.is_complete;
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_audit_logs_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_driver_document_url(p_driver_id uuid, p_document_type text, p_file_url text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_urls JSONB;
BEGIN
  SELECT document_urls INTO current_urls 
  FROM drivers 
  WHERE id = p_driver_id;
  
  IF current_urls IS NULL THEN
    current_urls := '{}'::JSONB;
  END IF;
  
  current_urls := current_urls || jsonb_build_object(p_document_type, p_file_url);
  
  UPDATE drivers 
  SET document_urls = current_urls 
  WHERE id = p_driver_id;
  
  RETURN true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_driver_status_auto(driver_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  completeness_result record;
  new_status text;
  current_status text;
BEGIN
  SELECT status INTO current_status FROM drivers WHERE user_id = driver_user_id;
  
  IF NOT FOUND THEN
    RETURN 'Driver introuvable';
  END IF;
  
  SELECT * INTO completeness_result 
  FROM check_driver_profile_completeness(driver_user_id);
  
  IF NOT FOUND THEN
    RETURN 'Erreur lors de la vérification';
  END IF;
  
  IF completeness_result.is_complete THEN
    IF current_status = 'incomplete' OR current_status IS NULL THEN
      new_status := 'pending_validation';
    ELSE
      new_status := current_status;
    END IF;
  ELSE
    new_status := 'incomplete';
  END IF;
  
  IF new_status != current_status OR current_status IS NULL THEN
    UPDATE drivers 
    SET status = new_status::driver_status, updated_at = NOW()
    WHERE user_id = driver_user_id;
    
    RETURN format('Statut: %s → %s (%s%%)', 
                  COALESCE(current_status, 'null'), new_status, completeness_result.completion_percentage);
  ELSE
    RETURN format('Statut inchangé: %s (%s%%)', 
                  current_status, completeness_result.completion_percentage);
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_driver_status_by_id(driver_id uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  driver_user_id UUID;
  completeness_result record;
  new_status text;
  current_status text;
BEGIN
  -- Récupérer le user_id et le statut actuel
  SELECT user_id, status INTO driver_user_id, current_status 
  FROM drivers 
  WHERE id = driver_id;
  
  IF NOT FOUND THEN
    RETURN 'Driver introuvable';
  END IF;
  
  -- Utiliser la fonction existante pour vérifier la complétude
  SELECT * INTO completeness_result 
  FROM check_driver_profile_completeness(driver_user_id);
  
  IF NOT FOUND THEN
    RETURN 'Erreur lors de la vérification';
  END IF;
  
  -- Appliquer la même logique que update_driver_status_auto
  IF completeness_result.is_complete THEN
    IF current_status = 'incomplete' OR current_status IS NULL THEN
      new_status := 'pending_validation';
    ELSE
      new_status := current_status;
    END IF;
  ELSE
    new_status := 'incomplete';
  END IF;
  
  -- Mettre à jour uniquement si le statut change
  IF new_status != current_status OR current_status IS NULL THEN
    UPDATE drivers 
    SET status = new_status::driver_status, updated_at = NOW()
    WHERE id = driver_id;
    
    RETURN format('Statut: %s → %s (%s%%)', 
                  COALESCE(current_status, 'null'), new_status, completeness_result.completion_percentage);
  ELSE
    RETURN format('Statut inchangé: %s (%s%%)', 
                  current_status, completeness_result.completion_percentage);
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_ride_details_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_rides_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_audit_logs_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.metadata IS NOT NULL AND jsonb_typeof(NEW.metadata) != 'object' THEN
    RAISE EXCEPTION 'metadata must be a JSON object';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_driver(driver_id uuid, approved boolean, rejection_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  -- Vérification que l'utilisateur est admin
  IF NOT auth.role() = ANY(ARRAY['app_admin', 'app_super_admin']) THEN
    RAISE EXCEPTION 'Only administrators can validate drivers';
  END IF;

  -- Récupération de l'ID de l'utilisateur associé au chauffeur
  SELECT user_id INTO v_user_id
  FROM public.drivers
  WHERE id = driver_id AND status = 'pending_validation'::driver_status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Driver not found or not pending validation';
  END IF;

  IF approved THEN
    -- Mise à jour du statut du chauffeur
    UPDATE public.drivers
    SET 
      status = 'active'::driver_status,
      updated_at = NOW()
    WHERE id = driver_id;

    -- Attribution du rôle de chauffeur
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      '"app_driver"'
    )
    WHERE id = v_user_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Driver validated successfully',
      'status', 'active'
    );
  ELSE
    -- Rejet de la demande
    UPDATE public.drivers
    SET 
      status = 'inactive'::driver_status,
      updated_at = NOW(),
      raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{rejection_reason}',
        to_jsonb(COALESCE(rejection_reason, 'No reason provided'))
      )
    WHERE id = driver_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Driver application rejected',
      'status', 'inactive',
      'reason', COALESCE(rejection_reason, 'No reason provided')
    );
  END IF;

EXCEPTION WHEN others THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_ride_acceptance()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  auth_result record;
BEGIN
  -- Validation lors de l'assignation d'un driver
  IF NEW.driver_id IS NOT NULL AND (OLD.driver_id IS NULL OR OLD.driver_id != NEW.driver_id) THEN
    SELECT * INTO auth_result FROM can_driver_accept_rides(NEW.driver_id);
    
    IF NOT auth_result.can_accept THEN
      RAISE EXCEPTION 'Driver non autorisé: %', auth_result.reason;
    END IF;
    
    -- Auto-changer le statut
    IF NEW.status = 'pending' THEN
      NEW.status := 'accepted';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."audit_logs" to "anon";

grant insert on table "public"."audit_logs" to "anon";

grant references on table "public"."audit_logs" to "anon";

grant select on table "public"."audit_logs" to "anon";

grant trigger on table "public"."audit_logs" to "anon";

grant truncate on table "public"."audit_logs" to "anon";

grant update on table "public"."audit_logs" to "anon";

grant delete on table "public"."audit_logs" to "authenticated";

grant insert on table "public"."audit_logs" to "authenticated";

grant references on table "public"."audit_logs" to "authenticated";

grant select on table "public"."audit_logs" to "authenticated";

grant trigger on table "public"."audit_logs" to "authenticated";

grant truncate on table "public"."audit_logs" to "authenticated";

grant update on table "public"."audit_logs" to "authenticated";

grant delete on table "public"."audit_logs" to "service_role";

grant insert on table "public"."audit_logs" to "service_role";

grant references on table "public"."audit_logs" to "service_role";

grant select on table "public"."audit_logs" to "service_role";

grant trigger on table "public"."audit_logs" to "service_role";

grant truncate on table "public"."audit_logs" to "service_role";

grant update on table "public"."audit_logs" to "service_role";

grant delete on table "public"."corporate_discounts" to "anon";

grant insert on table "public"."corporate_discounts" to "anon";

grant references on table "public"."corporate_discounts" to "anon";

grant select on table "public"."corporate_discounts" to "anon";

grant trigger on table "public"."corporate_discounts" to "anon";

grant truncate on table "public"."corporate_discounts" to "anon";

grant update on table "public"."corporate_discounts" to "anon";

grant delete on table "public"."corporate_discounts" to "authenticated";

grant insert on table "public"."corporate_discounts" to "authenticated";

grant references on table "public"."corporate_discounts" to "authenticated";

grant select on table "public"."corporate_discounts" to "authenticated";

grant trigger on table "public"."corporate_discounts" to "authenticated";

grant truncate on table "public"."corporate_discounts" to "authenticated";

grant update on table "public"."corporate_discounts" to "authenticated";

grant delete on table "public"."corporate_discounts" to "service_role";

grant insert on table "public"."corporate_discounts" to "service_role";

grant references on table "public"."corporate_discounts" to "service_role";

grant select on table "public"."corporate_discounts" to "service_role";

grant trigger on table "public"."corporate_discounts" to "service_role";

grant truncate on table "public"."corporate_discounts" to "service_role";

grant update on table "public"."corporate_discounts" to "service_role";

grant delete on table "public"."driver_documents" to "anon";

grant insert on table "public"."driver_documents" to "anon";

grant references on table "public"."driver_documents" to "anon";

grant select on table "public"."driver_documents" to "anon";

grant trigger on table "public"."driver_documents" to "anon";

grant truncate on table "public"."driver_documents" to "anon";

grant update on table "public"."driver_documents" to "anon";

grant delete on table "public"."driver_documents" to "authenticated";

grant insert on table "public"."driver_documents" to "authenticated";

grant references on table "public"."driver_documents" to "authenticated";

grant select on table "public"."driver_documents" to "authenticated";

grant trigger on table "public"."driver_documents" to "authenticated";

grant truncate on table "public"."driver_documents" to "authenticated";

grant update on table "public"."driver_documents" to "authenticated";

grant delete on table "public"."driver_documents" to "service_role";

grant insert on table "public"."driver_documents" to "service_role";

grant references on table "public"."driver_documents" to "service_role";

grant select on table "public"."driver_documents" to "service_role";

grant trigger on table "public"."driver_documents" to "service_role";

grant truncate on table "public"."driver_documents" to "service_role";

grant update on table "public"."driver_documents" to "service_role";

grant delete on table "public"."driver_rewards" to "anon";

grant insert on table "public"."driver_rewards" to "anon";

grant references on table "public"."driver_rewards" to "anon";

grant select on table "public"."driver_rewards" to "anon";

grant trigger on table "public"."driver_rewards" to "anon";

grant truncate on table "public"."driver_rewards" to "anon";

grant update on table "public"."driver_rewards" to "anon";

grant delete on table "public"."driver_rewards" to "authenticated";

grant insert on table "public"."driver_rewards" to "authenticated";

grant references on table "public"."driver_rewards" to "authenticated";

grant select on table "public"."driver_rewards" to "authenticated";

grant trigger on table "public"."driver_rewards" to "authenticated";

grant truncate on table "public"."driver_rewards" to "authenticated";

grant update on table "public"."driver_rewards" to "authenticated";

grant delete on table "public"."driver_rewards" to "service_role";

grant insert on table "public"."driver_rewards" to "service_role";

grant references on table "public"."driver_rewards" to "service_role";

grant select on table "public"."driver_rewards" to "service_role";

grant trigger on table "public"."driver_rewards" to "service_role";

grant truncate on table "public"."driver_rewards" to "service_role";

grant update on table "public"."driver_rewards" to "service_role";

grant delete on table "public"."drivers" to "anon";

grant insert on table "public"."drivers" to "anon";

grant references on table "public"."drivers" to "anon";

grant select on table "public"."drivers" to "anon";

grant trigger on table "public"."drivers" to "anon";

grant truncate on table "public"."drivers" to "anon";

grant update on table "public"."drivers" to "anon";

grant delete on table "public"."drivers" to "authenticated";

grant insert on table "public"."drivers" to "authenticated";

grant references on table "public"."drivers" to "authenticated";

grant select on table "public"."drivers" to "authenticated";

grant trigger on table "public"."drivers" to "authenticated";

grant truncate on table "public"."drivers" to "authenticated";

grant update on table "public"."drivers" to "authenticated";

grant delete on table "public"."drivers" to "service_role";

grant insert on table "public"."drivers" to "service_role";

grant references on table "public"."drivers" to "service_role";

grant select on table "public"."drivers" to "service_role";

grant trigger on table "public"."drivers" to "service_role";

grant truncate on table "public"."drivers" to "service_role";

grant update on table "public"."drivers" to "service_role";

grant delete on table "public"."options" to "anon";

grant insert on table "public"."options" to "anon";

grant references on table "public"."options" to "anon";

grant select on table "public"."options" to "anon";

grant trigger on table "public"."options" to "anon";

grant truncate on table "public"."options" to "anon";

grant update on table "public"."options" to "anon";

grant delete on table "public"."options" to "authenticated";

grant insert on table "public"."options" to "authenticated";

grant references on table "public"."options" to "authenticated";

grant select on table "public"."options" to "authenticated";

grant trigger on table "public"."options" to "authenticated";

grant truncate on table "public"."options" to "authenticated";

grant update on table "public"."options" to "authenticated";

grant delete on table "public"."options" to "service_role";

grant insert on table "public"."options" to "service_role";

grant references on table "public"."options" to "service_role";

grant select on table "public"."options" to "service_role";

grant trigger on table "public"."options" to "service_role";

grant truncate on table "public"."options" to "service_role";

grant update on table "public"."options" to "service_role";

grant delete on table "public"."promo_codes" to "anon";

grant insert on table "public"."promo_codes" to "anon";

grant references on table "public"."promo_codes" to "anon";

grant select on table "public"."promo_codes" to "anon";

grant trigger on table "public"."promo_codes" to "anon";

grant truncate on table "public"."promo_codes" to "anon";

grant update on table "public"."promo_codes" to "anon";

grant delete on table "public"."promo_codes" to "authenticated";

grant insert on table "public"."promo_codes" to "authenticated";

grant references on table "public"."promo_codes" to "authenticated";

grant select on table "public"."promo_codes" to "authenticated";

grant trigger on table "public"."promo_codes" to "authenticated";

grant truncate on table "public"."promo_codes" to "authenticated";

grant update on table "public"."promo_codes" to "authenticated";

grant delete on table "public"."promo_codes" to "service_role";

grant insert on table "public"."promo_codes" to "service_role";

grant references on table "public"."promo_codes" to "service_role";

grant select on table "public"."promo_codes" to "service_role";

grant trigger on table "public"."promo_codes" to "service_role";

grant truncate on table "public"."promo_codes" to "service_role";

grant update on table "public"."promo_codes" to "service_role";

grant delete on table "public"."promo_usages" to "anon";

grant insert on table "public"."promo_usages" to "anon";

grant references on table "public"."promo_usages" to "anon";

grant select on table "public"."promo_usages" to "anon";

grant trigger on table "public"."promo_usages" to "anon";

grant truncate on table "public"."promo_usages" to "anon";

grant update on table "public"."promo_usages" to "anon";

grant delete on table "public"."promo_usages" to "authenticated";

grant insert on table "public"."promo_usages" to "authenticated";

grant references on table "public"."promo_usages" to "authenticated";

grant select on table "public"."promo_usages" to "authenticated";

grant trigger on table "public"."promo_usages" to "authenticated";

grant truncate on table "public"."promo_usages" to "authenticated";

grant update on table "public"."promo_usages" to "authenticated";

grant delete on table "public"."promo_usages" to "service_role";

grant insert on table "public"."promo_usages" to "service_role";

grant references on table "public"."promo_usages" to "service_role";

grant select on table "public"."promo_usages" to "service_role";

grant trigger on table "public"."promo_usages" to "service_role";

grant truncate on table "public"."promo_usages" to "service_role";

grant update on table "public"."promo_usages" to "service_role";

grant delete on table "public"."rates" to "anon";

grant insert on table "public"."rates" to "anon";

grant references on table "public"."rates" to "anon";

grant select on table "public"."rates" to "anon";

grant trigger on table "public"."rates" to "anon";

grant truncate on table "public"."rates" to "anon";

grant update on table "public"."rates" to "anon";

grant delete on table "public"."rates" to "authenticated";

grant insert on table "public"."rates" to "authenticated";

grant references on table "public"."rates" to "authenticated";

grant select on table "public"."rates" to "authenticated";

grant trigger on table "public"."rates" to "authenticated";

grant truncate on table "public"."rates" to "authenticated";

grant update on table "public"."rates" to "authenticated";

grant delete on table "public"."rates" to "service_role";

grant insert on table "public"."rates" to "service_role";

grant references on table "public"."rates" to "service_role";

grant select on table "public"."rates" to "service_role";

grant trigger on table "public"."rates" to "service_role";

grant truncate on table "public"."rates" to "service_role";

grant update on table "public"."rates" to "service_role";

grant delete on table "public"."ride_status_history" to "anon";

grant insert on table "public"."ride_status_history" to "anon";

grant references on table "public"."ride_status_history" to "anon";

grant select on table "public"."ride_status_history" to "anon";

grant trigger on table "public"."ride_status_history" to "anon";

grant truncate on table "public"."ride_status_history" to "anon";

grant update on table "public"."ride_status_history" to "anon";

grant delete on table "public"."ride_status_history" to "authenticated";

grant insert on table "public"."ride_status_history" to "authenticated";

grant references on table "public"."ride_status_history" to "authenticated";

grant select on table "public"."ride_status_history" to "authenticated";

grant trigger on table "public"."ride_status_history" to "authenticated";

grant truncate on table "public"."ride_status_history" to "authenticated";

grant update on table "public"."ride_status_history" to "authenticated";

grant delete on table "public"."ride_status_history" to "service_role";

grant insert on table "public"."ride_status_history" to "service_role";

grant references on table "public"."ride_status_history" to "service_role";

grant select on table "public"."ride_status_history" to "service_role";

grant trigger on table "public"."ride_status_history" to "service_role";

grant truncate on table "public"."ride_status_history" to "service_role";

grant update on table "public"."ride_status_history" to "service_role";

grant delete on table "public"."ride_stops" to "anon";

grant insert on table "public"."ride_stops" to "anon";

grant references on table "public"."ride_stops" to "anon";

grant select on table "public"."ride_stops" to "anon";

grant trigger on table "public"."ride_stops" to "anon";

grant truncate on table "public"."ride_stops" to "anon";

grant update on table "public"."ride_stops" to "anon";

grant delete on table "public"."ride_stops" to "authenticated";

grant insert on table "public"."ride_stops" to "authenticated";

grant references on table "public"."ride_stops" to "authenticated";

grant select on table "public"."ride_stops" to "authenticated";

grant trigger on table "public"."ride_stops" to "authenticated";

grant truncate on table "public"."ride_stops" to "authenticated";

grant update on table "public"."ride_stops" to "authenticated";

grant delete on table "public"."ride_stops" to "service_role";

grant insert on table "public"."ride_stops" to "service_role";

grant references on table "public"."ride_stops" to "service_role";

grant select on table "public"."ride_stops" to "service_role";

grant trigger on table "public"."ride_stops" to "service_role";

grant truncate on table "public"."ride_stops" to "service_role";

grant update on table "public"."ride_stops" to "service_role";

grant delete on table "public"."rides" to "anon";

grant insert on table "public"."rides" to "anon";

grant references on table "public"."rides" to "anon";

grant select on table "public"."rides" to "anon";

grant trigger on table "public"."rides" to "anon";

grant truncate on table "public"."rides" to "anon";

grant update on table "public"."rides" to "anon";

grant delete on table "public"."rides" to "authenticated";

grant insert on table "public"."rides" to "authenticated";

grant references on table "public"."rides" to "authenticated";

grant select on table "public"."rides" to "authenticated";

grant trigger on table "public"."rides" to "authenticated";

grant truncate on table "public"."rides" to "authenticated";

grant update on table "public"."rides" to "authenticated";

grant delete on table "public"."rides" to "service_role";

grant insert on table "public"."rides" to "service_role";

grant references on table "public"."rides" to "service_role";

grant select on table "public"."rides" to "service_role";

grant trigger on table "public"."rides" to "service_role";

grant truncate on table "public"."rides" to "service_role";

grant update on table "public"."rides" to "service_role";

grant delete on table "public"."seasonal_promotions" to "anon";

grant insert on table "public"."seasonal_promotions" to "anon";

grant references on table "public"."seasonal_promotions" to "anon";

grant select on table "public"."seasonal_promotions" to "anon";

grant trigger on table "public"."seasonal_promotions" to "anon";

grant truncate on table "public"."seasonal_promotions" to "anon";

grant update on table "public"."seasonal_promotions" to "anon";

grant delete on table "public"."seasonal_promotions" to "authenticated";

grant insert on table "public"."seasonal_promotions" to "authenticated";

grant references on table "public"."seasonal_promotions" to "authenticated";

grant select on table "public"."seasonal_promotions" to "authenticated";

grant trigger on table "public"."seasonal_promotions" to "authenticated";

grant truncate on table "public"."seasonal_promotions" to "authenticated";

grant update on table "public"."seasonal_promotions" to "authenticated";

grant delete on table "public"."seasonal_promotions" to "service_role";

grant insert on table "public"."seasonal_promotions" to "service_role";

grant references on table "public"."seasonal_promotions" to "service_role";

grant select on table "public"."seasonal_promotions" to "service_role";

grant trigger on table "public"."seasonal_promotions" to "service_role";

grant truncate on table "public"."seasonal_promotions" to "service_role";

grant update on table "public"."seasonal_promotions" to "service_role";

grant delete on table "public"."status_reason_categories" to "anon";

grant insert on table "public"."status_reason_categories" to "anon";

grant references on table "public"."status_reason_categories" to "anon";

grant select on table "public"."status_reason_categories" to "anon";

grant trigger on table "public"."status_reason_categories" to "anon";

grant truncate on table "public"."status_reason_categories" to "anon";

grant update on table "public"."status_reason_categories" to "anon";

grant delete on table "public"."status_reason_categories" to "authenticated";

grant insert on table "public"."status_reason_categories" to "authenticated";

grant references on table "public"."status_reason_categories" to "authenticated";

grant select on table "public"."status_reason_categories" to "authenticated";

grant trigger on table "public"."status_reason_categories" to "authenticated";

grant truncate on table "public"."status_reason_categories" to "authenticated";

grant update on table "public"."status_reason_categories" to "authenticated";

grant delete on table "public"."status_reason_categories" to "service_role";

grant insert on table "public"."status_reason_categories" to "service_role";

grant references on table "public"."status_reason_categories" to "service_role";

grant select on table "public"."status_reason_categories" to "service_role";

grant trigger on table "public"."status_reason_categories" to "service_role";

grant truncate on table "public"."status_reason_categories" to "service_role";

grant update on table "public"."status_reason_categories" to "service_role";

grant delete on table "public"."user_profiles" to "anon";

grant insert on table "public"."user_profiles" to "anon";

grant references on table "public"."user_profiles" to "anon";

grant select on table "public"."user_profiles" to "anon";

grant trigger on table "public"."user_profiles" to "anon";

grant truncate on table "public"."user_profiles" to "anon";

grant update on table "public"."user_profiles" to "anon";

grant delete on table "public"."user_profiles" to "authenticated";

grant insert on table "public"."user_profiles" to "authenticated";

grant references on table "public"."user_profiles" to "authenticated";

grant select on table "public"."user_profiles" to "authenticated";

grant trigger on table "public"."user_profiles" to "authenticated";

grant truncate on table "public"."user_profiles" to "authenticated";

grant update on table "public"."user_profiles" to "authenticated";

grant delete on table "public"."user_profiles" to "service_role";

grant insert on table "public"."user_profiles" to "service_role";

grant references on table "public"."user_profiles" to "service_role";

grant select on table "public"."user_profiles" to "service_role";

grant trigger on table "public"."user_profiles" to "service_role";

grant truncate on table "public"."user_profiles" to "service_role";

grant update on table "public"."user_profiles" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."vehicle_documents" to "anon";

grant insert on table "public"."vehicle_documents" to "anon";

grant references on table "public"."vehicle_documents" to "anon";

grant select on table "public"."vehicle_documents" to "anon";

grant trigger on table "public"."vehicle_documents" to "anon";

grant truncate on table "public"."vehicle_documents" to "anon";

grant update on table "public"."vehicle_documents" to "anon";

grant delete on table "public"."vehicle_documents" to "authenticated";

grant insert on table "public"."vehicle_documents" to "authenticated";

grant references on table "public"."vehicle_documents" to "authenticated";

grant select on table "public"."vehicle_documents" to "authenticated";

grant trigger on table "public"."vehicle_documents" to "authenticated";

grant truncate on table "public"."vehicle_documents" to "authenticated";

grant update on table "public"."vehicle_documents" to "authenticated";

grant delete on table "public"."vehicle_documents" to "service_role";

grant insert on table "public"."vehicle_documents" to "service_role";

grant references on table "public"."vehicle_documents" to "service_role";

grant select on table "public"."vehicle_documents" to "service_role";

grant trigger on table "public"."vehicle_documents" to "service_role";

grant truncate on table "public"."vehicle_documents" to "service_role";

grant update on table "public"."vehicle_documents" to "service_role";

grant delete on table "public"."vehicles" to "anon";

grant insert on table "public"."vehicles" to "anon";

grant references on table "public"."vehicles" to "anon";

grant select on table "public"."vehicles" to "anon";

grant trigger on table "public"."vehicles" to "anon";

grant truncate on table "public"."vehicles" to "anon";

grant update on table "public"."vehicles" to "anon";

grant delete on table "public"."vehicles" to "authenticated";

grant insert on table "public"."vehicles" to "authenticated";

grant references on table "public"."vehicles" to "authenticated";

grant select on table "public"."vehicles" to "authenticated";

grant trigger on table "public"."vehicles" to "authenticated";

grant truncate on table "public"."vehicles" to "authenticated";

grant update on table "public"."vehicles" to "authenticated";

grant delete on table "public"."vehicles" to "service_role";

grant insert on table "public"."vehicles" to "service_role";

grant references on table "public"."vehicles" to "service_role";

grant select on table "public"."vehicles" to "service_role";

grant trigger on table "public"."vehicles" to "service_role";

grant truncate on table "public"."vehicles" to "service_role";

grant update on table "public"."vehicles" to "service_role";


  create policy "Admins can view all driver documents"
  on "public"."driver_documents"
  as permissive
  for select
  to authenticated
using ((((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['app_admin'::text, 'app_super_admin'::text])));



  create policy "Drivers can manage own documents"
  on "public"."driver_documents"
  as permissive
  for all
  to authenticated
using ((driver_id IN ( SELECT drivers.id
   FROM public.drivers
  WHERE (drivers.user_id = auth.uid()))));



  create policy "Admins can insert drivers"
  on "public"."drivers"
  as permissive
  for insert
  to authenticated
with check ((((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['app_admin'::text, 'app_super_admin'::text])));



  create policy "Admins can update all drivers"
  on "public"."drivers"
  as permissive
  for update
  to authenticated
using ((((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['app_admin'::text, 'app_super_admin'::text])));



  create policy "Admins can view all drivers"
  on "public"."drivers"
  as permissive
  for select
  to public
using ((public.is_admin() OR public.is_super_admin()));



  create policy "Drivers can check own completeness"
  on "public"."drivers"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "drivers_admin_access"
  on "public"."drivers"
  as permissive
  for all
  to public
using (((((auth.jwt() ->> 'app_metadata'::text))::jsonb ->> 'role'::text) = ANY (ARRAY['app_admin'::text, 'app_super_admin'::text])));



  create policy "drivers_own_access"
  on "public"."drivers"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "allow_read_options"
  on "public"."options"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Allow DELETE for authenticated users"
  on "public"."rates"
  as permissive
  for delete
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Allow INSERT for authenticated users"
  on "public"."rates"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Allow SELECT for all authenticated and service role"
  on "public"."rates"
  as permissive
  for select
  to public
using (((auth.role() = ANY (ARRAY['authenticated'::text, 'service_role'::text])) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text)));



  create policy "Allow SELECT for authenticated users"
  on "public"."rates"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Allow UPDATE for authenticated users"
  on "public"."rates"
  as permissive
  for update
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "allow_read_rates"
  on "public"."rates"
  as permissive
  for select
  to authenticated
using (true);



  create policy "rides_accept_by_driver"
  on "public"."rides"
  as permissive
  for update
  to public
using ((((driver_id IS NULL) AND (status = 'pending'::public.ride_status) AND ((((auth.jwt() ->> 'app_metadata'::text))::jsonb ->> 'role'::text) = 'app_driver'::text)) OR (driver_id = ( SELECT drivers.id
   FROM public.drivers
  WHERE (drivers.user_id = auth.uid())))))
with check (((driver_id = ( SELECT drivers.id
   FROM public.drivers
  WHERE (drivers.user_id = auth.uid()))) AND (status = ANY (ARRAY['scheduled'::public.ride_status, 'in-progress'::public.ride_status, 'completed'::public.ride_status, 'driver-canceled'::public.ride_status]))));



  create policy "rides_admin_all"
  on "public"."rides"
  as permissive
  for all
  to public
using (((((auth.jwt() ->> 'app_metadata'::text))::jsonb ->> 'role'::text) = ANY (ARRAY['app_admin'::text, 'app_super_admin'::text])));



  create policy "rides_assigned_to_driver"
  on "public"."rides"
  as permissive
  for select
  to public
using ((driver_id = ( SELECT drivers.id
   FROM public.drivers
  WHERE (drivers.user_id = auth.uid()))));



  create policy "rides_available_for_drivers"
  on "public"."rides"
  as permissive
  for select
  to public
using (((driver_id IS NULL) AND (status = 'pending'::public.ride_status) AND ((((auth.jwt() ->> 'app_metadata'::text))::jsonb ->> 'role'::text) = 'app_driver'::text)));



  create policy "rides_create_customer"
  on "public"."rides"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "rides_own_customer"
  on "public"."rides"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "rides_update_assigned"
  on "public"."rides"
  as permissive
  for update
  to public
using ((driver_id = ( SELECT drivers.id
   FROM public.drivers
  WHERE (drivers.user_id = auth.uid()))))
with check (((driver_id = ( SELECT drivers.id
   FROM public.drivers
  WHERE (drivers.user_id = auth.uid()))) AND (status = ANY (ARRAY['scheduled'::public.ride_status, 'in-progress'::public.ride_status, 'completed'::public.ride_status, 'driver-canceled'::public.ride_status]))));



  create policy "rides_update_by_customer"
  on "public"."rides"
  as permissive
  for update
  to authenticated
using ((user_id = auth.uid()))
with check (((user_id = auth.uid()) AND (status = ANY (ARRAY['pending'::public.ride_status, 'client-canceled'::public.ride_status]))));



  create policy "Allow DELETE for authenticated users"
  on "public"."seasonal_promotions"
  as permissive
  for delete
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Allow INSERT for authenticated users"
  on "public"."seasonal_promotions"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Allow SELECT for authenticated users"
  on "public"."seasonal_promotions"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Allow UPDATE for authenticated users"
  on "public"."seasonal_promotions"
  as permissive
  for update
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Admins can update all users"
  on "public"."users"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM auth.users au
  WHERE ((au.id = auth.uid()) AND ((au.raw_app_meta_data ->> 'role'::text) = ANY (ARRAY['app_admin'::text, 'app_super_admin'::text]))))));



  create policy "Admins can view all users"
  on "public"."users"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM auth.users au
  WHERE ((au.id = auth.uid()) AND ((au.raw_app_meta_data ->> 'role'::text) = ANY (ARRAY['app_admin'::text, 'app_super_admin'::text]))))));



  create policy "Allow user updates"
  on "public"."users"
  as permissive
  for update
  to public
using (public.check_user_role_update())
with check (public.check_user_role_update());



  create policy "Enable users to update their own profile"
  on "public"."users"
  as permissive
  for update
  to public
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "Users can create own profile"
  on "public"."users"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "Users can update own basic info"
  on "public"."users"
  as permissive
  for update
  to public
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "Users can update own profile"
  on "public"."users"
  as permissive
  for update
  to public
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "Users can view own profile"
  on "public"."users"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "Users can view their own profile"
  on "public"."users"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "admin_full_access"
  on "public"."users"
  as permissive
  for all
  to authenticated
using (public.is_admin());



  create policy "admin_full_access_users"
  on "public"."users"
  as permissive
  for all
  to authenticated
using (public.is_admin());



  create policy "user_read_own"
  on "public"."users"
  as permissive
  for select
  to authenticated
using ((id = auth.uid()));



  create policy "Admins can view all driver vehicles"
  on "public"."vehicles"
  as permissive
  for select
  to authenticated
using ((((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['app_admin'::text, 'app_super_admin'::text])));



  create policy "Drivers can manage own vehicles"
  on "public"."vehicles"
  as permissive
  for all
  to authenticated
using ((driver_id IN ( SELECT drivers.id
   FROM public.drivers
  WHERE (drivers.user_id = auth.uid()))));


CREATE TRIGGER update_audit_logs_timestamp BEFORE UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.update_audit_logs_updated_at();

CREATE TRIGGER validate_audit_logs_metadata BEFORE INSERT OR UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.validate_audit_logs_metadata();

CREATE TRIGGER trigger_driver_status_update_on_document AFTER INSERT OR DELETE OR UPDATE ON public.driver_documents FOR EACH ROW EXECUTE FUNCTION public.handle_driver_status_updates();

CREATE TRIGGER cleanup_driver_files_on_delete AFTER DELETE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.cleanup_orphaned_files();

CREATE TRIGGER trigger_driver_status_update_on_driver AFTER INSERT OR DELETE OR UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.handle_driver_status_updates();

CREATE TRIGGER "price-calculator-update-webhook" AFTER UPDATE ON public.rides FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://iodsddzustunlahxafif.supabase.co/functions/v1/price-calculator', 'POST', '{"Content-type":"application/json"}', '{}', '5000');

CREATE TRIGGER validate_ride_acceptance_trigger BEFORE UPDATE ON public.rides FOR EACH ROW EXECUTE FUNCTION public.validate_ride_acceptance();

CREATE TRIGGER trigger_driver_status_update_on_vehicle AFTER INSERT OR DELETE OR UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.handle_driver_status_updates();

CREATE TRIGGER update_driver_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


