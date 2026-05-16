import { cn } from "@/lib/utils";

function toneForStatus(status?: string | null) {
  const value = status?.toLowerCase() ?? "";

  if (["payée", "payé", "vendu", "en stock"].some((s) => value.includes(s))) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 before:bg-emerald-500";
  }

  if (
    ["réservé", "envoyée", "en préparation", "partiel"].some((s) =>
      value.includes(s)
    )
  ) {
    return "border-amber-200 bg-amber-50 text-amber-800 before:bg-amber-500";
  }

  if (
    ["retard", "annulée", "archivé", "impayé"].some((s) => value.includes(s))
  ) {
    return "border-rose-200 bg-rose-50 text-rose-800 before:bg-rose-500";
  }

  return "border-neutral-200 bg-neutral-100 text-neutral-700 before:bg-neutral-400";
}

export function StatusBadge({
  status,
  className,
}: {
  status?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold before:h-1.5 before:w-1.5 before:rounded-full",
        toneForStatus(status),
        className
      )}
    >
      {status || "Non défini"}
    </span>
  );
}
