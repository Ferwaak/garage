"use client";

import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/error";
import { useRouter } from "next/navigation";
import type { InvoiceStatus } from "@/types/database";
import { useState } from "react";

const options: { value: InvoiceStatus; label: string }[] = [
  { value: "brouillon", label: "Brouillon" },
  { value: "envoyée", label: "Envoyée" },
  { value: "payée", label: "Payée" },
  { value: "en retard", label: "En retard" },
  { value: "annulée", label: "Annulée" },
];

export function InvoiceStatusActions({
  invoiceId,
  current,
}: {
  invoiceId: string;
  current: InvoiceStatus;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function update(status: InvoiceStatus) {
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ status })
      .eq("id", invoiceId);

    if (updateError) {
      console.error("[invoices] status update failed", updateError);
      setError(formatSupabaseError("Mise à jour du statut impossible.", updateError));
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={option.value === current}
            onClick={() => update(option.value)}
            className={`app-tab ${option.value === current ? "app-tab-active" : ""}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
