-- Garage AZ — schéma initial (PostgreSQL / Supabase)
-- Exécuter dans l’éditeur SQL Supabase ou via CLI : supabase db push

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE public.garages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Garage',
  legal_name text,
  address text,
  postal_code text,
  city text,
  canton text,
  country text NOT NULL DEFAULT 'Suisse',
  phone text,
  email text,
  website text,
  logo_url text,
  iban text,
  bank_name text,
  bank_account_holder text,
  vat_number text,
  default_payment_terms text,
  default_invoice_note text,
  default_vat_rate numeric(5,2) DEFAULT 8.10,
  currency text NOT NULL DEFAULT 'CHF',
  invoice_prefix text NOT NULL DEFAULT 'AZ',
  qr_bill_enabled boolean NOT NULL DEFAULT false,
  invoice_notice text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  garage_id uuid NOT NULL REFERENCES public.garages (id) ON DELETE RESTRICT,
  full_name text,
  role text NOT NULL DEFAULT 'employé' CHECK (role IN ('administrateur', 'employé')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.garage_invoice_counters (
  garage_id uuid NOT NULL REFERENCES public.garages (id) ON DELETE CASCADE,
  year integer NOT NULL,
  last_number integer NOT NULL DEFAULT 0,
  PRIMARY KEY (garage_id, year)
);

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES public.garages (id) ON DELETE CASCADE,
  customer_type text NOT NULL DEFAULT 'particulier' CHECK (customer_type IN ('particulier', 'entreprise')),
  first_name text,
  last_name text,
  company_name text,
  address text,
  postal_code text,
  city text,
  canton text,
  country text NOT NULL DEFAULT 'Suisse',
  phone text,
  email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES public.garages (id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  model text,
  version text,
  year integer,
  first_registration_date date,
  mileage integer,
  fuel_type text,
  transmission text,
  power text,
  color text,
  doors integer,
  seats integer,
  vin text,
  matricule text,
  purchase_date date,
  purchase_price numeric(14,2) DEFAULT 0,
  seller_name text,
  seller_contact text,
  additional_fees numeric(14,2) DEFAULT 0,
  repair_fees numeric(14,2) DEFAULT 0,
  preparation_fees numeric(14,2) DEFAULT 0,
  administrative_fees numeric(14,2) DEFAULT 0,
  total_cost numeric(14,2) DEFAULT 0,
  desired_sale_price numeric(14,2),
  description text,
  internal_notes text,
  status text NOT NULL DEFAULT 'en stock' CHECK (
    status IN ('en stock', 'en préparation', 'réservé', 'vendu', 'archivé')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.vehicle_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES public.garages (id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles (id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_path text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.vehicle_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES public.garages (id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles (id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text,
  file_url text NOT NULL,
  file_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Factures avant ventes (liaison optionnelle vente ↔ facture)
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES public.garages (id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers (id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.vehicles (id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  status text NOT NULL DEFAULT 'brouillon' CHECK (
    status IN ('brouillon', 'envoyée', 'payée', 'en retard', 'annulée')
  ),
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  vat_rate numeric(5,2) DEFAULT 0,
  vat_amount numeric(14,2) DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  payment_terms text,
  pdf_url text,
  pdf_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (garage_id, invoice_number)
);

CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES public.garages (id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles (id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  sale_date date NOT NULL,
  sale_price numeric(14,2) NOT NULL,
  purchase_price numeric(14,2),
  total_cost numeric(14,2),
  profit numeric(14,2),
  profit_percentage numeric(8,4),
  payment_method text,
  payment_status text DEFAULT 'impayé' CHECK (payment_status IN ('payé', 'impayé', 'partiel')),
  warranty text,
  notes text,
  invoice_id uuid REFERENCES public.invoices (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices
  ADD COLUMN sale_id uuid REFERENCES public.sales (id) ON DELETE SET NULL;

CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES public.garages (id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices (id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(12,3) NOT NULL DEFAULT 1,
  unit_price numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Index
-- ---------------------------------------------------------------------------
CREATE INDEX idx_profiles_garage ON public.profiles (garage_id);
CREATE INDEX idx_vehicles_garage_status ON public.vehicles (garage_id, status);
CREATE INDEX idx_vehicles_garage_created ON public.vehicles (garage_id, created_at DESC);
CREATE INDEX idx_vehicle_photos_vehicle ON public.vehicle_photos (vehicle_id);
CREATE INDEX idx_vehicle_documents_vehicle ON public.vehicle_documents (vehicle_id);
CREATE INDEX idx_customers_garage ON public.customers (garage_id);
CREATE INDEX idx_customers_name ON public.customers (garage_id, last_name, first_name);
CREATE INDEX idx_sales_garage ON public.sales (garage_id, sale_date DESC);
CREATE INDEX idx_invoices_garage ON public.invoices (garage_id, invoice_date DESC);
CREATE INDEX idx_invoices_number ON public.invoices (garage_id, invoice_number);
CREATE INDEX idx_invoice_items_invoice ON public.invoice_items (invoice_id);

-- ---------------------------------------------------------------------------
-- Fonctions utilitaires
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.compute_vehicle_total_cost()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.total_cost :=
    COALESCE(NEW.purchase_price, 0)
    + COALESCE(NEW.additional_fees, 0)
    + COALESCE(NEW.repair_fees, 0)
    + COALESCE(NEW.preparation_fees, 0)
    + COALESCE(NEW.administrative_fees, 0);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.next_invoice_number(p_garage_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  y integer := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
  pfx text;
  num integer;
BEGIN
  SELECT COALESCE(NULLIF(TRIM(invoice_prefix), ''), 'AZ') INTO pfx
  FROM garages WHERE id = p_garage_id;
  IF pfx IS NULL THEN
    pfx := 'AZ';
  END IF;

  INSERT INTO garage_invoice_counters (garage_id, year, last_number)
  VALUES (p_garage_id, y, 1)
  ON CONFLICT (garage_id, year)
  DO UPDATE SET last_number = garage_invoice_counters.last_number + 1
  RETURNING last_number INTO num;

  RETURN pfx || '-' || y::text || '-' || lpad(num::text, 4, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.next_invoice_number(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_invoice_number(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER tr_garages_updated BEFORE UPDATE ON public.garages
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER tr_customers_updated BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER tr_vehicles_updated BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER tr_sales_updated BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER tr_invoices_updated BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER tr_vehicles_total_cost_insert BEFORE INSERT ON public.vehicles
  FOR EACH ROW EXECUTE PROCEDURE public.compute_vehicle_total_cost();
CREATE TRIGGER tr_vehicles_total_cost_update BEFORE UPDATE OF
  purchase_price, additional_fees, repair_fees, preparation_fees, administrative_fees
  ON public.vehicles
  FOR EACH ROW EXECUTE PROCEDURE public.compute_vehicle_total_cost();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.garages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garage_invoice_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_garage_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT garage_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_garage_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_garage_id() TO authenticated;

-- Garages : lecture / mise à jour du garage lié uniquement
CREATE POLICY garages_select ON public.garages
  FOR SELECT TO authenticated
  USING (id = public.current_garage_id());

CREATE POLICY garages_update ON public.garages
  FOR UPDATE TO authenticated
  USING (id = public.current_garage_id())
  WITH CHECK (id = public.current_garage_id());

-- Profiles
CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND garage_id = public.current_garage_id());

-- Compteurs factures (lecture seule côté app ; incrément via RPC security definer)
CREATE POLICY garage_invoice_counters_select ON public.garage_invoice_counters
  FOR SELECT TO authenticated
  USING (garage_id = public.current_garage_id());

-- Customers
CREATE POLICY customers_all ON public.customers
  FOR ALL TO authenticated
  USING (garage_id = public.current_garage_id())
  WITH CHECK (garage_id = public.current_garage_id());

-- Vehicles
CREATE POLICY vehicles_all ON public.vehicles
  FOR ALL TO authenticated
  USING (garage_id = public.current_garage_id())
  WITH CHECK (garage_id = public.current_garage_id());

-- Vehicle photos
CREATE POLICY vehicle_photos_all ON public.vehicle_photos
  FOR ALL TO authenticated
  USING (garage_id = public.current_garage_id())
  WITH CHECK (garage_id = public.current_garage_id());

-- Vehicle documents
CREATE POLICY vehicle_documents_all ON public.vehicle_documents
  FOR ALL TO authenticated
  USING (garage_id = public.current_garage_id())
  WITH CHECK (garage_id = public.current_garage_id());

-- Sales
CREATE POLICY sales_all ON public.sales
  FOR ALL TO authenticated
  USING (garage_id = public.current_garage_id())
  WITH CHECK (garage_id = public.current_garage_id());

-- Invoices
CREATE POLICY invoices_all ON public.invoices
  FOR ALL TO authenticated
  USING (garage_id = public.current_garage_id())
  WITH CHECK (garage_id = public.current_garage_id());

-- Invoice items
CREATE POLICY invoice_items_all ON public.invoice_items
  FOR ALL TO authenticated
  USING (garage_id = public.current_garage_id())
  WITH CHECK (garage_id = public.current_garage_id());

-- ---------------------------------------------------------------------------
-- Storage : buckets (à créer aussi dans l’interface si besoin)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('vehicle-photos', 'vehicle-photos', false),
  ('vehicle-documents', 'vehicle-documents', false),
  ('invoices', 'invoices', false),
  ('garage-logos', 'garage-logos', false)
ON CONFLICT (id) DO NOTHING;

-- Chemin : {garage_id}/{...}
CREATE POLICY storage_vehicle_photos_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] = public.current_garage_id()::text
  );

CREATE POLICY storage_vehicle_photos_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] = public.current_garage_id()::text
  );

CREATE POLICY storage_vehicle_photos_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] = public.current_garage_id()::text
  );

CREATE POLICY storage_vehicle_photos_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] = public.current_garage_id()::text
  );

CREATE POLICY storage_vehicle_documents_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'vehicle-documents'
    AND (storage.foldername(name))[1] = public.current_garage_id()::text
  );

CREATE POLICY storage_vehicle_documents_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vehicle-documents'
    AND (storage.foldername(name))[1] = public.current_garage_id()::text
  );

CREATE POLICY storage_vehicle_documents_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'vehicle-documents'
    AND (storage.foldername(name))[1] = public.current_garage_id()::text
  );

CREATE POLICY storage_vehicle_documents_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'vehicle-documents'
    AND (storage.foldername(name))[1] = public.current_garage_id()::text
  );

CREATE POLICY storage_invoices_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = public.current_garage_id()::text
  );

CREATE POLICY storage_invoices_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = public.current_garage_id()::text
  );

CREATE POLICY storage_invoices_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = public.current_garage_id()::text
  );

CREATE POLICY storage_invoices_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = public.current_garage_id()::text
  );

CREATE POLICY storage_garage_logos_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'garage-logos'
    AND (storage.foldername(name))[1] = public.current_garage_id()::text
  );

CREATE POLICY storage_garage_logos_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'garage-logos'
    AND (storage.foldername(name))[1] = public.current_garage_id()::text
  );

CREATE POLICY storage_garage_logos_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'garage-logos'
    AND (storage.foldername(name))[1] = public.current_garage_id()::text
  );

CREATE POLICY storage_garage_logos_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'garage-logos'
    AND (storage.foldername(name))[1] = public.current_garage_id()::text
  );

-- ---------------------------------------------------------------------------
-- Données initiales optionnelles (deux garages AZ) — décommenter si besoin
-- ---------------------------------------------------------------------------
-- INSERT INTO public.garages (name, legal_name, city) VALUES
--   ('Garage 1', 'AZ SARL', 'Lausanne'),
--   ('Garage 2', 'AZ SARL', 'Genève');
