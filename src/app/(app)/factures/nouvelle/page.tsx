import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth-context";
import { NewInvoiceForm } from "@/components/invoices/NewInvoiceForm";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

export default async function NouvelleFacturePage() {
  const ctx = await getAuthContext();
  if (!ctx) return null;
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .eq("garage_id", ctx.garage.id)
    .order("created_at", { ascending: false });

  return (
    <div className="app-page-narrow">
      <Link
        href="/factures"
        className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux factures
      </Link>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
          Administration
        </p>
        <h1 className="app-heading mt-2">Nouvelle facture</h1>
        <p className="app-subtitle">
          Brouillon avec numéro attribué automatiquement à l&apos;enregistrement.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-zinc-500">Chargement...</p>}>
        <NewInvoiceForm garage={ctx.garage} customers={customers ?? []} />
      </Suspense>
    </div>
  );
}
