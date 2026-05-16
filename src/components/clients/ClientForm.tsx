"use client";

import { createClient } from "@/lib/supabase/client";
import { Building2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ClientForm({ garageId }: { garageId: string }) {
  const router = useRouter();
  const [type, setType] = useState<"particulier" | "entreprise">("particulier");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const firstName = String(fd.get("first_name") || "").trim();
    const lastName = String(fd.get("last_name") || "").trim();
    const companyName = String(fd.get("company_name") || "").trim();

    if (type === "particulier" && (!firstName || !lastName)) {
      setSaving(false);
      setError("Prénom et nom sont obligatoires.");
      return;
    }
    if (type === "entreprise" && !companyName) {
      setSaving(false);
      setError("La raison sociale est obligatoire.");
      return;
    }

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("customers")
      .insert({
        garage_id: garageId,
        customer_type: type,
        first_name: firstName || null,
        last_name: lastName || null,
        company_name: companyName || null,
        address: String(fd.get("address") || "").trim() || null,
        postal_code: String(fd.get("postal_code") || "").trim() || null,
        city: String(fd.get("city") || "").trim() || null,
        canton: String(fd.get("canton") || "").trim() || null,
        country: String(fd.get("country") || "").trim() || "Suisse",
        phone: String(fd.get("phone") || "").trim() || null,
        email: String(fd.get("email") || "").trim() || null,
        notes: String(fd.get("notes") || "").trim() || null,
      })
      .select("id")
      .single();

    setSaving(false);
    if (insertError || !data) {
      setError("Impossible de créer le client.");
      return;
    }
    router.push(`/clients/${data.id}`);
    router.refresh();
  }

  const f = "app-field min-h-[44px]";
  const l = "app-label";

  return (
    <form onSubmit={onSubmit} className="max-w-4xl space-y-6">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="app-panel-pad space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setType("particulier")}
            className={`app-tab ${type === "particulier" ? "app-tab-active" : ""}`}
          >
            <UserRound className="mr-2 h-4 w-4" />
            Particulier
          </button>
          <button
            type="button"
            onClick={() => setType("entreprise")}
            className={`app-tab ${type === "entreprise" ? "app-tab-active" : ""}`}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Entreprise
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {type === "entreprise" && (
            <div className="md:col-span-2">
              <label className={l}>Raison sociale *</label>
              <input name="company_name" className={f} />
            </div>
          )}
          <div>
            <label className={l}>Prénom{type === "particulier" ? " *" : ""}</label>
            <input name="first_name" className={f} />
          </div>
          <div>
            <label className={l}>Nom{type === "particulier" ? " *" : ""}</label>
            <input name="last_name" className={f} />
          </div>
          <div>
            <label className={l}>Téléphone</label>
            <input name="phone" type="tel" className={f} />
          </div>
          <div>
            <label className={l}>E-mail</label>
            <input name="email" type="email" className={f} />
          </div>
        </div>
      </section>

      <section className="app-panel-pad grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={l}>Adresse</label>
          <input name="address" className={f} />
        </div>
        <div>
          <label className={l}>NPA</label>
          <input name="postal_code" className={f} />
        </div>
        <div>
          <label className={l}>Ville</label>
          <input name="city" className={f} />
        </div>
        <div>
          <label className={l}>Canton</label>
          <input name="canton" className={f} />
        </div>
        <div>
          <label className={l}>Pays</label>
          <input name="country" defaultValue="Suisse" className={f} />
        </div>
        <div className="md:col-span-2">
          <label className={l}>Notes</label>
          <textarea name="notes" rows={3} className={f + " min-h-[92px]"} />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="app-button-primary min-h-[48px] px-5"
        >
          {saving ? "Création…" : "Créer le client"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="app-button-secondary min-h-[48px] px-5"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
