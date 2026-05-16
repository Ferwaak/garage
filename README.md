# Logiciel Garage

Application web Next.js 16 pour la gestion d'un garage automobile : vehicules, ventes, clients, factures PDF, QR IBAN, statistiques et parametres du garage.

## Stack

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS 4
- Supabase Auth, Postgres et Storage
- Render pour le deploiement web

## Installation locale

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000`.

Variables requises :

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Supabase

Executer les migrations SQL dans `supabase/migrations/` sur le projet Supabase utilise par l'application.
La migration `00003_explicit_data_api_grants.sql` est requise sur les projets Supabase recents : les policies RLS ne suffisent pas si les privileges Data API n'ont pas ete accordes au role `authenticated`.

Buckets Storage utilises :

- `vehicle-photos`
- `vehicle-documents`
- `invoices`
- `garage-logos`

Les fichiers `.env*` restent ignores par Git, sauf `.env.local.example`.
Ne forcez pas `.env.local` dans GitHub : utilisez `.env.local.example` comme modele local et les variables d'environnement Render pour la production.

## Deploiement Render

Ce repo contient `render.yaml`.

Sur Render, choisir :

- **New Web Service**
- Runtime : Node
- Build command : `npm ci && npm run build`
- Start command : `npm run start:render`

Ajouter ces variables d'environnement dans Render :

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Utilisez une cle `sb_publishable_...` ou la cle legacy `anon`, jamais une cle `sb_secret_...` ou `service_role`. Ces variables doivent etre presentes pendant le build Render. L'application injecte aussi leur valeur au runtime pour eviter qu'un ancien build garde une configuration navigateur vide.

L'application demarre avec `next start -H 0.0.0.0` et utilise automatiquement le port fourni par Render via `$PORT`.

## Commandes utiles

```bash
npm run lint
npm run build
npm run start:render
```

## Securite

Ne jamais commit de cle `service_role`, mot de passe Postgres, ou fichier `.env.local`.
