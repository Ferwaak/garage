import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth-context";
import { deleteCustomer } from "@/app/actions";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import Link from "next/link";
import { ArrowUpRight, Building2, Plus, Search, UserRound } from "lucide-react";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) return null;
  const { q } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("customers")
    .select("*")
    .eq("garage_id", ctx.garage.id)
    .order("created_at", { ascending: false });

  if (q?.trim()) {
    const safe = q.trim().replace(/%/g, "").replace(/,/g, "");
    const pattern = `%${safe}%`;
    query = query.or(
      `first_name.ilike.${pattern},last_name.ilike.${pattern},company_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`
    );
  }

  const { data: customers } = await query;

  return (
    <div className="app-page">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="app-kicker">
            Relation client
          </p>
          <h1 className="app-heading mt-2">Clients</h1>
          <p className="app-subtitle">
            Particuliers, entreprises, coordonnées et anciens acheteurs.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link href="/clients/nouveau" className="app-button-primary gap-2">
            <Plus className="h-4 w-4" />
            Créer un client
          </Link>
          <form action="/clients" method="get" className="flex w-full gap-2 sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Rechercher..."
                className="app-field min-h-[44px] pl-10"
              />
            </div>
            <button type="submit" className="app-button-secondary">
              Rechercher
            </button>
          </form>
        </div>
      </div>

      <div className="app-panel divide-y divide-zinc-100">
        {customers?.length ? (
          customers.map((customer) => {
            const name =
              customer.customer_type === "entreprise" && customer.company_name
                ? customer.company_name
                : [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
                  "Sans nom";
            const Icon =
              customer.customer_type === "entreprise" ? Building2 : UserRound;
            return (
              <div
                key={customer.id}
                className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-[#fbfcfa] md:px-5"
              >
                <Link
                  href={`/clients/${customer.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-neutral-950">{name}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {[customer.city, customer.postal_code]
                        .filter(Boolean)
                        .join(" ")}
                      {customer.email || customer.phone
                        ? ` / ${customer.email || customer.phone}`
                        : " / contact non renseigné"}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-400" />
                </Link>
                <ConfirmDeleteButton
                  compact
                  label="Suppr."
                  title="Supprimer le client"
                  description={`Supprimer définitivement ${name} ? Les ventes liées à ce client seront aussi supprimées.`}
                  deleteAction={deleteCustomer.bind(null, customer.id)}
                />
              </div>
            );
          })
        ) : (
          <p className="app-empty">
            Aucun client trouvé.
          </p>
        )}
      </div>
    </div>
  );
}
