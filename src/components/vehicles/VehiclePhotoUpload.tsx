"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function VehiclePhotoUpload({
  garageId,
  vehicleId,
}: {
  garageId: string;
  vehicleId: string;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setMessage(null);
    setUploading(true);
    const supabase = createClient();
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${garageId}/${vehicleId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("vehicle-photos")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        await supabase.from("vehicle_photos").insert({
          garage_id: garageId,
          vehicle_id: vehicleId,
          file_path: path,
          file_url: path,
          sort_order: i,
        });
      }
      router.refresh();
      setMessage("Photos ajoutées.");
    } catch {
      setMessage("Échec du téléversement. Réessayez.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <label className="app-button-secondary cursor-pointer">
        {uploading ? "Téléversement…" : "Ajouter des photos"}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          disabled={uploading}
          onChange={onFiles}
        />
      </label>
      {message && <p className="text-xs text-zinc-600 mt-2">{message}</p>}
    </div>
  );
}
