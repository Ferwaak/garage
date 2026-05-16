import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth-context";
import Link from "next/link";
import { formatChf, formatDateFr } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { deleteInvoice } from "@/app/actions";
import type { Invoice } from "@/types/database";
import { ArrowUpRight, FilePlus2, Search } from "lucide-react";

export default async function FacturesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) return null;
  const { statut, q } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("invoices")
    .select("id, invoice_number, invoice_date, due_date, status, total, customer_id")
    .eq("garage_id", ctx.garage.id)
    .order("invoice_date", { ascending: false });

  if (statut && statut !== "tous") {
    query = query.eq("status", statut);
  }
  if (q?.trim()) {
    const safe = q.trim().replace(/%/g, "").replace(/,/g, "");
    query = query.ilike("invoice_number", `%${safe}%`);
  }

  const { data: invoices } = await query;

  const statusFilters = [
    { key: "tous", label: "Toutes" },
    { key: "brouillon", label: "Brouillon" },
    { key: "envoyée", label: "Envoyée" },
    { key: "payée", label: "Payée" },
    { key: "en retard", label: "En retard" },
    { key: "annulée", label: "Annulée" },
  ];

  return (
    <div className="app-page">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="app-kicker">
            Administration
          </p>
          <h1 className="app-heading mt-2">Factures</h1>
          <p className="app-subtitle">
            Historique complet, recherche par numéro et suivi des statuts.
          </p>
        </div>
        <Link href="/factures/nouvelle" className="app-button-primary gap-2">
          <FilePlus2 className="h-4 w-4" />
          Créer une facture
        </Link>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row" action="/factures" method="get">
        <input
          type="hidden"
          name="statut"
          value={statut && statut !== "tous" ? statut : ""}
        />
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="N° de facture..."
            className="app-field min-h-[44px] pl-10"
          />
        </div>
        <button type="submit" className="app-button-primary">
          Rechercher
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => {
          const href =
            filter.key === "tous"
              ? "/factures"
              : `/factures?statut=${encodeURIComponent(filter.key)}`;
          const active =
            (filter.key === "tous" && (!statut || statut === "tous")) ||
            (filter.key !== "tous" && statut === filter.key);
          return (
            <Link
              key={filter.key}
              href={href}
              className={`app-tab ${active ? "app-tab-active" : ""}`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <div className="app-panel">
        <table className="app-table hidden md:table">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Date</th>
              <th>Statut</th>
              <th className="text-right">Total</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices?.length ? (
              (invoices as Invoice[]).map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <Link
                      href={`/factures/${invoice.id}`}
                    className="font-semibold text-neutral-950 hover:text-[var(--accent)]"
                    >
                      {invoice.invoice_number}
                    </Link>
                  </td>
                  <td>{formatDateFr(invoice.invoice_date)}</td>
                  <td>
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="text-right tabular-nums">
                    {formatChf(invoice.total)}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/factures/${invoice.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-[var(--accent)] hover:text-[var(--accent-strong)]"
                      >
                        Ouvrir
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                      <ConfirmDeleteButton
                        compact
                        label="Suppr."
                        title="Supprimer la facture"
                        description={`Supprimer définitivement la facture ${invoice.invoice_number} ?`}
                        deleteAction={deleteInvoice.bind(null, invoice.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="app-empty">
                  Aucune facture.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <ul className="divide-y divide-zinc-100 md:hidden">
          {invoices?.length ? (
            (invoices as Invoice[]).map((invoice) => (
              <li key={invoice.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/factures/${invoice.id}`}
                      className="font-semibold text-zinc-950"
                    >
                      {invoice.invoice_number}
                    </Link>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatDateFr(invoice.invoice_date)}
                    </p>
                  </div>
                  <StatusBadge status={invoice.status} className="shrink-0" />
                </div>
                <p className="mt-3 text-sm font-semibold tabular-nums text-zinc-950">
                  {formatChf(invoice.total)}
                </p>
                <div className="mt-3">
                  <ConfirmDeleteButton
                    compact
                    label="Supprimer"
                    title="Supprimer la facture"
                    description={`Supprimer définitivement la facture ${invoice.invoice_number} ?`}
                    deleteAction={deleteInvoice.bind(null, invoice.id)}
                  />
                </div>
              </li>
            ))
          ) : (
            <li className="app-empty">
              Aucune facture.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
