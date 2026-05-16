"use client";

import type { ActionResult } from "@/app/actions";
import { cn } from "@/lib/utils";
import { Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ConfirmDeleteButtonProps = {
  deleteAction: () => Promise<ActionResult>;
  title: string;
  description: string;
  label?: string;
  confirmLabel?: string;
  redirectTo?: string;
  compact?: boolean;
};

export function ConfirmDeleteButton({
  deleteAction,
  title,
  description,
  label = "Supprimer",
  confirmLabel = "Supprimer définitivement",
  redirectTo,
  compact = false,
}: ConfirmDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function confirmDelete() {
    setLoading(true);
    setMessage(null);
    const result = await deleteAction();
    setLoading(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setOpen(false);
    if (redirectTo) {
      router.replace(redirectTo);
    }
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          compact
            ? "inline-flex min-h-[36px] items-center justify-center rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
            : "app-button-danger gap-2"
        )}
      >
        <Trash2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {message && (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {message}
              </p>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="app-button-secondary"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={confirmDelete}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:pointer-events-none disabled:opacity-50"
              >
                {loading ? "Suppression…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
