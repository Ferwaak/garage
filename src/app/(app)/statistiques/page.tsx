import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth-context";
import { formatChf } from "@/lib/format";
import { AlertTriangle, BarChart3, TrendingUp } from "lucide-react";

export default async function StatistiquesPage() {
  const ctx = await getAuthContext();
  if (!ctx) return null;
  const supabase = await createClient();
  const gid = ctx.garage.id;

  const { data: sales } = await supabase
    .from("sales")
    .select("id, sale_price, profit, sale_date")
    .eq("garage_id", gid);

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, purchase_price, total_cost, status, created_at, name")
    .eq("garage_id", gid);

  const { data: unpaid } = await supabase
    .from("invoices")
    .select("id, total, status, due_date")
    .eq("garage_id", gid)
    .in("status", ["envoyée", "en retard"]);

  const sList = sales ?? [];
  const ca = sList.reduce((a, r) => a + Number(r.sale_price), 0);
  const profit = sList.reduce((a, r) => a + Number(r.profit ?? 0), 0);
  const vList = vehicles ?? [];
  const bought = vList.length;
  const sold = vList.filter((v) => v.status === "vendu").length;
  const avgBuy =
    vList.length > 0
      ? vList.reduce((a, v) => a + Number(v.total_cost ?? v.purchase_price ?? 0), 0) /
        vList.length
      : 0;
  const avgSell =
    sold > 0
      ? sList.reduce((a, r) => a + Number(r.sale_price), 0) / Math.max(sold, 1)
      : 0;

  const byMonth = new Map<string, { ca: number; profit: number }>();
  for (const row of sList) {
    const month = row.sale_date?.slice(0, 7) ?? "";
    if (!month) continue;
    const cur = byMonth.get(month) ?? { ca: 0, profit: 0 };
    cur.ca += Number(row.sale_price);
    cur.profit += Number(row.profit ?? 0);
    byMonth.set(month, cur);
  }
  const months = [...byMonth.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12);

  const stockOld = vList
    .filter((v) => ["en stock", "en préparation", "réservé"].includes(v.status))
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
    .slice(0, 5);

  const profitable = [...sList]
    .sort((a, b) => Number(b.profit ?? 0) - Number(a.profit ?? 0))
    .slice(0, 5);

  const summaryRows = [
    ["Chiffre d'affaires", formatChf(ca)],
    ["Bénéfice total estimé", formatChf(profit)],
    ["Véhicules achetés", String(bought)],
    ["Véhicules vendus", String(sold)],
    ["Prix d'achat moyen", formatChf(avgBuy)],
    ["Prix de vente moyen", formatChf(avgSell)],
  ];

  return (
    <div className="app-page-narrow">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
          Analyse
        </p>
        <h1 className="app-heading mt-2">Statistiques</h1>
        <p className="app-subtitle">
          Indicateurs rapides pour suivre la performance commerciale.
        </p>
      </div>

      <section className="app-panel-pad">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
            <BarChart3 className="h-5 w-5" />
          </span>
          <h2 className="text-sm font-semibold text-zinc-950">Synthèse</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          {summaryRows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2 text-sm">
              <span className="text-zinc-600">{label}</span>
              <span className="text-right font-semibold tabular-nums text-zinc-950">
                {value}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="app-panel-pad">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <h2 className="text-sm font-semibold text-zinc-950">
            Factures impayées / en suivi
          </h2>
        </div>
        {unpaid?.length ? (
          <ul className="divide-y divide-zinc-100 text-sm">
            {unpaid.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-2">
                <span className="text-zinc-600">{item.status}</span>
                <span className="font-semibold tabular-nums text-zinc-950">
                  {formatChf(item.total)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">
            Aucune facture en attente dans ces statuts.
          </p>
        )}
      </section>

      <section className="app-panel-pad">
        <h2 className="mb-4 text-sm font-semibold text-zinc-950">
          CA et bénéfice par mois
        </h2>
        {months.length ? (
          <div className="space-y-2 text-sm">
            {months.map(([month, value]) => (
              <div
                key={month}
                className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3"
              >
                <span className="text-zinc-600">{month}</span>
                <div>
                  <div className="flex justify-between gap-3 text-xs text-zinc-500">
                    <span>{formatChf(value.ca)}</span>
                    <span>Bénéf. {formatChf(value.profit)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-zinc-100">
                    <div
                      className="h-2 rounded-full bg-teal-600"
                      style={{
                        width: `${Math.min(100, Math.max(8, (value.ca / Math.max(ca, 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Pas encore de données mensuelles.</p>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="app-panel-pad">
          <h2 className="mb-4 text-sm font-semibold text-zinc-950">
            Stock depuis longtemps
          </h2>
          <ul className="divide-y divide-zinc-100 text-sm">
            {stockOld.length ? (
              stockOld.map((vehicle) => (
                <li key={vehicle.id} className="flex justify-between gap-3 py-2">
                  <span className="min-w-0 truncate text-zinc-800">
                    {vehicle.name}
                  </span>
                  <span className="shrink-0 text-zinc-500">
                    {vehicle.created_at?.slice(0, 10)}
                  </span>
                </li>
              ))
            ) : (
              <li className="py-2 text-zinc-500">Aucun véhicule à signaler.</li>
            )}
          </ul>
        </section>

        <section className="app-panel-pad">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <TrendingUp className="h-5 w-5" />
            </span>
            <h2 className="text-sm font-semibold text-zinc-950">
              Ventes les plus rentables
            </h2>
          </div>
          <ul className="divide-y divide-zinc-100 text-sm">
            {profitable.length ? (
              profitable.map((sale) => (
                <li key={sale.id} className="flex justify-between gap-3 py-2">
                  <span className="text-zinc-600">{sale.sale_date}</span>
                  <span className="font-semibold tabular-nums text-zinc-950">
                    {formatChf(sale.profit ?? 0)}
                  </span>
                </li>
              ))
            ) : (
              <li className="py-2 text-zinc-500">Aucune vente enregistrée.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
