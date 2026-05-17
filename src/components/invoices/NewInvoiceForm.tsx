"use client";

import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/error";
import type { Customer, Garage } from "@/types/database";
import { Plus, ReceiptText, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

type Line = { description: string; quantity: number; unit_price: number };
type PriceMode = "ht" | "ttc";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function NewInvoiceForm({
  garage,
  customers,
}: {
  garage: Garage;
  customers: Customer[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const preClient = sp.get("client");

  const [customerId, setCustomerId] = useState(preClient || "");
  const [lines, setLines] = useState<Line[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);
  const [priceMode, setPriceMode] = useState<PriceMode>("ht");
  const [vatRate, setVatRate] = useState(Number(garage.default_vat_rate ?? 8.1));
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState(garage.default_invoice_note || "");
  const [paymentTerms, setPaymentTerms] = useState(
    garage.default_payment_terms || ""
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const enteredTotal = lines.reduce(
      (s, l) => s + Number(l.quantity || 0) * Number(l.unit_price || 0),
      0
    );
    const multiplier = 1 + Number(vatRate || 0) / 100;
    const subtotal =
      priceMode === "ttc"
        ? roundCurrency(enteredTotal / multiplier)
        : roundCurrency(enteredTotal);
    const total =
      priceMode === "ttc"
        ? roundCurrency(enteredTotal)
        : roundCurrency(subtotal * multiplier);
    const vatAmount = roundCurrency(total - subtotal);
    return { subtotal, vatAmount, total };
  }, [lines, priceMode, vatRate]);

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  }

  async function submit() {
    setError(null);
    if (!customerId) {
      setError("Choisissez un client.");
      return;
    }
    const cleanLines = lines.filter((l) => l.description.trim());
    if (!cleanLines.length) {
      setError("Ajoutez au moins une ligne de facture.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: num, error: rErr } = await supabase.rpc("next_invoice_number", {
      p_garage_id: garage.id,
    });
    if (rErr || !num) {
      setSaving(false);
      console.error("[invoices] next number failed", rErr);
      setError(
        formatSupabaseError("Impossible de générer le numéro de facture.", rErr)
      );
      return;
    }

    const { data: inv, error: iErr } = await supabase
      .from("invoices")
      .insert({
        garage_id: garage.id,
        customer_id: customerId,
        invoice_number: num as string,
        due_date: dueDate || null,
        status: "brouillon",
        subtotal: totals.subtotal,
        vat_rate: vatRate,
        vat_amount: totals.vatAmount,
        total: totals.total,
        amounts_include_vat: priceMode === "ttc",
        notes: notes || null,
        payment_terms: paymentTerms || null,
      })
      .select("id")
      .single();

    if (iErr || !inv) {
      setSaving(false);
      console.error("[invoices] insert failed", iErr);
      setError(formatSupabaseError("Impossible de créer la facture.", iErr));
      return;
    }

    const vatMultiplier = 1 + Number(vatRate || 0) / 100;
    const items = cleanLines.map((l) => {
      const quantity = Number(l.quantity || 0);
      const enteredUnitPrice = Number(l.unit_price || 0);
      const unitPrice =
        priceMode === "ttc"
          ? roundCurrency(enteredUnitPrice / vatMultiplier)
          : enteredUnitPrice;

      return {
        garage_id: garage.id,
        invoice_id: inv.id,
        description: l.description.trim(),
        quantity,
        unit_price: unitPrice,
        total: roundCurrency(quantity * unitPrice),
      };
    });

    const { error: itErr } = await supabase.from("invoice_items").insert(items);
    setSaving(false);
    if (itErr) {
      console.error("[invoice_items] insert failed", itErr);
      setError(
        formatSupabaseError("Facture créée mais erreur sur les lignes.", itErr)
      );
      return;
    }
    router.push(`/factures/${inv.id}`);
    router.refresh();
  }

  const field = "app-field min-h-[44px]";
  const label = "app-label";

  return (
    <div className="grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="app-panel-pad grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={label}>Client *</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className={field}
          >
            <option value="">— Sélectionner —</option>
            {customers.map((c) => {
              const name =
                c.customer_type === "entreprise" && c.company_name
                  ? c.company_name
                  : [c.first_name, c.last_name].filter(Boolean).join(" ");
              return (
                <option key={c.id} value={c.id}>
                  {name}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className={label}>Date d’échéance</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className={label}>Taux TVA (%)</label>
          <input
            type="number"
            step="0.01"
            value={vatRate}
            onChange={(e) => setVatRate(Number(e.target.value))}
            className={field}
          />
        </div>
        <div className="md:col-span-2">
          <label className={label}>Mode de saisie des prix</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPriceMode("ht")}
              className={`app-tab ${priceMode === "ht" ? "app-tab-active" : ""}`}
            >
              Prix hors taxe
            </button>
            <button
              type="button"
              onClick={() => setPriceMode("ttc")}
              className={`app-tab ${priceMode === "ttc" ? "app-tab-active" : ""}`}
            >
              Prix taxe incluse
            </button>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className={label}>Conditions de paiement</label>
          <textarea
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            rows={2}
            className={field + " min-h-[72px]"}
          />
        </div>
        <div className="md:col-span-2">
          <label className={label}>Remarques</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={field + " min-h-[72px]"}
          />
        </div>
      </section>

      <section className="app-panel-pad space-y-4">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)]">
            <ReceiptText className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-neutral-950">Lignes de facture</h2>
        </div>
        {lines.map((line, i) => (
          <div
            key={i}
            className="grid grid-cols-1 items-end gap-3 rounded-xl border border-neutral-100 bg-[#fbfcfa] p-3 md:grid-cols-12"
          >
            <div className="md:col-span-6">
              <label className={label}>Description</label>
              <input
                value={line.description}
                onChange={(e) => updateLine(i, { description: e.target.value })}
                className={field}
              />
            </div>
            <div className="md:col-span-2">
              <label className={label}>Qté</label>
              <input
                type="number"
                step="0.001"
                value={line.quantity}
                onChange={(e) =>
                  updateLine(i, { quantity: Number(e.target.value) })
                }
                className={field}
              />
            </div>
            <div className="md:col-span-3">
              <label className={label}>
                Prix unit. {priceMode === "ttc" ? "TTC" : "HT"} CHF
              </label>
              <input
                type="number"
                step="0.01"
                value={line.unit_price}
                onChange={(e) =>
                  updateLine(i, { unit_price: Number(e.target.value) })
                }
                className={field}
              />
            </div>
            <div className="flex pb-1 md:col-span-1">
              {lines.length > 1 && (
                <button
                  type="button"
                  aria-label="Retirer la ligne"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                  onClick={() => setLines((p) => p.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          className="app-button-secondary gap-2"
          onClick={() =>
            setLines((p) => [...p, { description: "", quantity: 1, unit_price: 0 }])
          }
        >
          <Plus className="h-4 w-4" />
          Ajouter une ligne
        </button>
      </section>
      </div>

      <aside className="app-panel-pad h-fit space-y-4 lg:sticky lg:top-8">
        <div>
          <p className="app-kicker">Résumé</p>
          <h2 className="mt-2 text-xl font-semibold text-neutral-950">
            Total facture
          </h2>
        </div>
        <div className="space-y-3 rounded-xl bg-[#f6f8f5] p-4 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-neutral-600">Mode</span>
            <span className="font-semibold text-neutral-950">
              {priceMode === "ttc" ? "Prix saisis TTC" : "Prix saisis HT"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-neutral-600">Sous-total HT</span>
            <span className="font-semibold tabular-nums text-neutral-950">
              {totals.subtotal.toFixed(2)} CHF
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-neutral-600">TVA</span>
            <span className="font-semibold tabular-nums text-neutral-950">
              {totals.vatAmount.toFixed(2)} CHF
            </span>
          </div>
          <div className="border-t border-neutral-200 pt-3">
            <div className="flex justify-between gap-3">
              <span className="font-semibold text-neutral-950">Total TTC</span>
              <span className="text-2xl font-semibold tabular-nums text-neutral-950">
                {totals.total.toFixed(2)} CHF
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={submit}
          className="app-button-primary min-h-[48px] w-full gap-2 px-5 disabled:opacity-50"
        >
          <ReceiptText className="h-4 w-4" />
          {saving ? "Création…" : "Créer la facture"}
        </button>
      </aside>
    </div>
  );
}
