type SupabaseRuntimeConfig = {
  url?: string;
  anonKey?: string;
};

declare global {
  interface Window {
    __GARAGE_AZ_SUPABASE__?: SupabaseRuntimeConfig;
  }
}

function readBrowserRuntimeConfig(): SupabaseRuntimeConfig {
  if (typeof window === "undefined") {
    return {};
  }

  return window.__GARAGE_AZ_SUPABASE__ ?? {};
}

function readSupabaseConfig() {
  const runtimeConfig = readBrowserRuntimeConfig();

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || runtimeConfig.url,
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      runtimeConfig.anonKey,
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

export function getSupabaseRuntimeConfig(): SupabaseRuntimeConfig {
  const config = readSupabaseConfig();

  return {
    url: config.url,
    anonKey: config.anonKey,
  };
}
