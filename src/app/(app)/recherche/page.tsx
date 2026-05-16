import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth-context";
import Link from "next/link";
import { formatChf, formatDateFr } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ArrowUpRight, CarFront, FileText, Search, UserRound } from "lucide-react";

function SearchForm({ term }: { term?: string }) {
  return (
    <form action="/recherche" method="get" className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          name="q"
          defaultValue={term}
          placeholder="Marque, n° de châssis, client, n° de facture..."
          className="app-field min-h-[48px] pl-10 text-base"
        />
      </div>
      <button type="submit" className="app-button-primary min-h-[48px]">
        Rechercher
      </button>
    </form>
  );
}

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) return null;
  const { q } = await searchParams;
  const term = q?.trim();
  const supabase = await createClient();
  const gid = ctx.garage.id;

  if (!term) {
    return (
      <div className="app-page-narrow">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Recherche globale
          </p>
          <h1 className="app-heading mt-2">Recherche</h1>
          <p className="app-subtitle">
            Retrouvez rapidement un véhicule, un client ou une facture.
          </p>
        </div>
        <SearchForm />
      </div>
    );
  }

  const pattern = `%${term.replace(/%/g, "")}%`;

  const [vehRes, custRes, invRes] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, name, brand, model, vin, status")
      .eq("garage_id", gid)
      .or(
        `name.ilike.${pattern},brand.ilike.${pattern},model.ilike.${pattern},vin.ilike.${pattern},matricule.ilike.${pattern}`
      )
      .limit(25),
    supabase
      .from("customers")
      .select("id, first_name, last_name, company_name, email, phone")
      .eq("garage_id", gid)
      .or(
        `first_name.ilike.${pattern},last_name.ilike.${pattern},company_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`
      )
      .limit(25),
    supabase
      .from("invoices")
      .select("id, invoice_number, total, status, invoice_date")
      .eq("garage_id", gid)
      .ilike("invoice_number", pattern)
      .limit(25),
  ]);

  return (
    <div className="app-page-narrow">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
          Recherche globale
        </p>
        <h1 className="app-heading mt-2">Recherche</h1>
        <p className="app-subtitle">Résultats pour {term}.</p>
      </div>

      <SearchForm term={term} />

      <section className="app-panel">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-950">Véhicules</h2>
        </div>
        <ul className="divide-y divide-zinc-100">
          {vehRes.data?.length ? (
            vehRes.data.map((vehicle) => (
              <li key={vehicle.id}>
                <Link
                  href={`/vehicules/${vehicle.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-zinc-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                      <CarFront className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-950">
                        {vehicle.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {[vehicle.brand, vehicle.model].filter(Boolean).join(" / ")}
                        {vehicle.vin ? ` / ${vehicle.vin}` : ""}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={vehicle.status} className="shrink-0" />
                </Link>
              </li>
            ))
          ) : (
            <li className="px-4 py-6 text-sm text-zinc-500">Aucun résultat.</li>
          )}
        </ul>
      </section>

      <section className="app-panel">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-950">Clients</h2>
        </div>
        <ul className="divide-y divide-zinc-100">
          {custRes.data?.length ? (
            custRes.data.map((customer) => (
              <li key={customer.id}>
                <Link
                  href={`/clients/${customer.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-zinc-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                      <UserRound className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-950">
                        {[customer.first_name, customer.last_name]
                          .filter(Boolean)
                          .join(" ") || customer.company_name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {customer.email || customer.phone || "Contact non renseigné"}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-400" />
                </Link>
              </li>
            ))
          ) : (
            <li className="px-4 py-6 text-sm text-zinc-500">Aucun résultat.</li>
          )}
        </ul>
      </section>

      <section className="app-panel">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-950">Factures</h2>
        </div>
        <ul className="divide-y divide-zinc-100">
          {invRes.data?.length ? (
            invRes.data.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/factures/${invoice.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-zinc-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-950">
                        {invoice.invoice_number}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {formatDateFr(invoice.invoice_date)} /{" "}
                        {formatChf(invoice.total)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={invoice.status} className="shrink-0" />
                </Link>
              </li>
            ))
          ) : (
            <li className="px-4 py-6 text-sm text-zinc-500">Aucun résultat.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
