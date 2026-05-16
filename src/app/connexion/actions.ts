"use server";

import { createClient } from "@/lib/supabase/server";

type SignInResult =
  | { ok: true }
  | { ok: false; message: string; detail?: string };

function toSignInMessage(error: { message?: string; status?: number; code?: string }) {
  const message = error.message ?? "";
  const normalized = message.toLowerCase();

  if (normalized.includes("email not confirmed")) {
    return "Votre compte existe, mais l'adresse e-mail n'est pas confirmee. Confirmez l'utilisateur dans Supabase > Authentication > Users.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "Identifiants incorrects pour le projet Supabase utilise par l'application. Verifiez que ce compte existe dans le meme projet que Render.";
  }

  if (
    normalized.includes("invalid api key") ||
    normalized.includes("apikey") ||
    error.status === 401
  ) {
    return "La cle Supabase configuree sur Render est invalide ou ne correspond pas a l'URL du projet.";
  }

  if (normalized.includes("failed to fetch") || normalized.includes("network")) {
    return "Render n'arrive pas a joindre Supabase. Verifiez l'URL Supabase et redeployez l'application.";
  }

  return "Connexion impossible. Consultez le detail technique ci-dessous ou les logs Render.";
}

export async function signInWithEmailPassword(input: {
  email: string;
  password: string;
}): Promise<SignInResult> {
  const email = input.email.trim().toLowerCase();

  if (!email || !input.password) {
    return {
      ok: false,
      message: "Adresse e-mail et mot de passe requis.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: input.password,
    });

    if (!error) {
      return { ok: true };
    }

    console.error("[auth] Supabase signInWithPassword failed", {
      status: error.status,
      code: error.code,
      message: error.message,
    });

    return {
      ok: false,
      message: toSignInMessage(error),
      detail: [error.status, error.code, error.message].filter(Boolean).join(" - "),
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[auth] Sign in failed before Supabase response", { detail });

    return {
      ok: false,
      message:
        "Connexion impossible car la configuration Supabase cote serveur n'est pas disponible.",
      detail,
    };
  }
}
