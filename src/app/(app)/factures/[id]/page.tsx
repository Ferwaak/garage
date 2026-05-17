import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth-context";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatChf, formatDateFr } from "@/lib/format";
import { InvoicePdfActions } from "@/components/invoices/InvoicePdfActions";
import { InvoiceStatusActions } from "@/components/invoices/InvoiceStatusActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { deleteInvoice } from "@/app/actions";
import type { Customer, Invoice, InvoiceItem } from "@/types/database";
import { ArrowLeft } from "lucide-react";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function itemDisplayAmounts(invoice: Invoice, item: InvoiceItem) {
  if (!invoice.amounts_include_vat) {
    return {
      unitPrice: Number(item.unit_price),
      total: Number(item.total),
    };
  }

  const multiplier = 1 + Number(invoice.vat_rate ?? 0) / 100;
  return {
    unitPrice: roundCurrency(Number(item.unit_price) * multiplier),
    total: roundCurrency(Number(item.total) * multiplier),
  };
}

export default async function FactureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) return null;
  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !invoice) notFound();

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("created_at", { ascending: true });

  let customer: Customer | null = null;
  if (invoice.customer_id) {
    const { data: c } = await supabase
      .from("customers")
      .select("*")
      .eq("id", invoice.customer_id)
      .maybeSingle();
    customer = c as Customer | null;
  }

  const inv = invoice as Invoice;
  const its = (items ?? []) as InvoiceItem[];
  const paymentTerms = inv.payment_terms || ctx.garage.default_payment_terms;

  return (
    <div className="app-page-narrow">
      <Link
        href="/factures"
        className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux factures
      </Link>

      <section className="app-panel-pad relative overflow-hidden">
        <div className="absolute right-0 top-0 h-28 w-44 bg-[radial-gradient(circle,rgba(14,111,92,0.12),transparent_70%)]" />
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="app-kicker">
              Facture
            </p>
            <h1 className="app-heading mt-2">{inv.invoice_number}</h1>
            <p className="app-subtitle">
              {formatDateFr(inv.invoice_date)}
              {inv.due_date ? ` / Échéance ${formatDateFr(inv.due_date)}` : ""}
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-3xl font-semibold tabular-nums text-neutral-950">
              {formatChf(inv.total)}
            </p>
            <StatusBadge status={inv.status} className="mt-2" />
            <div className="mt-3 flex justify-start md:justify-end">
              <ConfirmDeleteButton
                compact
                label="Supprimer"
                title="Supprimer la facture"
                description={`Supprimer définitivement la facture ${inv.invoice_number} ?`}
                deleteAction={deleteInvoice.bind(null, id)}
                redirectTo="/factures"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="app-panel-pad space-y-4">
        <h2 className="text-sm font-semibold text-zinc-950">Statut</h2>
        <InvoiceStatusActions invoiceId={id} current={inv.status} />
      </section>

      <section className="app-panel-pad space-y-4">
        <h2 className="text-sm font-semibold text-zinc-950">PDF</h2>
        <InvoicePdfActions
          garage={ctx.garage}
          invoice={inv}
          customer={customer}
          items={its}
        />
      </section>

      <section className="app-panel-pad">
        <h2 className="mb-3 text-sm font-semibold text-zinc-950">Client</h2>
        {customer ? (
          <Link
            href={`/clients/${customer.id}`}
            className="font-medium text-teal-700 hover:text-teal-900"
          >
            {customer.customer_type === "entreprise" && customer.company_name
              ? customer.company_name
              : [customer.first_name, customer.last_name].filter(Boolean).join(" ")}
          </Link>
        ) : (
          <p className="text-sm text-zinc-500">-</p>
        )}
      </section>

      <section className="app-panel overflow-x-auto p-4 md:p-6">
        <h2 className="mb-3 text-sm font-semibold text-neutral-950">Lignes</h2>
        <table className="app-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qté</th>
              <th className="text-right">
                Prix unit. {inv.amounts_include_vat ? "TTC" : "HT"}
              </th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {its.map((item) => {
              const display = itemDisplayAmounts(inv, item);

              return (
                <tr key={item.id}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td className="text-right tabular-nums">
                    {formatChf(display.unitPrice)}
                  </td>
                  <td className="text-right tabular-nums">
                    {formatChf(display.total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="ml-auto mt-5 max-w-sm space-y-2 rounded-xl bg-[#f6f8f5] p-4 text-right text-sm">
          <p>{inv.amounts_include_vat ? "Prix saisis TTC" : "Prix saisis HT"}</p>
          <p>Sous-total HT: {formatChf(inv.subtotal)}</p>
          <p>
            TVA ({inv.vat_rate ?? 0} %): {formatChf(inv.vat_amount ?? 0)}
          </p>
          <p className="border-t border-neutral-200 pt-2 text-lg font-semibold text-neutral-950">
            Total TTC: {formatChf(inv.total)}
          </p>
        </div>
      </section>

      {(paymentTerms || inv.notes) && (
        <section className="app-panel-pad space-y-2 text-sm">
          {paymentTerms && (
            <p>
              <span className="text-zinc-500">Conditions: </span>
              {paymentTerms}
            </p>
          )}
          {inv.notes && (
            <p>
              <span className="text-zinc-500">Remarques: </span>
              {inv.notes}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
