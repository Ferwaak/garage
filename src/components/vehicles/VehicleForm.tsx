"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import type { VehicleFormValues } from "@/schemas/vehicle";
import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/error";
import { formatChf } from "@/lib/format";
import type { Vehicle } from "@/types/database";
import {
  Calculator,
  CarFront,
  ClipboardList,
  FileText,
  ImagePlus,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";

const statusOptions = [
  "en stock",
  "en préparation",
  "réservé",
  "vendu",
  "archivé",
] as const;

type NumericInput = number | string | null | undefined;

function toNullableNumber(value: NumericInput) {
  if (value === "" || value === null || value === undefined) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function toRequiredNumber(value: NumericInput) {
  return toNullableNumber(value) ?? 0;
}

function priceDefault(value: number | string | null | undefined) {
  if (value === null || value === undefined || Number(value) === 0) return "";
  return Number(value);
}

export function VehicleForm({
  garageId,
  mode,
  vehicle,
}: {
  garageId: string;
  mode: "create" | "edit";
  vehicle?: Vehicle;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);

  const form = useForm<VehicleFormValues>({
    defaultValues: vehicle
      ? {
          name: vehicle.name,
          brand: vehicle.brand ?? "",
          model: vehicle.model ?? "",
          version: vehicle.version ?? "",
          year: vehicle.year ?? undefined,
          mileage: vehicle.mileage ?? undefined,
          fuel_type: vehicle.fuel_type ?? "",
          transmission: vehicle.transmission ?? "",
          power: vehicle.power ?? "",
          color: vehicle.color ?? "",
          doors: vehicle.doors ?? undefined,
          seats: vehicle.seats ?? undefined,
          vin: vehicle.vin ?? "",
          matricule: vehicle.matricule ?? "",
          purchase_date: vehicle.purchase_date ?? "",
          purchase_price: priceDefault(vehicle.purchase_price),
          seller_name: vehicle.seller_name ?? "",
          seller_contact: vehicle.seller_contact ?? "",
          additional_fees: priceDefault(vehicle.additional_fees),
          repair_fees: priceDefault(vehicle.repair_fees),
          preparation_fees: priceDefault(vehicle.preparation_fees),
          administrative_fees: priceDefault(vehicle.administrative_fees),
          desired_sale_price: priceDefault(vehicle.desired_sale_price),
          description: vehicle.description ?? "",
          status: vehicle.status,
        }
      : {
          name: "",
          purchase_price: "",
          additional_fees: "",
          repair_fees: "",
          preparation_fees: "",
          administrative_fees: "",
          desired_sale_price: "",
        },
  });

  const { register, handleSubmit, control } = form;

  const [purchase = 0, add = 0, rep = 0, prep = 0, adm = 0] = useWatch({
    control,
    name: [
      "purchase_price",
      "additional_fees",
      "repair_fees",
      "preparation_fees",
      "administrative_fees",
    ],
  });
  const computedTotal =
    toRequiredNumber(purchase) +
    toRequiredNumber(add) +
    toRequiredNumber(rep) +
    toRequiredNumber(prep) +
    toRequiredNumber(adm);

  function onPhotoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setSelectedPhotos(files);
  }

  async function uploadSelectedPhotos(vehicleId: string) {
    if (!selectedPhotos.length) return;

    const supabase = createClient();
    for (let i = 0; i < selectedPhotos.length; i++) {
      const file = selectedPhotos[i];
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${garageId}/${vehicleId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("vehicle-photos")
        .upload(path, file, {
          upsert: false,
          contentType: file.type || "image/jpeg",
        });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("vehicle_photos").insert({
        garage_id: garageId,
        vehicle_id: vehicleId,
        file_path: path,
        file_url: path,
        sort_order: i,
      });
      if (insertError) {
        await supabase.storage.from("vehicle-photos").remove([path]);
        throw insertError;
      }
    }
  }

  async function onSubmit(values: VehicleFormValues) {
    if (!values.name?.trim()) {
      setError("Le nom du véhicule est obligatoire.");
      return;
    }
    setError(null);
    setSaving(true);
    const supabase = createClient();
    const payload: Record<string, unknown> = {
      name: values.name.trim(),
      brand: values.brand || null,
      model: values.model || null,
      version: values.version || null,
      year: toNullableNumber(values.year),
      mileage: toNullableNumber(values.mileage),
      fuel_type: values.fuel_type || null,
      transmission: values.transmission || null,
      power: values.power || null,
      color: values.color || null,
      doors: toNullableNumber(values.doors),
      seats: toNullableNumber(values.seats),
      vin: values.vin || null,
      matricule: values.matricule || null,
      purchase_date: values.purchase_date || null,
      purchase_price: toRequiredNumber(values.purchase_price),
      seller_name: values.seller_name || null,
      seller_contact: values.seller_contact || null,
      additional_fees: toRequiredNumber(values.additional_fees),
      repair_fees: toRequiredNumber(values.repair_fees),
      preparation_fees: toRequiredNumber(values.preparation_fees),
      administrative_fees: toRequiredNumber(values.administrative_fees),
      desired_sale_price: toNullableNumber(values.desired_sale_price),
      description: values.description || null,
    };

    if (mode === "create") {
      payload.garage_id = garageId;
      payload.status = "en stock";
    } else if (vehicle) {
      payload.status = values.status ?? vehicle.status;
    }

    if (mode === "create") {
      const { data, error: insErr } = await supabase
        .from("vehicles")
        .insert(payload)
        .select("id")
        .single();
      if (insErr) {
        setSaving(false);
        console.error("[vehicles] insert failed", insErr);
        setError(
          formatSupabaseError(
            "Impossible d'enregistrer le véhicule. Vérifiez les champs.",
            insErr
          )
        );
        return;
      }
      try {
        await uploadSelectedPhotos(data.id);
      } catch (uploadError) {
        console.error("[vehicle_photos] upload failed", uploadError);
        setSaving(false);
        setError(
          formatSupabaseError(
            "Véhicule enregistré, mais les photos n'ont pas pu être téléversées.",
            uploadError instanceof Error ? uploadError : null
          )
        );
        router.push(`/vehicules/${data.id}`);
        router.refresh();
        return;
      }
      setSaving(false);
      router.push(`/vehicules/${data.id}`);
      router.refresh();
      return;
    }

    if (!vehicle) return;
    const { error: upErr } = await supabase
      .from("vehicles")
      .update(payload)
      .eq("id", vehicle.id);
    setSaving(false);
    if (upErr) {
      console.error("[vehicles] update failed", upErr);
      setError(formatSupabaseError("Impossible de mettre à jour le véhicule.", upErr));
      return;
    }
    router.refresh();
  }

  const fieldClass = "app-field min-h-[44px]";
  const labelClass = "app-label";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl space-y-6">
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <section className="app-panel-pad space-y-4">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)]">
            <CarFront className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-neutral-950">Identification</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Nom du véhicule *</label>
            <input {...register("name")} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Marque</label>
            <input {...register("brand")} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Modèle</label>
            <input {...register("model")} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Version</label>
            <input {...register("version")} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Année</label>
            <input type="number" {...register("year")} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Kilométrage</label>
            <input type="number" {...register("mileage")} className={fieldClass} />
          </div>
        </div>
      </section>

      {mode === "create" && (
        <section className="app-panel-pad space-y-4">
          <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
              <ImagePlus className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold text-neutral-950">Photos du véhicule</h2>
          </div>
          <label className="flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-5 text-center text-sm text-neutral-600 transition-colors hover:border-neutral-500 hover:bg-neutral-50">
            <ImagePlus className="mb-2 h-6 w-6 text-neutral-500" />
            <span className="font-semibold text-neutral-950">
              Ajouter des photos
            </span>
            <span className="mt-1 text-xs text-neutral-500">
              Optionnel, plusieurs images possibles
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onPhotoFiles}
            />
          </label>
          {selectedPhotos.length > 0 && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-neutral-900">
                  {selectedPhotos.length} photo
                  {selectedPhotos.length > 1 ? "s" : ""} sélectionnée
                  {selectedPhotos.length > 1 ? "s" : ""}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedPhotos([])}
                  className="inline-flex min-h-[36px] items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  <X className="h-4 w-4" />
                  Retirer
                </button>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-neutral-600">
                {selectedPhotos.slice(0, 4).map((file) => (
                  <li key={`${file.name}-${file.size}`} className="truncate">
                    {file.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="app-panel-pad space-y-4">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
            <Wrench className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-neutral-950">Technique</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Carburant</label>
            <input {...register("fuel_type")} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Boîte de vitesses</label>
            <input {...register("transmission")} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Puissance</label>
            <input {...register("power")} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Couleur</label>
            <input {...register("color")} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Portes</label>
            <input type="number" {...register("doors")} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Places</label>
            <input type="number" {...register("seats")} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>N° de châssis (VIN)</label>
            <input {...register("vin")} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Matricule</label>
            <input {...register("matricule")} className={fieldClass} />
          </div>
        </div>
      </section>

      <section className="app-panel-pad space-y-4">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
            <Calculator className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-neutral-950">Acquisition & coûts (CHF)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date d’acquisition</label>
            <input type="date" {...register("purchase_date")} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Prix d’acquisition</label>
            <input
              type="number"
              step="0.01"
              {...register("purchase_price")}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Fournisseur / vendeur</label>
            <input {...register("seller_name")} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Coordonnées vendeur</label>
            <input {...register("seller_contact")} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Frais supplémentaires</label>
            <input
              type="number"
              step="0.01"
              {...register("additional_fees")}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Frais de remise en vente</label>
            <input
              type="number"
              step="0.01"
              {...register("repair_fees")}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Frais de préparation commerciale</label>
            <input
              type="number"
              step="0.01"
              {...register("preparation_fees")}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Frais administratifs</label>
            <input
              type="number"
              step="0.01"
              {...register("administrative_fees")}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Prix de vente souhaité</label>
            <input
              type="number"
              step="0.01"
              {...register("desired_sale_price")}
              className={fieldClass}
            />
          </div>
          <div className="md:col-span-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm">
            <span className="text-neutral-600">Prix total réel calculé</span>
            <span className="mt-1 block text-xl font-semibold tabular-nums text-neutral-950">
              {formatChf(computedTotal)}
            </span>
          </div>
        </div>
      </section>

      <section className="app-panel-pad space-y-4">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
            <ClipboardList className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-neutral-950">Textes et suivi</h2>
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea {...register("description")} rows={4} className={fieldClass + " min-h-[100px]"} />
        </div>
        {mode === "edit" && (
          <div>
            <label className={labelClass}>Statut</label>
            <select {...register("status")} className={fieldClass}>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      <div className="sticky bottom-4 z-10 flex flex-wrap gap-3 rounded-xl border border-neutral-200 bg-white/92 p-3 shadow-[0_18px_44px_rgba(20,28,38,0.12)] backdrop-blur">
        <button
          type="submit"
          disabled={saving}
          className="app-button-primary min-h-[48px] px-5 disabled:opacity-50"
        >
          <FileText className="mr-2 h-4 w-4" />
          {saving ? "Enregistrement…" : "Enregistrer"}
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
