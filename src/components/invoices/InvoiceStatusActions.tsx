"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { InvoiceStatus } from "@/types/database";

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

  async function update(status: InvoiceStatus) {
    const supabase = createClient();
    await supabase.from("invoices").update({ status }).eq("id", invoiceId);
    router.refresh();
  }

  return (
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
  );
}
