-- Correction des politiques RLS pour permettre l'inscription
-- À exécuter dans le SQL Editor de Supabase

-- Supprimer l'ancienne politique INSERT si elle existe
DROP POLICY IF EXISTS "Users peuvent s'inscrire" ON public.users;

-- Ajouter la politique pour permettre l'insertion lors de l'inscription
CREATE POLICY "Users peuvent s'inscrire" ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Vérifier que la politique UPDATE existe
DROP POLICY IF EXISTS "Users peuvent modifier leur profil" ON public.users;
CREATE POLICY "Users peuvent modifier leur profil" ON public.users FOR UPDATE 
  USING (auth.uid() = id);
