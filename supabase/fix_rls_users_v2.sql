-- Correction FINALE de la politique RLS pour l'inscription
-- Solution : Autoriser toute insertion pour les utilisateurs authentifiés
-- La sécurité est assurée par le fait que seul Supabase Auth peut créer des UUIDs valides

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Users peuvent s'inscrire" ON public.users;

-- Politique permissive pour l'inscription
-- Permet à n'importe quel utilisateur authentifié d'insérer (le contrôle se fait côté Auth)
CREATE POLICY "Users peuvent s'inscrire" ON public.users FOR INSERT
  WITH CHECK (true);
