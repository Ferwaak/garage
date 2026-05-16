"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ConfigurationRequisePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
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
  }, []);

  async function copyUid() {
    if (!userId) return;
    await navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/connexion");
  }

  const sqlCheck = `-- À coller dans Supabase → SQL Editor → Run
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'garages'
) AS tables_creees;

SELECT id AS user_id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
SELECT * FROM public.profiles;
SELECT id, name FROM public.garages;`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-zinc-50">
      <div className="w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Compte non configuré</h1>
          <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
            Vous êtes connecté, mais l’application ne trouve pas de{" "}
            <strong>garage lié à votre utilisateur</strong>. Il manque une ligne dans la
            table <code className="text-xs bg-zinc-100 px-1 rounded">profiles</code>, ou les
            tables n’ont pas encore été créées sur Supabase.
          </p>
        </div>

        {userId && (
          <div className="rounded-md border border-amber-200 bg-amber-50/80 p-4 text-sm">
            <p className="font-medium text-amber-950">Votre identifiant (pour le SQL)</p>
            {email && (
              <p className="mt-1 text-amber-900/80">
                Compte : <span className="font-mono text-xs">{email}</span>
              </p>
            )}
            <p className="mt-2 text-xs text-amber-900/90 break-all font-mono">{userId}</p>
            <button
              type="button"
              onClick={copyUid}
              className="mt-3 rounded-md border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-950 hover:bg-amber-100 min-h-[40px]"
            >
              {copied ? "Copié dans le presse-papiers" : "Copier cet identifiant"}
            </button>
          </div>
        )}

        <ol className="list-decimal list-inside space-y-3 text-sm text-zinc-700 leading-relaxed">
          <li>
            Dans ton projet Cursor, ouvre{" "}
            <code className="text-xs bg-zinc-100 px-1 rounded">
              supabase/migrations/00001_initial_schema.sql
            </code>
            , copie <strong>tout</strong> le SQL, colle-le dans{" "}
            <strong>Supabase → SQL Editor</strong>, exécute-le <strong>une fois</strong> (sans
            erreur).
          </li>
          <li>
            Ouvre{" "}
            <code className="text-xs bg-zinc-100 px-1 rounded">
              supabase/setup_premier_compte.sql
            </code>
            : exécute le <strong>BLOC B</strong> pour créer un garage, note l’{" "}
            <strong>id</strong> retourné.
          </li>
          <li>
            Dans le <strong>BLOC C</strong>, décommente l’<code className="text-xs">INSERT</code>,
            mets ton identifiant ci-dessus comme <code className="text-xs">id</code>, l’id du
            garage comme <code className="text-xs">garage_id</code>, puis exécute ce bloc.
          </li>
          <li>
            Reviens ici et clique <strong>Réessayer</strong>.
          </li>
        </ol>

        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-zinc-800">
            Vérifier dans Supabase (SQL)
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-md bg-zinc-900 text-zinc-100 p-3 text-xs whitespace-pre-wrap">
            {sqlCheck}
          </pre>
        </details>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/tableau-de-bord")}
            className="rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 min-h-[44px]"
          >
            Réessayer
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSignOut}
            className="rounded-md bg-zinc-900 text-white px-4 py-3 text-sm font-medium min-h-[44px] hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Déconnexion…" : "Se déconnecter"}
          </button>
        </div>
      </div>
    </div>
  );
}
