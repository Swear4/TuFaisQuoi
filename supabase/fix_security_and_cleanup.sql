-- ============================================
-- SÉCURITÉ RLS ET NETTOYAGE DE LA BASE
-- ============================================
-- Ce script corrige les problèmes de sécurité et nettoie les tables obsolètes

-- ============================================
-- 1. AJOUTER RLS SUR carpool_passengers (CRITIQUE)
-- ============================================

-- Activer RLS sur carpool_passengers
ALTER TABLE carpool_passengers ENABLE ROW LEVEL SECURITY;

-- Policy : Tout le monde peut voir les passagers des covoiturages publics
CREATE POLICY "Anyone can view carpool passengers"
ON carpool_passengers FOR SELECT
USING (true);

-- Policy : Les conducteurs peuvent voir tous les passagers de leurs covoiturages
CREATE POLICY "Drivers can view all passengers in their carpools"
ON carpool_passengers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM carpools
    WHERE carpools.id = carpool_passengers.carpool_id
    AND carpools.driver_id = auth.uid()
  )
);

-- Policy : Les users peuvent s'ajouter comme passagers
CREATE POLICY "Users can join carpools as passengers"
ON carpool_passengers FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy : Les users peuvent se retirer d'un covoiturage
CREATE POLICY "Users can leave carpools"
ON carpool_passengers FOR DELETE
USING (auth.uid() = user_id);

-- Policy : Les conducteurs peuvent retirer des passagers de leurs covoiturages
CREATE POLICY "Drivers can remove passengers from their carpools"
ON carpool_passengers FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM carpools
    WHERE carpools.id = carpool_passengers.carpool_id
    AND carpools.driver_id = auth.uid()
  )
);

-- ============================================
-- 2. SUPPRIMER LA TABLE before_after (obsolète)
-- ============================================

-- Supprimer la table si elle existe
DROP TABLE IF EXISTS before_after CASCADE;

-- ============================================
-- 3. NETTOYER LES VUES INUTILISÉES (optionnel)
-- ============================================

-- Supprimer la vue matérialisée event_stats si non utilisée
-- DÉCOMMENTER SI TU NE L'UTILISES PAS :
-- DROP MATERIALIZED VIEW IF EXISTS event_stats CASCADE;

-- Supprimer la vue slow_queries si non utilisée
-- DÉCOMMENTER SI TU NE L'UTILISES PAS :
-- DROP VIEW IF EXISTS slow_queries CASCADE;

-- ============================================
-- 4. VÉRIFIER LES COLONNES DES TABLES
-- ============================================

-- Vérifier si la colonne 'attendees' existe dans events
-- Si elle existe, la renommer en 'participants_count'
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'attendees'
  ) THEN
    -- Renommer la colonne si elle existe
    ALTER TABLE events RENAME COLUMN attendees TO participants_count;
    RAISE NOTICE '✅ Colonne "attendees" renommée en "participants_count"';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne "attendees" n''existe pas (déjà nommée participants_count)';
  END IF;
END $$;

-- ============================================
-- 5. VÉRIFICATIONS FINALES
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SÉCURITÉ ET NETTOYAGE TERMINÉS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RLS activé sur carpool_passengers';
  RAISE NOTICE '✅ Politiques de sécurité créées';
  RAISE NOTICE '✅ Table before_after supprimée';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables avec RLS actif:';
END $$;

-- Lister toutes les tables avec RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;
