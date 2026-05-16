import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth-context";
import { deleteCustomer } from "@/app/actions";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatChf, formatDateFr } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ArrowLeft, FilePlus2 } from "lucide-react";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) return null;
  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!customer) notFound();

  const { data: sales } = await supabase
    .from("sales")
    .select("id, sale_date, sale_price, vehicle_id")
    .eq("customer_id", id)
    .eq("garage_id", ctx.garage.id);

  const vehicleIds = [
    ...new Set((sales ?? []).map((sale) => sale.vehicle_id).filter(Boolean)),
  ];
  const { data: vehRows } = vehicleIds.length
    ? await supabase.from("vehicles").select("id, name").in("id", vehicleIds)
    : { data: [] as { id: string; name: string }[] };
  const vehMap = new Map((vehRows ?? []).map((vehicle) => [vehicle.id, vehicle.name]));

  type SaleRow = {
    id: string;
    sale_date: string;
    sale_price: number;
    vehicle_id: string;
  };
  const saleList = (sales ?? []) as SaleRow[];

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, total, status, invoice_date")
    .eq("customer_id", id)
    .eq("garage_id", ctx.garage.id)
    .order("invoice_date", { ascending: false });

  const name =
    customer.customer_type === "entreprise" && customer.company_name
      ? customer.company_name
      : [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
        "Client sans nom";

  return (
    <div className="app-page-narrow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux clients
        </Link>
        <ConfirmDeleteButton
          title="Supprimer le client"
          description={`Supprimer définitivement ${name} ? Les ventes liées à ce client seront aussi supprimées.`}
          deleteAction={deleteCustomer.bind(null, id)}
          redirectTo="/clients"
        />
      </div>

      <section className="app-panel-pad">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
          Fiche client
        </p>
        <h1 className="app-heading mt-2">{name}</h1>
        <p className="app-subtitle capitalize">{customer.customer_type}</p>
      </section>

      <section className="app-panel-pad space-y-2 text-sm">
        <h2 className="mb-2 text-sm font-semibold text-zinc-950">Coordonnées</h2>
        <p>{customer.address}</p>
        <p>
          {customer.postal_code} {customer.city}
          {customer.canton ? ` / ${customer.canton}` : ""}
        </p>
        <p>{customer.country}</p>
        <p>Tél.: {customer.phone || "-"}</p>
        <p>E-mail: {customer.email || "-"}</p>
        {customer.notes && (
          <p className="border-t border-zinc-100 pt-2 text-zinc-600">
            Remarques: {customer.notes}
          </p>
        )}
      </section>

      <section className="app-panel-pad">
        <h2 className="mb-3 text-sm font-semibold text-zinc-950">
          Véhicules achetés
        </h2>
        <ul className="divide-y divide-zinc-100">
          {saleList.length ? (
            saleList.map((sale) => (
              <li key={sale.id} className="flex justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate text-zinc-800">
                  {vehMap.get(sale.vehicle_id) ?? "-"}
                </span>
                <span className="shrink-0 text-zinc-500">
                  {formatDateFr(sale.sale_date)} / {formatChf(sale.sale_price)}
                </span>
              </li>
            ))
          ) : (
            <li className="py-4 text-sm text-zinc-500">Aucune vente liée.</li>
          )}
        </ul>
      </section>

      <section className="app-panel-pad">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-950">Factures</h2>
          <Link href={`/factures/nouvelle?client=${id}`} className="app-button-secondary gap-2">
            <FilePlus2 className="h-4 w-4" />
            Créer
          </Link>
        </div>
        <ul className="divide-y divide-zinc-100">
          {invoices?.length ? (
            invoices.map((invoice) => (
              <li
                key={invoice.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/factures/${invoice.id}`}
                    className="font-semibold text-teal-700 hover:text-teal-900"
                  >
                    {invoice.invoice_number}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {formatDateFr(invoice.invoice_date)} / {formatChf(invoice.total)}
                  </p>
                </div>
                <StatusBadge status={invoice.status} />
              </li>
            ))
          ) : (
            <li className="py-4 text-sm text-zinc-500">Aucune facture.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
