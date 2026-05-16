import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth-context";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SaleForm } from "@/components/sales/SaleForm";
import { ArrowLeft } from "lucide-react";

export default async function VendreVehiculePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) return null;
  const supabase = await createClient();
  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !vehicle) notFound();

  if (!["en stock", "en préparation", "réservé"].includes(vehicle.status)) {
    return (
      <div className="app-page-narrow">
        <section className="app-panel-pad">
          <p className="text-sm text-zinc-600">
            Ce véhicule ne peut pas être vendu depuis cet écran (statut:{" "}
            {vehicle.status}).
          </p>
          <Link
            href={`/vehicules/${id}`}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la fiche
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="app-page-narrow">
      <Link
        href={`/vehicules/${id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au véhicule
      </Link>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
          Vente
        </p>
        <h1 className="app-heading mt-2">Enregistrer une vente</h1>
        <p className="app-subtitle">
          Le client sera ajouté à votre base et le véhicule passera au statut
          vendu.
        </p>
      </div>
      <SaleForm garageId={ctx.garage.id} vehicle={vehicle} />
    </div>
  );
}
