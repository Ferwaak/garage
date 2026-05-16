ALTER TABLE public.garages
  ADD COLUMN IF NOT EXISTS qr_bill_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invoice_notice text;
