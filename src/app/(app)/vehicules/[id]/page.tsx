import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth-context";
import { notFound } from "next/navigation";
import Link from "next/link";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { deleteVehicle } from "@/app/actions";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { VehiclePhotoUpload } from "@/components/vehicles/VehiclePhotoUpload";
import { VehicleDocumentUpload } from "@/components/vehicles/VehicleDocumentUpload";
import { SignedStorageImage } from "@/components/media/SignedStorageImage";
import { DocumentDownloadButton } from "@/components/vehicles/DocumentDownloadButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatChf, formatDateFr } from "@/lib/format";
import type { VehicleDocument, VehiclePhoto } from "@/types/database";
import { ArrowLeft, BadgeDollarSign, CalendarDays } from "lucide-react";

export default async function VehiculeDetailPage({
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

  const { data: photos } = await supabase
    .from("vehicle_photos")
    .select("*")
    .eq("vehicle_id", id)
    .order("sort_order", { ascending: true });

  const { data: documents } = await supabase
    .from("vehicle_documents")
    .select("*")
    .eq("vehicle_id", id)
    .order("created_at", { ascending: false });

  const canSell = ["en stock", "en préparation", "réservé"].includes(
    vehicle.status
  );

  return (
    <div className="app-page-narrow">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/vehicules"
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux véhicules
        </Link>
        <div className="flex flex-wrap gap-2">
          {canSell && (
            <Link href={`/vehicules/${id}/vendre`} className="app-button-primary">
              Marquer comme vendu
            </Link>
          )}
          <ConfirmDeleteButton
            title="Supprimer le véhicule"
            description={`Supprimer définitivement ${vehicle.name} ? Les ventes liées à ce véhicule seront aussi supprimées.`}
            deleteAction={deleteVehicle.bind(null, id)}
            redirectTo="/vehicules"
          />
        </div>
      </div>

      <section className="app-panel-pad relative overflow-hidden">
        <div className="absolute right-0 top-0 h-28 w-44 bg-[radial-gradient(circle,rgba(215,163,27,0.16),transparent_70%)]" />
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="app-kicker">
              Fiche véhicule
            </p>
            <h1 className="app-heading mt-2">{vehicle.name}</h1>
            <p className="app-subtitle">
              {[vehicle.brand, vehicle.model, vehicle.year]
                .filter(Boolean)
                .join(" / ")}
            </p>
          </div>
          <StatusBadge status={vehicle.status} />
        </div>
        <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-100 bg-[#f6f8f5] p-4">
            <dt className="flex items-center gap-2 text-sm text-zinc-500">
              <BadgeDollarSign className="h-4 w-4" />
              Coût total réel
            </dt>
            <dd className="mt-2 font-semibold tabular-nums text-zinc-950">
              {formatChf(vehicle.total_cost)}
            </dd>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-[#f6f8f5] p-4">
            <dt className="flex items-center gap-2 text-sm text-zinc-500">
              <CalendarDays className="h-4 w-4" />
              Date d&apos;achat
            </dt>
            <dd className="mt-2 font-semibold text-zinc-950">
              {formatDateFr(vehicle.purchase_date)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="app-panel-pad">
        <h2 className="mb-4 text-sm font-semibold text-zinc-950">Photos</h2>
        <div className="mb-4 flex flex-wrap gap-3">
          {(photos as VehiclePhoto[] | null)?.map((photo) => (
            <div
              key={photo.id}
              className="h-32 w-44 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm"
            >
              <SignedStorageImage
                bucket="vehicle-photos"
                path={photo.file_path}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
        <VehiclePhotoUpload garageId={ctx.garage.id} vehicleId={id} />
      </section>

      <section className="app-panel-pad">
        <h2 className="mb-4 text-sm font-semibold text-zinc-950">Documents</h2>
        <ul className="mb-4 divide-y divide-zinc-100">
          {(documents as VehicleDocument[] | null)?.length ? (
            (documents as VehicleDocument[]).map((document) => (
              <li
                key={document.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-zinc-950">
                    {document.document_name}
                  </p>
                  <p className="text-xs text-zinc-500">{document.document_type}</p>
                </div>
                <DocumentDownloadButton path={document.file_path} label="Télécharger" />
              </li>
            ))
          ) : (
            <li className="py-4 text-sm text-zinc-500">Aucun document.</li>
          )}
        </ul>
        <VehicleDocumentUpload garageId={ctx.garage.id} vehicleId={id} />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-950">Fiche complète</h2>
        <VehicleForm garageId={ctx.garage.id} mode="edit" vehicle={vehicle} />
      </section>
    </div>
  );
}
