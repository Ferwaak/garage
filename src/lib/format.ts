function toFiniteNumber(value: number | string | null | undefined) {
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatNumber(
  value: number | string | null | undefined,
  decimals = 2
): string {
  const n = toFiniteNumber(value);
  const sign = n < 0 ? "-" : "";
  const fixed = Math.abs(n).toFixed(decimals);
  const [integer, fraction] = fixed.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return decimals > 0 ? `${sign}${grouped}.${fraction}` : `${sign}${grouped}`;
}

export function formatChf(value: number | string | null | undefined): string {
  return `${formatNumber(value)} CHF`;
}

export function formatInteger(value: number | string | null | undefined): string {
  return formatNumber(value, 0);
}

export function formatDateFr(
  value: string | Date | null | undefined
): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
