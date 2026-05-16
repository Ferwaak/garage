-- Supabase Data API access for authenticated users.
-- RLS policies still decide which rows each signed-in user can read or modify.

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, UPDATE ON TABLE
  public.garages,
  public.profiles
TO authenticated;

GRANT SELECT ON TABLE
  public.garage_invoice_counters
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.customers,
  public.vehicles,
  public.vehicle_photos,
  public.vehicle_documents,
  public.sales,
  public.invoices,
  public.invoice_items
TO authenticated;

GRANT EXECUTE ON FUNCTION public.current_garage_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_invoice_number(uuid) TO authenticated;
