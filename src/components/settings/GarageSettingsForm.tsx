"use client";

import { SignedStorageImage } from "@/components/media/SignedStorageImage";
import { saveGarageSettings } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import type { Garage } from "@/types/database";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function GarageStoragePreview({
  path,
  alt,
}: {
  path: string;
  alt: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    (async () => {
      const supabase = createClient();
      const cleanPath = path.split("?")[0];
      const { data, error } = await supabase.storage
        .from("garage-logos")
        .download(cleanPath);

      if (cancelled || error || !data) return;
      objectUrl = URL.createObjectURL(data);
      setSrc(objectUrl);
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  if (!src) return null;

  return (
    <div className="h-32 w-32 overflow-hidden rounded-md border border-zinc-200">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-contain" />
    </div>
  );
}

export function GarageSettingsForm({ garage }: { garage: Garage }) {
  const router = useRouter();
  const ibanQrPath = `${garage.id}/iban-qr.png`;
  const [msg, setMsg] = useState<string | null>(null);
  const [msgOk, setMsgOk] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPath, setLogoPath] = useState<string | null>(garage.logo_url);
  const [qrPreviewPath, setQrPreviewPath] = useState<string | null>(
    garage.qr_code_url ?? ibanQrPath
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setMsgOk(true);
    setSaving(true);

    const fd = new FormData(e.currentTarget);
    const result = await saveGarageSettings(fd);

    setSaving(false);
    setMsg(result.message);
    setMsgOk(result.ok);

    if (result.ok) {
      router.refresh();
      window.setTimeout(() => window.location.reload(), 250);
    }
  }

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    setMsgOk(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "png";
    const path = `${garage.id}/logo.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("garage-logos")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setMsgOk(false);
      setMsg("Échec du téléversement du logo.");
      return;
    }
    const { error: dbErr } = await supabase
      .from("garages")
      .update({ logo_url: path })
      .eq("id", garage.id);
    if (dbErr) {
      setMsgOk(false);
      setMsg("Logo téléversé mais URL non enregistrée.");
    } else {
      setLogoPath(path);
      setMsgOk(true);
      setMsg("Logo mis à jour.");
      router.refresh();
    }
    e.target.value = "";
  }

  async function deleteLogo() {
    if (!logoPath) return;
    setMsg(null);
    setMsgOk(true);
    const supabase = createClient();

    if (!logoPath.startsWith("http")) {
      await supabase.storage.from("garage-logos").remove([logoPath]);
    }

    const { error } = await supabase
      .from("garages")
      .update({ logo_url: null })
      .eq("id", garage.id);

    if (error) {
      setMsgOk(false);
      setMsg("Suppression du logo impossible.");
      return;
    }

    setLogoPath(null);
    setMsgOk(true);
    setMsg("Logo supprimé.");
    router.refresh();
  }

  async function onIbanQr(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    setMsgOk(true);
    const supabase = createClient();
    const { error: upErr } = await supabase.storage
      .from("garage-logos")
      .upload(ibanQrPath, file, {
        upsert: true,
        contentType: file.type || "image/png",
      });
    if (upErr) {
      setMsgOk(false);
      setMsg("Échec du téléversement du QR IBAN.");
      return;
    }
    setQrPreviewPath(`${ibanQrPath}?v=${Date.now()}`);
    setMsgOk(true);
    setMsg("QR IBAN mis à jour.");
    e.target.value = "";
  }

  async function deleteIbanQr() {
    setMsg(null);
    setMsgOk(true);
    const supabase = createClient();
    const { error } = await supabase.storage.from("garage-logos").remove([ibanQrPath]);

    if (error) {
      setMsgOk(false);
      setMsg("Suppression du QR IBAN impossible.");
      return;
    }

    setQrPreviewPath(null);
    setMsgOk(true);
    setMsg("QR IBAN supprimé.");
  }

  const f = "app-field min-h-[44px]";
  const l = "app-label";

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      {msg && (
        <p
          className={
            msgOk
              ? "rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
              : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {msg}
        </p>
      )}

      {logoPath?.startsWith("http") ? (
        <div className="h-32 w-32 overflow-hidden rounded-md border border-zinc-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoPath}
            alt="Logo"
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        logoPath && (
          <div className="h-32 w-32 overflow-hidden rounded-md border border-zinc-200">
            <SignedStorageImage
              bucket="garage-logos"
              path={logoPath}
              alt="Logo"
              className="h-full w-full object-contain"
            />
          </div>
        )
      )}
      <div>
        <label className={l}>Logo du point de vente</label>
        <input
          type="file"
          accept="image/*"
          onChange={onLogo}
          className="text-sm"
        />
        {logoPath && (
          <button
            type="button"
            onClick={deleteLogo}
            className="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer le logo
          </button>
        )}
      </div>

      {qrPreviewPath?.startsWith("http") ? (
        <div className="h-32 w-32 overflow-hidden rounded-md border border-zinc-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrPreviewPath}
            alt="QR IBAN"
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        qrPreviewPath && <GarageStoragePreview path={qrPreviewPath} alt="QR IBAN" />
      )}
      <div>
        <label className={l}>QR code IBAN</label>
        <input
          type="file"
          accept="image/*"
          onChange={onIbanQr}
          className="text-sm"
        />
        {qrPreviewPath && (
          <button
            type="button"
            onClick={deleteIbanQr}
            className="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer le QR IBAN
          </button>
        )}
      </div>

      <section className="app-panel-pad grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={l}>Nom commercial</label>
          <input name="name" defaultValue={garage.name} className={f} required />
        </div>
        <div className="md:col-span-2">
          <label className={l}>Raison sociale</label>
          <input
            name="legal_name"
            defaultValue={garage.legal_name ?? ""}
            className={f}
          />
        </div>
        <div className="md:col-span-2">
          <label className={l}>Adresse</label>
          <input name="address" defaultValue={garage.address ?? ""} className={f} />
        </div>
        <div>
          <label className={l}>NPA</label>
          <input
            name="postal_code"
            defaultValue={garage.postal_code ?? ""}
            className={f}
          />
        </div>
        <div>
          <label className={l}>Ville</label>
          <input name="city" defaultValue={garage.city ?? ""} className={f} />
        </div>
        <div>
          <label className={l}>Canton</label>
          <input name="canton" defaultValue={garage.canton ?? ""} className={f} />
        </div>
        <div>
          <label className={l}>Pays</label>
          <input
            name="country"
            defaultValue={garage.country ?? "Suisse"}
            className={f}
          />
        </div>
        <div>
          <label className={l}>Téléphone</label>
          <input name="phone" defaultValue={garage.phone ?? ""} className={f} />
        </div>
        <div>
          <label className={l}>E-mail</label>
          <input
            name="email"
            type="email"
            defaultValue={garage.email ?? ""}
            className={f}
          />
        </div>
        <div className="md:col-span-2">
          <label className={l}>Site web</label>
          <input name="website" defaultValue={garage.website ?? ""} className={f} />
        </div>
      </section>

      <section className="app-panel-pad grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={l}>IBAN</label>
          <input name="iban" defaultValue={garage.iban ?? ""} className={f} />
        </div>
        <div>
          <label className={l}>Banque</label>
          <input
            name="bank_name"
            defaultValue={garage.bank_name ?? ""}
            className={f}
          />
        </div>
        <div>
          <label className={l}>Titulaire du compte</label>
          <input
            name="bank_account_holder"
            defaultValue={garage.bank_account_holder ?? ""}
            className={f}
          />
        </div>
        <div>
          <label className={l}>N° TVA</label>
          <input
            name="vat_number"
            defaultValue={garage.vat_number ?? ""}
            className={f}
          />
        </div>
        <div>
          <label className={l}>Préfixe factures</label>
          <input
            name="invoice_prefix"
            defaultValue={garage.invoice_prefix ?? "AZ"}
            className={f}
          />
        </div>
        <div>
          <label className={l}>Taux TVA par défaut (%)</label>
          <input
            name="default_vat_rate"
            type="number"
            step="0.01"
            defaultValue={garage.default_vat_rate ?? 8.1}
            className={f}
          />
        </div>
        <div>
          <label className={l}>Devise</label>
          <input
            name="currency"
            defaultValue={garage.currency ?? "CHF"}
            className={f}
          />
        </div>
        <div className="md:col-span-2">
          <label className={l}>Conditions de paiement par défaut</label>
          <textarea
            name="default_payment_terms"
            rows={2}
            defaultValue={garage.default_payment_terms ?? ""}
            className={f + " min-h-[72px]"}
          />
        </div>
        <div className="md:col-span-2">
          <label className={l}>Texte par défaut des factures</label>
          <textarea
            name="default_invoice_note"
            rows={2}
            defaultValue={garage.default_invoice_note ?? ""}
            className={f + " min-h-[72px]"}
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="app-button-primary min-h-[48px] px-5 disabled:opacity-50"
      >
        {saving ? "Enregistrement…" : "Enregistrer les paramètres"}
      </button>
    </form>
  );
}

