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

export function hasSupabaseBrowserConfig() {
  const config = readBrowserRuntimeConfig();
  return Boolean(config.url && config.anonKey);
}

export function getSupabaseBrowserConfig() {
  const config = readBrowserRuntimeConfig();

  if (!config.url || !config.anonKey) {
    throw new Error(
      "Configuration Supabase navigateur manquante. Verifiez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY sur Render."
    );
  }

  return {
    url: config.url,
    anonKey: config.anonKey,
  };
}
