-- =============================================================================
-- Garage AZ — Premier garage + lien compte (Supabase → SQL Editor)
-- =============================================================================
--
-- ORDRE OBLIGATOIRE :
--   1) D’abord exécuter UNE FOIS tout le schéma (crée les tables garages, profiles, etc.)
--   2) Ensuite exécuter CE fichier (ou les blocs ci-dessous un par un).
--
-- Le schéma complet est dans ton projet :
--   garage-az/supabase/migrations/00001_initial_schema.sql
-- → Ouvre ce fichier, copie TOUT le contenu, colle dans SQL Editor, Run.
-- → Quand c’est fait, reviens ici et exécute la section « BLOC A » puis « BLOC B ».
-- =============================================================================

-- -----------------------------------------------------------------------------
-- BLOC A — Vérification (si erreur = tu n’as pas encore exécuté la migration)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'garages'
  ) THEN
    RAISE EXCEPTION
      'Les tables n''existent pas. Étape obligatoire : dans ton dépôt, ouvre le fichier ''supabase/migrations/00001_initial_schema.sql'', copie tout le SQL dans l''éditeur Supabase, exécute-le une fois, puis relance ce script.';
  END IF;
END $$;

-- Si tu arrives ici sans erreur, la table public.garages existe. Continue avec le BLOC B.

-- -----------------------------------------------------------------------------
-- BLOC B — Créer un garage (note l’UUID affiché dans le résultat, colonne id)
-- -----------------------------------------------------------------------------
INSERT INTO public.garages (
  name,
  legal_name,
  city,
  postal_code,
  country,
  invoice_prefix
)
VALUES (
  'Mon garage',
  'AZ SARL',
  'Lausanne',
  '1000',
  'Suisse',
  'AZ'
)
RETURNING id, name;

-- -----------------------------------------------------------------------------
-- BLOC C — À exécuter SÉPARÉMENT après avoir remplacé les deux UUID
-- -----------------------------------------------------------------------------
-- 1) Récupère ton User UID : Authentication → Users → ton compte.
-- 2) Récupère le garage_id : résultat du RETURNING ci-dessus (colonne id).
-- 3) Décommente les 4 lignes suivantes, remplace les UUID, puis Run sur ce bloc seul.

/*
INSERT INTO public.profiles (id, garage_id, full_name, role)
VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- ton UUID utilisateur (auth.users)
  'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',  -- UUID du garage (RETURNING id)
  'Mon nom',
  'administrateur'
)
ON CONFLICT (id) DO UPDATE SET
  garage_id = EXCLUDED.garage_id,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;
*/

-- Après le BLOC C : sur le site, clique « Réessayer » ou reconnecte-toi.
