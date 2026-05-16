"use client";

import { createClient } from "@/lib/supabase/client";

export function DocumentDownloadButton({
  path,
  label,
}: {
  path: string;
  label: string;
}) {
  async function handle() {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("vehicle-documents")
      .createSignedUrl(path, 120);
    if (!error && data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <button
      type="button"
      onClick={handle}
      className="app-button-secondary min-h-[40px] px-3 py-2"
    >
      {label}
    </button>
  );
}
