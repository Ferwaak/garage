function readSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function hasSupabaseConfig() {
  const config = readSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

export function getSupabaseConfig() {
  const config = readSupabaseConfig();

  if (!config.url || !config.anonKey) {
    throw new Error(
      "Configuration Supabase manquante. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans les variables d'environnement Render, puis redeployez."
    );
  }

  return {
    url: config.url,
    anonKey: config.anonKey,
  };
}
