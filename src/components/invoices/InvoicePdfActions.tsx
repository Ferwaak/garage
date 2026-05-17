"use client";

import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/error";
import { generateInvoicePdfBlob } from "@/lib/invoice-pdf";
import type { Customer, Garage, Invoice, InvoiceItem } from "@/types/database";
import { Printer, ReceiptText } from "lucide-react";
import { useState } from "react";

export function InvoicePdfActions({
  garage,
  invoice,
  customer,
  items,
}: {
  garage: Garage;
  invoice: Invoice;
  customer: Customer | null;
  items: InvoiceItem[];
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function getGarageAssetDataUrl(pathOrUrl?: string | null) {
    if (!pathOrUrl) return null;

    try {
      const supabase = createClient();
      let url = pathOrUrl;

      if (!url.startsWith("http")) {
        const { data, error } = await supabase.storage
          .from("garage-logos")
          .createSignedUrl(url, 60 * 10);
        if (error || !data?.signedUrl) return null;
        url = data.signedUrl;
      }

      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();

      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  async function downloadAndStore() {
    setMsg(null);
    setLoading(true);
    try {
      const logoDataUrl = await getGarageAssetDataUrl(garage.logo_url);
      const blob = generateInvoicePdfBlob({
        garage,
        invoice,
        customer,
        items,
        logoDataUrl,
      });
      const path = `${garage.id}/${invoice.id}/facture.pdf`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from("invoices")
        .upload(path, blob, { upsert: true, contentType: "application/pdf" });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase
        .from("invoices")
        .update({ pdf_path: path, pdf_url: path })
        .eq("id", invoice.id);
      if (dbErr) throw dbErr;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg("PDF généré et enregistré.");
    } catch (error) {
      console.error("[invoices] PDF save failed", error);
      setMsg(
        formatSupabaseError(
          "Échec de la génération ou de l'enregistrement du PDF.",
          error instanceof Error ? error : null
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function printLocal() {
    const logoDataUrl = await getGarageAssetDataUrl(garage.logo_url);
    const blob = generateInvoicePdfBlob({
      garage,
      invoice,
      customer,
      items,
      logoDataUrl,
    });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (w) w.addEventListener("load", () => w.print());
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={downloadAndStore}
        className="app-button-primary gap-2 disabled:opacity-50"
      >
        <ReceiptText className="h-4 w-4" />
        {loading ? "Génération..." : "Télécharger PDF"}
      </button>
      <button type="button" onClick={printLocal} className="app-button-secondary gap-2">
        <Printer className="h-4 w-4" />
        Imprimer
      </button>
      {msg && <span className="text-xs text-zinc-600">{msg}</span>}
    </div>
  );
}
