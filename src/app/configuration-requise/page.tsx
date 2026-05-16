"use client";

import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ConfigurationRequisePage() {
  const router = useRouter();
  const missingSupabaseConfig = !hasSupabaseConfig();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (missingSupabaseConfig) return;

    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data.user) return;
      setUserId(data.user.id);
      setEmail(data.user.email ?? null);
    })();

    return () => {
      cancelled = true;
    };
  }, [missingSupabaseConfig]);

  async function copyUid() {
    if (!userId) return;
    await navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSignOut() {
    if (missingSupabaseConfig) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/connexion");
  }

  const sqlCheck = `-- A coller dans Supabase -> SQL Editor -> Run
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'garages'
) AS tables_creees;

SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'authenticated'
  AND table_schema = 'public'
  AND table_name IN ('customers', 'vehicles', 'invoices')
ORDER BY table_name, privilege_type;

SELECT id AS user_id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
SELECT * FROM public.profiles;
SELECT id, name FROM public.garages;`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-xl space-y-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">
            {missingSupabaseConfig
              ? "Configuration Render requise"
              : "Compte non configuré"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            {missingSupabaseConfig ? (
              <>
                Render n&apos;a pas encore les variables Supabase. Ajoutez-les
                dans les variables d&apos;environnement du Web Service, puis
                relancez un deploy.
              </>
            ) : (
              <>
                Vous êtes connecté, mais l&apos;application ne trouve pas de{" "}
                <strong>garage lié à votre utilisateur</strong>. Il manque une
                ligne dans la table{" "}
                <code className="rounded bg-zinc-100 px-1 text-xs">profiles</code>
                , ou les tables n&apos;ont pas encore été créées sur Supabase.
              </>
            )}
          </p>
        </div>

        {missingSupabaseConfig && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-950">
            <p className="font-semibold">Variables à ajouter sur Render</p>
            <pre className="mt-3 overflow-x-auto rounded-md bg-white p-3 text-xs text-red-950">
{`NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ta-cle-anon-ou-publishable`}
            </pre>
            <p className="mt-3 text-red-900">
              Ces variables doivent être présentes avant le build Render. Après
              les avoir ajoutées, cliquez sur Manual Deploy / Deploy latest
              commit.
            </p>
          </div>
        )}

        {!missingSupabaseConfig && userId && (
          <div className="rounded-md border border-amber-200 bg-amber-50/80 p-4 text-sm">
            <p className="font-medium text-amber-950">
              Votre identifiant pour le SQL
            </p>
            {email && (
              <p className="mt-1 text-amber-900/80">
                Compte : <span className="font-mono text-xs">{email}</span>
              </p>
            )}
            <p className="mt-2 break-all font-mono text-xs text-amber-900/90">
              {userId}
            </p>
            <button
              type="button"
              onClick={copyUid}
              className="mt-3 min-h-[40px] rounded-md border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-950 hover:bg-amber-100"
            >
              {copied ? "Copié dans le presse-papiers" : "Copier cet identifiant"}
            </button>
          </div>
        )}

        {!missingSupabaseConfig && (
          <ol className="list-inside list-decimal space-y-3 text-sm leading-relaxed text-zinc-700">
            <li>
              Ouvrez les fichiers{" "}
              <code className="rounded bg-zinc-100 px-1 text-xs">
                supabase/migrations/*.sql
              </code>
              , copiez le SQL dans l&apos;ordre numérique, collez-le dans{" "}
              <strong>Supabase - SQL Editor</strong>, puis exécutez-le.
            </li>
            <li>
              Ouvrez{" "}
              <code className="rounded bg-zinc-100 px-1 text-xs">
                supabase/setup_premier_compte.sql
              </code>
              , exécutez le <strong>BLOC B</strong> pour créer un garage, puis
              notez l&apos;id retourné.
            </li>
            <li>
              Dans le <strong>BLOC C</strong>, mettez votre identifiant comme{" "}
              <code className="text-xs">id</code>, l&apos;id du garage comme{" "}
              <code className="text-xs">garage_id</code>, puis exécutez ce bloc.
            </li>
            <li>
              Revenez ici et cliquez <strong>Réessayer</strong>.
            </li>
          </ol>
        )}

        {!missingSupabaseConfig && (
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-zinc-800">
              Vérifier dans Supabase
            </summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-md bg-zinc-900 p-3 text-xs text-zinc-100">
              {sqlCheck}
            </pre>
          </details>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              router.push(
                missingSupabaseConfig
                  ? "/configuration-requise"
                  : "/tableau-de-bord"
              )
            }
            className="min-h-[44px] rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Réessayer
          </button>
          {!missingSupabaseConfig && (
            <button
              type="button"
              disabled={loading}
              onClick={handleSignOut}
              className="min-h-[44px] rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Déconnexion..." : "Se déconnecter"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
