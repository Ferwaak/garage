# Références projet Supabase (public)

| Élément | Valeur |
|--------|--------|
| **Référence projet** | `qecxdcmqvmhkpkbemccx` |
| **URL API** | `https://qecxdcmqvmhkpkbemccx.supabase.co` |
| **Hôte Postgres** | `db.qecxdcmqvmhkpkbemccx.supabase.co` |
| **Port** | `5432` |
| **Utilisateur** | `postgres` |
| **Base** | `postgres` |

Chaîne de connexion (mot de passe **uniquement** dans un fichier local non versionné, ex. `supabase/.env` créé par vous) :

```text
postgresql://postgres:VOTRE_MOT_DE_PASSE@db.qecxdcmqvmhkpkbemccx.supabase.co:5432/postgres
```

## Schéma applicatif

Le SQL complet (tables, RLS, Storage, RPC numéros de facture) est dans :

`migrations/00001_initial_schema.sql`

Après `supabase login` :

```bash
supabase link --project-ref qecxdcmqvmhkpkbemccx
```

(le CLI demande le mot de passe base ; ne le mettez pas dans le dépôt Git)

Pousser les migrations vers le projet distant :

```bash
supabase db push
```
