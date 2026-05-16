import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseBrowserConfig } from "@/lib/supabase/browser-env";

export function createClient() {
  const config = getSupabaseBrowserConfig();
  return createBrowserClient(config.url, config.anonKey);
}
