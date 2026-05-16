-- Exemple : deux garages AZ (exécuter après 00001_initial_schema.sql)
-- Remplacez les UUID par vos identifiants réels.

-- INSERT INTO public.garages (id, name, legal_name, city, invoice_prefix)
-- VALUES
--   ('11111111-1111-1111-1111-111111111111', 'Garage Centre', 'AZ SARL', 'Lausanne', 'AZ'),
--   ('22222222-2222-2222-2222-222222222222', 'Garage Nord', 'AZ SARL', 'Genève', 'AZ');

-- Après création des utilisateurs dans Authentication > Users :
-- INSERT INTO public.profiles (id, garage_id, full_name, role) VALUES
--   ('<uuid-user-garage-centre>', '11111111-1111-1111-1111-111111111111', 'Compte Garage Centre', 'administrateur'),
--   ('<uuid-user-garage-nord>', '22222222-2222-2222-2222-222222222222', 'Compte Garage Nord', 'administrateur');
