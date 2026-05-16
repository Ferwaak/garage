"use client";

import { createClient } from "@/lib/supabase/client";
import { KeyRound, LockKeyhole, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/tableau-de-bord";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signErr) {
      setError(
        "Identifiants incorrects ou compte indisponible. Vérifiez votre adresse e-mail et votre mot de passe."
      );
      return;
    }
    router.refresh();
    router.replace(redirectTo);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef0ed] px-4 py-10">
      <div className="w-full max-w-[430px]">
        <div className="mb-7 text-center">
          <p className="text-3xl font-semibold tracking-tight text-neutral-950">
            Logiciel
          </p>
          <p className="mt-2 text-sm font-medium text-neutral-500">
            Développé par Xhem Zeqiri
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-[0_24px_70px_rgba(20,28,38,0.12)] sm:p-6">
          <div className="mb-7">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-950 text-white">
              <KeyRound className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Connexion
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Accédez à votre espace de gestion.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="app-label">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="app-field min-h-[44px] pl-10 text-base"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="app-label">
                Mot de passe
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="app-field min-h-[44px] pl-10 text-base"
                />
              </div>
            </div>
            {error && (
              <p
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-neutral-950 px-4 py-2.5 text-base font-semibold text-white transition-colors hover:bg-neutral-800 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Accès réservé aux comptes configurés par l&apos;administrateur.
        </p>
      </div>
    </main>
  );
}
