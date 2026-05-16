import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth-context";
import { formatChf, formatDateFr } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { deleteVehicle } from "@/app/actions";
import Link from "next/link";
import type { Vehicle } from "@/types/database";
import { ArrowUpRight, CarFront, Plus } from "lucide-react";

const tabs: { key: string; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "stock", label: "En stock" },
  { key: "vendus", label: "Vendus" },
  { key: "archives", label: "Archivés" },
];

export default async function VehiculesPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) return null;
  const { vue = "tous" } = await searchParams;
  const supabase = await createClient();
  const gid = ctx.garage.id;

  let query = supabase
    .from("vehicles")
    .select("*")
    .eq("garage_id", gid)
    .order("created_at", { ascending: false });

  if (vue === "stock") {
    query = query.in("status", ["en stock", "en préparation", "réservé"]);
  } else if (vue === "vendus") {
    query = query.eq("status", "vendu");
  } else if (vue === "archives") {
    query = query.eq("status", "archivé");
  }

  const { data: vehicles, error } = await query;
  if (error) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Erreur lors du chargement des véhicules.
      </p>
    );
  }

  const rows = (vehicles ?? []) as Vehicle[];
  const activeFilter =
    vue === "stock" || vue === "vendus" || vue === "archives" ? vue : "tous";

  return (
    <div className="app-page">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="app-kicker">
            Inventaire
          </p>
          <h1 className="app-heading mt-2">Véhicules</h1>
          <p className="app-subtitle">
            Acquisitions, stock actif, véhicules vendus et historiques de vente.
          </p>
        </div>
        <Link href="/vehicules/nouveau" className="app-button-primary gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un véhicule
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = activeFilter === tab.key;
          const href =
            tab.key === "tous" ? "/vehicules" : `/vehicules?vue=${tab.key}`;
          return (
            <Link
              key={tab.key}
              href={href}
              className={`app-tab ${active ? "app-tab-active" : ""}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="app-panel">
        <div className="hidden overflow-x-auto md:block">
          <table className="app-table">
            <thead>
              <tr>
                <th>Véhicule</th>
                <th>Statut</th>
                <th>Date achat</th>
                <th className="text-right">Coût total</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="app-empty">
                    Aucun véhicule dans cette vue.
                  </td>
                </tr>
              ) : (
                rows.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                          <CarFront className="h-5 w-5" />
                        </span>
                        <div>
                          <Link
                            href={`/vehicules/${vehicle.id}`}
                            className="font-semibold text-neutral-950 hover:text-[var(--accent)]"
                          >
                            {vehicle.name}
                          </Link>
                          <p className="text-xs text-neutral-500">
                            {[vehicle.brand, vehicle.model, vehicle.year]
                              .filter(Boolean)
                              .join(" / ")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={vehicle.status} />
                    </td>
                    <td className="text-neutral-700">
                      {formatDateFr(vehicle.purchase_date)}
                    </td>
                    <td className="text-right tabular-nums">
                      {formatChf(vehicle.total_cost)}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/vehicules/${vehicle.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-[var(--accent)] hover:text-[var(--accent-strong)]"
                        >
                          Fiche
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                        <ConfirmDeleteButton
                          compact
                          label="Suppr."
                          title="Supprimer le véhicule"
                          description={`Supprimer définitivement ${vehicle.name} ? Les ventes liées à ce véhicule seront aussi supprimées.`}
                          deleteAction={deleteVehicle.bind(null, vehicle.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-zinc-100 md:hidden">
          {rows.length === 0 ? (
            <li className="app-empty">
              Aucun véhicule dans cette vue.
            </li>
          ) : (
            rows.map((vehicle) => (
              <li key={vehicle.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/vehicules/${vehicle.id}`}
                      className="font-semibold text-zinc-950"
                    >
                      {vehicle.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {[vehicle.brand, vehicle.model].filter(Boolean).join(" / ")}
                    </p>
                  </div>
                  <StatusBadge status={vehicle.status} className="shrink-0" />
                </div>
                <p className="mt-3 text-sm text-zinc-700">
                  Coût total:{" "}
                  <span className="font-semibold tabular-nums text-zinc-950">
                    {formatChf(vehicle.total_cost)}
                  </span>
                </p>
                <div className="mt-3">
                  <ConfirmDeleteButton
                    compact
                    label="Supprimer"
                    title="Supprimer le véhicule"
                    description={`Supprimer définitivement ${vehicle.name} ? Les ventes liées à ce véhicule seront aussi supprimées.`}
                    deleteAction={deleteVehicle.bind(null, vehicle.id)}
                  />
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
