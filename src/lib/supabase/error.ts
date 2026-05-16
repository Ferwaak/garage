type SupabaseLikeError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
};

export function formatSupabaseError(
  fallback: string,
  error: SupabaseLikeError | null | undefined
) {
  if (!error) return fallback;

  const details = [
    error.code ? `code ${error.code}` : null,
    error.status ? `status ${error.status}` : null,
    error.message,
    error.details,
    error.hint,
  ].filter(Boolean);

  return details.length ? `${fallback} Détail Supabase : ${details.join(" - ")}` : fallback;
}
