type SupabaseRuntimeConfig = {
  url?: string;
  anonKey?: string;
};

function decodeJwtPayload(value: string) {
  const [, payload] = value.split(".");
  if (!payload) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      role?: string;
    };
  } catch {
    return null;
  }
}

function isUnsafePublicSupabaseKey(value: string | undefined) {
  if (!value) return false;
  if (value.startsWith("sb_secret_")) return true;

  return decodeJwtPayload(value)?.role === "service_role";
}

function firstSafePublicKey(...values: Array<string | undefined>) {
  return values.map((value) => value?.trim()).find((value) => {
    return Boolean(value && !isUnsafePublicSupabaseKey(value));
  });
}

function readSupabaseConfig() {
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const legacyAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: firstSafePublicKey(publishableKey, legacyAnonKey),
    unsafePublicKeyConfigured:
      isUnsafePublicSupabaseKey(publishableKey) ||
      isUnsafePublicSupabaseKey(legacyAnonKey),
  };
}

export function hasSupabaseConfig() {
  const config = readSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

export function getSupabaseConfig() {
  const config = readSupabaseConfig();

  if (!config.url || !config.anonKey) {
    if (config.unsafePublicKeyConfigured) {
      throw new Error(
        "Configuration Supabase dangereuse : une cle secret/service_role est configuree dans une variable NEXT_PUBLIC_. Remplacez-la par NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY avec une cle sb_publishable_... ou par la cle legacy anon."
      );
    }

    throw new Error(
      "Configuration Supabase manquante. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY dans les variables d'environnement Render, puis redeployez."
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
