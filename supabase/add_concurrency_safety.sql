-- ============================================
-- GESTION DE LA CONCURRENCE ET PERFORMANCE
-- ============================================
-- Ce script améliore la sécurité transactionnelle et la performance

-- ============================================
-- 1. SÉRIALISABILITÉ : Gestion des inscriptions concurrentes
-- ============================================

-- Fonction sécurisée pour inscription avec vérification atomique
CREATE OR REPLACE FUNCTION register_to_event_safe(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_capacity INTEGER;
  v_current_count INTEGER;
  v_registration_id UUID;
BEGIN
  -- Verrouiller la ligne de l'événement (SELECT FOR UPDATE)
  -- Empêche les lectures concurrentes non-commitées (SERIALIZABLE)
  SELECT capacity, participants_count 
  INTO v_capacity, v_current_count
  FROM events
  WHERE id = p_event_id
  FOR UPDATE; -- LOCK pessimiste
  
  -- Vérifier la capacité APRÈS le lock
  IF v_capacity IS NOT NULL AND v_current_count >= v_capacity THEN
    RETURN json_build_object(
      'success', false,
      'error', 'EVENT_FULL',
      'message', 'Événement complet'
    );
  END IF;
  
  -- Vérifier si déjà inscrit
  IF EXISTS (
    SELECT 1 FROM event_registrations 
    WHERE event_id = p_event_id AND user_id = p_user_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ALREADY_REGISTERED',
      'message', 'Déjà inscrit'
    );
  END IF;
  
  -- Inscription atomique
  INSERT INTO event_registrations (event_id, user_id, created_at)
  VALUES (p_event_id, p_user_id, NOW())
  RETURNING id INTO v_registration_id;
  
  -- Le trigger increment_event_participants() se déclenche automatiquement
  
  RETURN json_build_object(
    'success', true,
    'registration_id', v_registration_id
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ALREADY_REGISTERED',
      'message', 'Déjà inscrit'
    );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER; -- S'exécute avec les droits du créateur

-- ============================================
-- 2. INDEX COMPOSITES OPTIMISÉS
-- ============================================

-- Index composite pour les requêtes fréquentes
-- Permet un Index-Only Scan (lecture sans accès à la table)
CREATE INDEX IF NOT EXISTS idx_events_search 
ON events(date, is_hidden, category) 
WHERE is_hidden = FALSE;

-- Index composite pour les inscriptions d'un user
CREATE INDEX IF NOT EXISTS idx_registrations_user_event 
ON event_registrations(user_id, event_id, created_at);

-- Index spatial pour géolocalisation
-- Version simple avec B+ (compatible partout)
DROP INDEX IF EXISTS idx_events_location;
CREATE INDEX idx_events_location 
ON events(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================
-- OPTION AVANCÉE : Index GiST avec earthdistance
-- ============================================
-- Décommenter si les extensions sont disponibles :

-- Activer les extensions nécessaires
-- CREATE EXTENSION IF NOT EXISTS cube;
-- CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Puis créer l'index GiST optimisé
-- DROP INDEX IF EXISTS idx_events_location;
-- CREATE INDEX idx_events_location 
-- ON events USING GIST (
--   ll_to_earth(latitude, longitude)
-- )
-- WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================
-- OPTION PREMIUM : PostGIS (meilleure performance)
-- ============================================
-- Décommenter pour utiliser PostGIS (Supabase Pro) :

-- CREATE EXTENSION IF NOT EXISTS postgis;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS geom GEOGRAPHY(POINT, 4326);
-- UPDATE events SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) WHERE latitude IS NOT NULL;
-- CREATE INDEX idx_events_geom ON events USING GIST(geom);

-- ============================================
-- 3. INDEX CLUSTERISÉ (tri physique)
-- ============================================

-- Le clustering nécessite un index sans WHERE clause
-- Créer un index dédié pour le clustering
CREATE INDEX IF NOT EXISTS idx_events_date_cluster 
ON events(date);

-- Organiser physiquement les events par date
-- Améliore les range scans sur date
CLUSTER events USING idx_events_date_cluster;

-- Note: Le clustering est ponctuel, pas maintenu automatiquement
-- À relancer périodiquement : CLUSTER events;

-- On peut supprimer l'index de clustering après si désiré
-- DROP INDEX IF EXISTS idx_events_date_cluster;

-- ============================================
-- 4. CONTRAINTES D'INTÉGRITÉ RENFORCÉES
-- ============================================

-- Contrainte CHECK pour éviter surréservation
ALTER TABLE events 
ADD CONSTRAINT check_participants_capacity 
CHECK (
  capacity IS NULL OR participants_count <= capacity
);

-- Contrainte sur les covoiturages
ALTER TABLE carpool_passengers 
ADD CONSTRAINT check_seats_reserved_positive 
CHECK (seats_reserved > 0);

-- ============================================
-- 5. JOURNALISATION (Write-Ahead Logging)
-- ============================================

-- PostgreSQL utilise WAL par défaut, mais on peut optimiser :

-- Vérifier le niveau de journalisation (doit être 'replica' minimum)
-- SHOW wal_level; -- Executé côté admin Supabase

-- Point-in-Time Recovery activé par défaut sur Supabase
-- Retention : 7 jours typiquement

-- ============================================
-- 6. VUES MATÉRIALISÉES pour agrégations
-- ============================================

-- Vue pré-calculée pour stats d'événements
CREATE MATERIALIZED VIEW IF NOT EXISTS event_stats AS
SELECT 
  e.id,
  e.title,
  e.date,
  e.participants_count,
  e.capacity,
  COUNT(DISTINCT c.id) as carpool_count,
  COUNT(DISTINCT cp.user_id) as carpoolers_count
FROM events e
LEFT JOIN carpools c ON c.event_id = e.id
LEFT JOIN carpool_passengers cp ON cp.carpool_id = c.id
GROUP BY e.id, e.title, e.date, e.participants_count, e.capacity;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX idx_event_stats_id ON event_stats(id);

-- Refresh manuel : REFRESH MATERIALIZED VIEW event_stats;
-- Ou automatique via cron job

-- ============================================
-- 7. VACUUM et ANALYZE automatique
-- ============================================

-- PostgreSQL a autovacuum activé par défaut
-- Mais on peut forcer l'optimisation :

-- VACUUM ANALYZE events; -- Nettoie + met à jour statistiques
-- VACUUM FULL events;    -- Récupère l'espace disque (plus lourd)

-- Stats pour l'optimiseur de requêtes
ALTER TABLE events SET (autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE event_registrations SET (autovacuum_analyze_scale_factor = 0.05);

-- ============================================
-- 8. MONITORING des performances
-- ============================================

-- Vue pour identifier les requêtes lentes
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
  calls,
  total_exec_time,
  mean_exec_time,
  query
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- > 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Note: Nécessite l'extension pg_stat_statements
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================
-- 9. POLITIQUE RLS optimisée
-- ============================================

-- Index pour les politiques RLS (auth.uid())
CREATE INDEX IF NOT EXISTS idx_events_organizer 
ON events(organizer_id) 
WHERE organizer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_user 
ON event_registrations(user_id);

-- ============================================
-- 10. NIVEAU D'ISOLATION recommandé
-- ============================================

-- Pour les inscriptions critiques, utiliser :
-- BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- ... opérations ...
-- COMMIT;

-- Ou READ COMMITTED (défaut PostgreSQL) avec SELECT FOR UPDATE

-- ============================================
-- Vérifications finales
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Fonction sécurisée register_to_event_safe créée';
  RAISE NOTICE '✅ Index composites optimisés';
  RAISE NOTICE '✅ Contraintes d''intégrité renforcées';
  RAISE NOTICE '✅ Vue matérialisée event_stats créée';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Index actuels sur events:';
END $$;

-- Lister tous les index
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'events'
ORDER BY indexname;
