import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth-context";
import { formatChf, formatDateFr, formatInteger } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import type { Invoice, Vehicle } from "@/types/database";
import {
  ArrowUpRight,
  BadgeCheck,
  CarFront,
  FileText,
  Plus,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: "teal" | "amber" | "rose" | "zinc";
}) {
  const tones = {
    teal: "bg-emerald-50 text-emerald-800 border-emerald-100",
    amber: "bg-amber-50 text-amber-800 border-amber-100",
    rose: "bg-rose-50 text-rose-800 border-rose-100",
    zinc: "bg-neutral-100 text-neutral-700 border-neutral-200",
  };

  return (
    <div className="app-stat">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950 tabular-nums">
            {typeof value === "number" ? formatInteger(value) : value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${tones[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function ActivityPanel({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="app-panel">
      <div className="app-section-title">
        <h2 className="text-sm font-semibold text-neutral-950">{title}</h2>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-strong)]"
        >
          Voir tout
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <ul className="divide-y divide-zinc-100">{children}</ul>
    </section>
  );
}

export default async function TableauDeBordPage() {
  const ctx = await getAuthContext();
  if (!ctx) return null;
  const supabase = await createClient();
  const gid = ctx.garage.id;

  const [
    vehiclesRes,
    stockRes,
    soldRes,
    customersRes,
    invoicesRes,
  ] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("garage_id", gid),
    supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("garage_id", gid)
      .in("status", ["en stock", "en préparation", "réservé"]),
    supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("garage_id", gid)
      .eq("status", "vendu"),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("garage_id", gid),
    supabase
      .from("invoices")
      .select("id, status, total, due_date, invoice_date")
      .eq("garage_id", gid),
  ]);

  const totalVehicles = vehiclesRes.count ?? 0;
  const stockCount = stockRes.count ?? 0;
  const soldCount = soldRes.count ?? 0;
  const customerCount = customersRes.count ?? 0;
  const invoices = (invoicesRes.data ?? []) as Pick<
    Invoice,
    "id" | "status" | "total" | "due_date" | "invoice_date"
  >[];

  const invoiceCount = invoices.length;
  const paidInvoices = invoices.filter((i) => i.status === "payée").length;
  const activeInvoices = invoices.filter((i) => i.status !== "annulée");
  const unpaidInvoices = activeInvoices.filter(
    (i) => i.status === "envoyée" || i.status === "en retard"
  ).length;
  const { data: lastVehicles } = await supabase
    .from("vehicles")
    .select("id, name, brand, model, status, created_at")
    .eq("garage_id", gid)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: lastSold } = await supabase
    .from("vehicles")
    .select("id, name, brand, model, updated_at")
    .eq("garage_id", gid)
    .eq("status", "vendu")
    .order("updated_at", { ascending: false })
    .limit(5);

  const { data: lastInvoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, total, status, invoice_date")
    .eq("garage_id", gid)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="app-page">
      <div className="app-panel-pad relative overflow-hidden">
        <div className="absolute right-0 top-0 h-32 w-56 bg-[radial-gradient(circle,rgba(215,163,27,0.18),transparent_65%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="app-kicker">
            Pilotage concession
          </p>
          <h1 className="app-heading mt-2">Tableau de bord</h1>
          <p className="app-subtitle">
            Vue d&apos;ensemble garage, stock actif, factures et rentabilité
            véhicule en CHF.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/vehicules/nouveau" className="app-button-primary gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un véhicule
          </Link>
          <Link href="/factures/nouvelle" className="app-button-secondary gap-2">
            <FileText className="h-4 w-4" />
            Créer une facture
          </Link>
        </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Véhicules achetés"
          value={totalVehicles}
          icon={CarFront}
          tone="teal"
        />
        <MetricCard
          label="Stock actif"
          value={stockCount}
          icon={BadgeCheck}
          tone="teal"
        />
        <MetricCard
          label="Véhicules vendus"
          value={soldCount}
          icon={WalletCards}
          tone="zinc"
        />
        <MetricCard
          label="Clients"
          value={customerCount}
          icon={Users}
          tone="zinc"
        />
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="app-panel-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Factures
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-950">
            {formatInteger(invoiceCount)}
          </p>
        </div>
        <div className="app-panel-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Payées
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-700">
            {formatInteger(paidInvoices)}
          </p>
        </div>
        <div className="app-panel-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Impayées / envoyées
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-amber-700">
            {formatInteger(unpaidInvoices)}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <ActivityPanel title="Derniers véhicules ajoutés" href="/vehicules">
          {(lastVehicles as Vehicle[] | null)?.length ? (
            (lastVehicles as Vehicle[]).map((v) => (
              <li key={v.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/vehicules/${v.id}`}
                      className="font-medium text-zinc-950 hover:text-teal-700"
                    >
                      {v.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {[v.brand, v.model].filter(Boolean).join(" / ")} /{" "}
                      {formatDateFr(v.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={v.status} className="shrink-0" />
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-8 text-sm text-zinc-500">
              Aucun véhicule pour le moment.
            </li>
          )}
        </ActivityPanel>

        <ActivityPanel title="Dernières ventes" href="/vehicules-vendus">
          {lastSold?.length ? (
            lastSold.map((v) => (
              <li key={v.id} className="px-4 py-3">
                <Link
                  href={`/vehicules/${v.id}`}
                  className="font-medium text-zinc-950 hover:text-teal-700"
                >
                  {v.name}
                </Link>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {[v.brand, v.model].filter(Boolean).join(" / ")} /{" "}
                  {formatDateFr(v.updated_at)}
                </p>
              </li>
            ))
          ) : (
            <li className="px-4 py-8 text-sm text-zinc-500">
              Aucune vente enregistrée.
            </li>
          )}
        </ActivityPanel>

        <ActivityPanel title="Dernières factures" href="/factures">
          {lastInvoices?.length ? (
            lastInvoices.map((inv) => (
              <li key={inv.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/factures/${inv.id}`}
                      className="font-medium text-zinc-950 hover:text-teal-700"
                    >
                      {inv.invoice_number}
                    </Link>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {formatChf(inv.total)} / {formatDateFr(inv.invoice_date)}
                    </p>
                  </div>
                  <StatusBadge status={inv.status} className="shrink-0" />
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-8 text-sm text-zinc-500">Aucune facture.</li>
          )}
        </ActivityPanel>
      </div>
    </div>
  );
}
