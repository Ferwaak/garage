import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth-context";
import { deleteSale } from "@/app/actions";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { formatChf, formatDateFr } from "@/lib/format";
import Link from "next/link";
import { ArrowUpRight, BadgeDollarSign, CarFront } from "lucide-react";

export default async function VehiculesVendusPage() {
  const ctx = await getAuthContext();
  if (!ctx) return null;
  const supabase = await createClient();
  const { data: sales } = await supabase
    .from("sales")
    .select(
      `
      id,
      sale_date,
      sale_price,
      profit,
      profit_percentage,
      vehicle:vehicles (id, name, brand, model),
      customer:customers (first_name, last_name, company_name)
    `
    )
    .eq("garage_id", ctx.garage.id)
    .order("sale_date", { ascending: false });

  type Row = {
    id: string;
    sale_date: string;
    sale_price: number;
    profit: number | null;
    profit_percentage: number | null;
    vehicle: { id: string; name: string; brand: string | null; model: string | null } | null;
    customer: {
      first_name: string | null;
      last_name: string | null;
      company_name: string | null;
    } | null;
  };

  const rows = (sales ?? []) as unknown as Row[];

  return (
    <div className="app-page">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
          Historique ventes
        </p>
        <h1 className="app-heading mt-2">Véhicules vendus</h1>
        <p className="app-subtitle">
          Ventes finalisées, clients associés et bénéfices estimés.
        </p>
      </div>

      <div className="app-panel">
        <div className="hidden overflow-x-auto md:block">
          <table className="app-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Véhicule</th>
                <th>Client</th>
                <th className="text-right">Prix vente</th>
                <th className="text-right">Bénéfice</th>
                <th className="text-right">Marge</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-500">
                    Aucune vente enregistrée.
                  </td>
                </tr>
              ) : (
                rows.map((sale) => {
                  const clientName = sale.customer
                    ? [sale.customer.first_name, sale.customer.last_name]
                        .filter(Boolean)
                        .join(" ") || sale.customer.company_name
                    : "-";
                  return (
                    <tr key={sale.id}>
                      <td className="whitespace-nowrap">
                        {formatDateFr(sale.sale_date)}
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                            <CarFront className="h-5 w-5" />
                          </span>
                          {sale.vehicle ? (
                            <div>
                              <Link
                                href={`/vehicules/${sale.vehicle.id}`}
                                className="font-semibold text-zinc-950 hover:text-teal-700"
                              >
                                {sale.vehicle.name}
                              </Link>
                              <p className="text-xs text-zinc-500">
                                {[sale.vehicle.brand, sale.vehicle.model]
                                  .filter(Boolean)
                                  .join(" / ")}
                              </p>
                            </div>
                          ) : (
                            <span>-</span>
                          )}
                        </div>
                      </td>
                      <td className="text-zinc-700">{clientName}</td>
                      <td className="text-right tabular-nums">
                        {formatChf(sale.sale_price)}
                      </td>
                      <td className="text-right tabular-nums">
                        {formatChf(sale.profit)}
                      </td>
                      <td className="text-right tabular-nums">
                        {sale.profit_percentage != null
                          ? `${Number(sale.profit_percentage).toFixed(1)} %`
                          : "-"}
                      </td>
                      <td className="text-right">
                        <ConfirmDeleteButton
                          compact
                          label="Suppr."
                          title="Supprimer le véhicule vendu"
                          description={`Supprimer cette vente${sale.vehicle?.name ? ` pour ${sale.vehicle.name}` : ""} ? Le véhicule repassera en stock.`}
                          deleteAction={deleteSale.bind(null, sale.id)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <ul className="divide-y divide-zinc-100 md:hidden">
          {rows.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-zinc-500">
              Aucune vente.
            </li>
          ) : (
            rows.map((sale) => (
              <li key={sale.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-950">
                      {sale.vehicle?.name ?? "Véhicule"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatDateFr(sale.sale_date)}
                    </p>
                  </div>
                  {sale.vehicle && (
                    <Link
                      href={`/vehicules/${sale.vehicle.id}`}
                      className="text-teal-700"
                      aria-label="Ouvrir le véhicule"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Vente</p>
                    <p className="font-semibold tabular-nums text-zinc-950">
                      {formatChf(sale.sale_price)}
                    </p>
                  </div>
                  <div className="rounded-md bg-emerald-50 p-3 text-emerald-900">
                    <p className="flex items-center gap-1 text-xs">
                      <BadgeDollarSign className="h-3.5 w-3.5" />
                      Bénéfice
                    </p>
                    <p className="font-semibold tabular-nums">
                      {formatChf(sale.profit)}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <ConfirmDeleteButton
                    compact
                    label="Supprimer la vente"
                    title="Supprimer le véhicule vendu"
                    description={`Supprimer cette vente${sale.vehicle?.name ? ` pour ${sale.vehicle.name}` : ""} ? Le véhicule repassera en stock.`}
                    deleteAction={deleteSale.bind(null, sale.id)}
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
