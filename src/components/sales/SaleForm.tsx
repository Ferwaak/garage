"use client";

import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/error";
import type { Vehicle } from "@/types/database";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatChf } from "@/lib/format";

function priceDefault(value: number | string | null | undefined) {
  if (value === null || value === undefined || Number(value) === 0) return "";
  return Number(value);
}

export function SaleForm({
  garageId,
  vehicle,
}: {
  garageId: string;
  vehicle: Vehicle;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totalCost = Number(vehicle.total_cost ?? 0);
  const purchasePrice = Number(vehicle.purchase_price ?? 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const salePrice = Number(fd.get("sale_price"));
    const saleDate = String(fd.get("sale_date"));
    if (!saleDate || Number.isNaN(salePrice)) {
      setError("Date de vente et prix de vente obligatoires.");
      return;
    }

    const customer = {
      garage_id: garageId,
      customer_type: "particulier" as const,
      first_name: String(fd.get("buyer_first_name") || "").trim() || null,
      last_name: String(fd.get("buyer_last_name") || "").trim() || null,
      address: String(fd.get("buyer_address") || "").trim() || null,
      postal_code: String(fd.get("buyer_postal_code") || "").trim() || null,
      city: String(fd.get("buyer_city") || "").trim() || null,
      canton: String(fd.get("buyer_canton") || "").trim() || null,
      country: "Suisse",
      phone: String(fd.get("buyer_phone") || "").trim() || null,
      email: String(fd.get("buyer_email") || "").trim() || null,
    };

    if (!customer.first_name || !customer.last_name) {
      setError("Prénom et nom de l’acheteur sont obligatoires.");
      return;
    }

    const profit = salePrice - totalCost;
    const profitPercentage =
      totalCost > 0 ? Math.round((profit / totalCost) * 10000) / 100 : null;

    setSaving(true);
    const supabase = createClient();

    const { data: cust, error: cErr } = await supabase
      .from("customers")
      .insert(customer)
      .select("id")
      .single();
    if (cErr || !cust) {
      setSaving(false);
      console.error("[sales] customer insert failed", cErr);
      setError(formatSupabaseError("Impossible d'enregistrer le client.", cErr));
      return;
    }

    const { data: sale, error: sErr } = await supabase
      .from("sales")
      .insert({
        garage_id: garageId,
        vehicle_id: vehicle.id,
        customer_id: cust.id,
        sale_date: saleDate,
        sale_price: salePrice,
        purchase_price: purchasePrice,
        total_cost: totalCost,
        profit,
        profit_percentage: profitPercentage,
        payment_method: String(fd.get("payment_method") || "") || null,
        payment_status: (fd.get("payment_status") as string) || "impayé",
        warranty: String(fd.get("warranty") || "").trim() || null,
        notes: null,
      })
      .select("id")
      .single();

    if (sErr || !sale) {
      setSaving(false);
      console.error("[sales] insert failed", sErr);
      setError(formatSupabaseError("Impossible d'enregistrer la vente.", sErr));
      return;
    }

    const { error: vErr } = await supabase
      .from("vehicles")
      .update({ status: "vendu" })
      .eq("id", vehicle.id);

    if (vErr) {
      setSaving(false);
      console.error("[sales] vehicle update failed", vErr);
      setError(
        formatSupabaseError(
          "Vente enregistrée mais mise à jour du véhicule échouée.",
          vErr
        )
      );
      return;
    }

    setSaving(false);
    router.push(`/vehicules-vendus`);
    router.refresh();
  }

  const field = "app-field min-h-[44px]";
  const label = "app-label";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <section className="rounded-lg border border-teal-100 bg-teal-50 p-4 text-sm space-y-1">
        <p>
          <span className="text-zinc-600">Véhicule : </span>
          <span className="font-medium">{vehicle.name}</span>
        </p>
        <p>
          <span className="text-zinc-600">Coût total d’acquisition : </span>
          <span className="font-medium tabular-nums">{formatChf(totalCost)}</span>
        </p>
        <p className="text-xs text-zinc-500">
          Marge = prix de vente moins coût total d’acquisition, calculée à l’enregistrement.
        </p>
      </section>

      <section className="app-panel-pad space-y-4">
        <h2 className="text-sm font-semibold text-zinc-950">Vente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Date de vente *</label>
            <input type="date" name="sale_date" required className={field} />
          </div>
          <div>
            <label className={label}>Prix de vente (CHF) *</label>
            <input
              type="number"
              name="sale_price"
              step="0.01"
              required
              className={field}
              defaultValue={priceDefault(vehicle.desired_sale_price)}
            />
          </div>
          <div>
            <label className={label}>Méthode de paiement</label>
            <select name="payment_method" className={field}>
              <option value="">—</option>
              <option value="virement">Virement</option>
              <option value="especes">Espèces</option>
              <option value="carte">Carte</option>
              <option value="financement">Financement</option>
            </select>
          </div>
          <div>
            <label className={label}>Statut du paiement</label>
            <select name="payment_status" className={field} defaultValue="impayé">
              <option value="impayé">Impayé</option>
              <option value="payé">Payé</option>
              <option value="partiel">Partiel</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Garantie</label>
            <input name="warranty" className={field} />
          </div>
        </div>
      </section>

      <section className="app-panel-pad space-y-4">
        <h2 className="text-sm font-semibold text-zinc-950">Acheteur</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Prénom *</label>
            <input name="buyer_first_name" required className={field} />
          </div>
          <div>
            <label className={label}>Nom *</label>
            <input name="buyer_last_name" required className={field} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Adresse</label>
            <input name="buyer_address" className={field} />
          </div>
          <div>
            <label className={label}>NPA</label>
            <input name="buyer_postal_code" className={field} />
          </div>
          <div>
            <label className={label}>Ville</label>
            <input name="buyer_city" className={field} />
          </div>
          <div>
            <label className={label}>Canton</label>
            <input name="buyer_canton" className={field} />
          </div>
          <div>
            <label className={label}>Téléphone</label>
            <input name="buyer_phone" type="tel" className={field} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>E-mail</label>
            <input name="buyer_email" type="email" className={field} />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="app-button-primary min-h-[48px] px-5 disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Valider la vente"}
        </button>
      </div>
    </form>
  );
}
