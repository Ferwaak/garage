import { createClient } from "@/lib/supabase/server";
import type { Garage, Profile } from "@/types/database";

export type AuthContext = {
  userId: string;
  profile: Profile;
  garage: Garage;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (pErr || !profile) return null;

  const { data: garage, error: gErr } = await supabase
    .from("garages")
    .select("*")
    .eq("id", profile.garage_id)
    .maybeSingle();

  if (gErr || !garage) return null;

  return {
    userId: user.id,
    profile: profile as Profile,
    garage: garage as Garage,
  };
}
