"use client";

import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/error";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function VehicleDocumentUpload({
  garageId,
  vehicleId,
}: {
  garageId: string;
  vehicleId: string;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [docType, setDocType] = useState("autre");
  const [message, setMessage] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    setUploading(true);
    const supabase = createClient();
    try {
      const ext = file.name.split(".").pop() || "pdf";
      const path = `${garageId}/${vehicleId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("vehicle-documents")
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { error: insertError } = await supabase.from("vehicle_documents").insert({
        garage_id: garageId,
        vehicle_id: vehicleId,
        document_name: name.trim() || file.name,
        document_type: docType,
        file_path: path,
        file_url: path,
      });
      if (insertError) throw insertError;
      router.refresh();
      setName("");
      setMessage("Document ajouté.");
    } catch (error) {
      console.error("[vehicle_documents] upload failed", error);
      setMessage(
        formatSupabaseError(
          "Échec du téléversement.",
          error instanceof Error ? error : null
        )
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50/70 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            Nom du document
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex. Facture d’achat"
            className="app-field min-h-[44px]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="app-field min-h-[44px]"
          >
            <option value="facture_achat">Facture d’achat</option>
            <option value="carte_grise">Carte grise</option>
            <option value="permis_circulation">Permis de circulation</option>
            <option value="expertise">Rapport d’expertise</option>
            <option value="contrat">Contrat</option>
            <option value="garantie">Garantie</option>
            <option value="reparation">Réparation</option>
            <option value="autre">Autre</option>
          </select>
        </div>
      </div>
      <label className="app-button-secondary cursor-pointer">
        {uploading ? "Téléversement…" : "Choisir un fichier"}
        <input type="file" className="hidden" disabled={uploading} onChange={onFile} />
      </label>
      {message && <p className="text-xs text-zinc-600">{message}</p>}
    </div>
  );
}
