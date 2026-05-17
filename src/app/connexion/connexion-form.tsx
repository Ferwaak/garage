"use client";

import { signInWithEmailPassword } from "@/app/connexion/actions";
import { AutoManagerLogo } from "@/components/brand/AutoManagerLogo";
import { LockKeyhole, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const redirectTo =
    redirectParam?.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : "/tableau-de-bord";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorDetail(null);
    setLoading(true);

    const result = await signInWithEmailPassword({ email, password });

    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      setErrorDetail(result.detail ?? null);
      return;
    }

    router.refresh();
    router.replace(redirectTo);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071210] px-4 py-10">
      <div className="w-full max-w-[430px]">
        <div className="mb-7 text-center">
          <p className="text-3xl font-semibold tracking-tight text-white">
            AutoManager
          </p>
          <p className="mt-2 text-sm font-medium text-[#9fc5bd]">
            Développé par Xhem Zeqiri
          </p>
        </div>

        <div className="rounded-xl border border-[#0b564a]/25 bg-white p-5 shadow-[0_24px_70px_rgba(11,86,74,0.26)] sm:p-6">
          <div className="mb-7">
            <AutoManagerLogo className="mb-4 h-12 w-12" />
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
              <div
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                <p>{error}</p>
                {errorDetail && (
                  <p className="mt-2 break-words font-mono text-xs text-red-900/80">
                    Détail technique : {errorDetail}
                  </p>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-[#0b564a] px-4 py-2.5 text-base font-semibold text-white transition-colors hover:bg-[#09483f] disabled:pointer-events-none disabled:opacity-50"
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
