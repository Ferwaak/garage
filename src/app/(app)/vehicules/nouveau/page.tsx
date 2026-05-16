import { getAuthContext } from "@/lib/auth-context";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NouveauVehiculePage() {
  const ctx = await getAuthContext();
  if (!ctx) return null;

  return (
    <div className="app-page-narrow">
      <Link
        href="/vehicules"
        className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux véhicules
      </Link>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
          Inventaire
        </p>
        <h1 className="app-heading mt-2">Ajouter un véhicule</h1>
        <p className="app-subtitle">
          Le véhicule sera enregistré avec le statut en stock.
        </p>
      </div>
      <VehicleForm garageId={ctx.garage.id} mode="create" />
    </div>
  );
}
