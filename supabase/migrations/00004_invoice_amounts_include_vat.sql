ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS amounts_include_vat boolean NOT NULL DEFAULT false;
