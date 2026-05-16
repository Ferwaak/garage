"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = {
  ok: boolean;
  message: string;
};

function textValue(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value || null;
}

async function authedClient() {
  const ctx = await getAuthContext();
  if (!ctx) {
    return {
      ctx: null,
      supabase: null,
      error: { ok: false, message: "Session expirée. Reconnectez-vous." },
    } as const;
  }

  return { ctx, supabase: await createClient(), error: null } as const;
}

function refreshApp() {
  revalidatePath("/", "layout");
}

export async function saveGarageSettings(formData: FormData): Promise<ActionResult> {
  const auth = await authedClient();
  if (auth.error) return auth.error;
  const { ctx, supabase } = auth;

  const basePayload = {
    name: textValue(formData, "name") || ctx.garage.name,
    legal_name: textValue(formData, "legal_name"),
    address: textValue(formData, "address"),
    postal_code: textValue(formData, "postal_code"),
    city: textValue(formData, "city"),
    canton: textValue(formData, "canton"),
    country: textValue(formData, "country") || "Suisse",
    phone: textValue(formData, "phone"),
    email: textValue(formData, "email"),
    website: textValue(formData, "website"),
    iban: textValue(formData, "iban"),
    bank_name: textValue(formData, "bank_name"),
    bank_account_holder: textValue(formData, "bank_account_holder"),
    vat_number: textValue(formData, "vat_number"),
    default_payment_terms: textValue(formData, "default_payment_terms"),
    default_invoice_note: textValue(formData, "default_invoice_note"),
    default_vat_rate: Number(formData.get("default_vat_rate") || 8.1),
    currency: textValue(formData, "currency") || "CHF",
    invoice_prefix: textValue(formData, "invoice_prefix") || "AZ",
  };

  const { error: baseError } = await supabase
    .from("garages")
    .update(basePayload)
    .eq("id", ctx.garage.id);

  if (baseError) {
    return {
      ok: false,
      message: `Enregistrement impossible : ${baseError.message}`,
    };
  }

  refreshApp();
  return { ok: true, message: "Paramètres enregistrés." };
}

export async function deleteInvoice(invoiceId: string): Promise<ActionResult> {
  const auth = await authedClient();
  if (auth.error) return auth.error;
  const { ctx, supabase } = auth;

  const { data: invoice, error: loadError } = await supabase
    .from("invoices")
    .select("id, garage_id, pdf_path")
    .eq("id", invoiceId)
    .eq("garage_id", ctx.garage.id)
    .maybeSingle();

  if (loadError || !invoice) {
    return { ok: false, message: "Facture introuvable ou non autorisée." };
  }

  const { data: deleted, error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("garage_id", ctx.garage.id)
    .select("id")
    .maybeSingle();

  if (error || !deleted) {
    return { ok: false, message: "Suppression de la facture impossible." };
  }

  if (invoice.pdf_path) {
    await supabase.storage.from("invoices").remove([invoice.pdf_path]);
  }

  refreshApp();
  return { ok: true, message: "Facture supprimée." };
}

export async function deleteSale(saleId: string): Promise<ActionResult> {
  const auth = await authedClient();
  if (auth.error) return auth.error;
  const { ctx, supabase } = auth;

  const { data: sale, error: loadError } = await supabase
    .from("sales")
    .select("id, vehicle_id")
    .eq("id", saleId)
    .eq("garage_id", ctx.garage.id)
    .maybeSingle();

  if (loadError || !sale) {
    return { ok: false, message: "Vente introuvable ou non autorisée." };
  }

  const { data: deleted, error } = await supabase
    .from("sales")
    .delete()
    .eq("id", saleId)
    .eq("garage_id", ctx.garage.id)
    .select("id")
    .maybeSingle();

  if (error || !deleted) {
    return { ok: false, message: "Suppression du véhicule vendu impossible." };
  }

  await supabase
    .from("vehicles")
    .update({ status: "en stock" })
    .eq("id", sale.vehicle_id)
    .eq("garage_id", ctx.garage.id);

  refreshApp();
  return { ok: true, message: "Vente supprimée." };
}

export async function deleteCustomer(customerId: string): Promise<ActionResult> {
  const auth = await authedClient();
  if (auth.error) return auth.error;
  const { ctx, supabase } = auth;

  const { data: customer, error: loadError } = await supabase
    .from("customers")
    .select("id")
    .eq("id", customerId)
    .eq("garage_id", ctx.garage.id)
    .maybeSingle();

  if (loadError || !customer) {
    return { ok: false, message: "Client introuvable ou non autorisé." };
  }

  const { data: linkedSales } = await supabase
    .from("sales")
    .select("vehicle_id")
    .eq("customer_id", customerId)
    .eq("garage_id", ctx.garage.id);

  await supabase
    .from("sales")
    .delete()
    .eq("customer_id", customerId)
    .eq("garage_id", ctx.garage.id);

  const vehicleIds = [
    ...new Set((linkedSales ?? []).map((sale) => sale.vehicle_id).filter(Boolean)),
  ];
  if (vehicleIds.length) {
    await supabase
      .from("vehicles")
      .update({ status: "en stock" })
      .in("id", vehicleIds)
      .eq("garage_id", ctx.garage.id);
  }

  await supabase
    .from("invoices")
    .update({ customer_id: null })
    .eq("customer_id", customerId)
    .eq("garage_id", ctx.garage.id);

  const { data: deleted, error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId)
    .eq("garage_id", ctx.garage.id)
    .select("id")
    .maybeSingle();

  if (error || !deleted) {
    return { ok: false, message: "Suppression du client impossible." };
  }

  refreshApp();
  return { ok: true, message: "Client supprimé." };
}

export async function deleteVehicle(vehicleId: string): Promise<ActionResult> {
  const auth = await authedClient();
  if (auth.error) return auth.error;
  const { ctx, supabase } = auth;

  const { data: vehicle, error: loadError } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("garage_id", ctx.garage.id)
    .maybeSingle();

  if (loadError || !vehicle) {
    return { ok: false, message: "Véhicule introuvable ou non autorisé." };
  }

  const { data: photos } = await supabase
    .from("vehicle_photos")
    .select("file_path")
    .eq("vehicle_id", vehicleId)
    .eq("garage_id", ctx.garage.id);

  const { data: documents } = await supabase
    .from("vehicle_documents")
    .select("file_path")
    .eq("vehicle_id", vehicleId)
    .eq("garage_id", ctx.garage.id);

  await supabase
    .from("sales")
    .delete()
    .eq("vehicle_id", vehicleId)
    .eq("garage_id", ctx.garage.id);

  const { data: deleted, error } = await supabase
    .from("vehicles")
    .delete()
    .eq("id", vehicleId)
    .eq("garage_id", ctx.garage.id)
    .select("id")
    .maybeSingle();

  if (error || !deleted) {
    return { ok: false, message: "Suppression du véhicule impossible." };
  }

  const photoPaths = (photos ?? []).map((photo) => photo.file_path).filter(Boolean);
  if (photoPaths.length) {
    await supabase.storage.from("vehicle-photos").remove(photoPaths);
  }

  const documentPaths = (documents ?? [])
    .map((document) => document.file_path)
    .filter(Boolean);
  if (documentPaths.length) {
    await supabase.storage.from("vehicle-documents").remove(documentPaths);
  }

  refreshApp();
  return { ok: true, message: "Véhicule supprimé." };
}
