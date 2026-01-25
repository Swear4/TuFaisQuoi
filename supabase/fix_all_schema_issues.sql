-- Migration complète : Ajout des colonnes manquantes et correction du schéma
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne participants_count si elle n'existe pas
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS participants_count INTEGER DEFAULT 0 NOT NULL;

-- 1b. Ajouter les colonnes GPS pour les coordonnées précises
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 1c. Ajouter la colonne is_hidden pour masquer temporairement un événement
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE NOT NULL;

-- Index spatial pour les recherches géographiques
CREATE INDEX IF NOT EXISTS idx_events_location ON events(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Index pour les événements masqués
CREATE INDEX IF NOT EXISTS idx_events_hidden ON events(is_hidden) WHERE is_hidden = FALSE;

-- 2. Modifier capacity pour autoriser NULL (optionnel)
ALTER TABLE events 
ALTER COLUMN capacity DROP NOT NULL,
ALTER COLUMN capacity DROP DEFAULT;

-- 3. Supprimer l'ancienne colonne attendees si elle existe
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'attendees') THEN
    ALTER TABLE events DROP COLUMN attendees;
  END IF;
END $$;

-- 4. Ajouter created_at aux tables d'inscriptions si manquant
ALTER TABLE event_registrations 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Créer la table carpool_passengers si elle n'existe pas
CREATE TABLE IF NOT EXISTS carpool_passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carpool_id UUID REFERENCES carpools(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  seats_reserved INTEGER DEFAULT 1 NOT NULL CHECK (seats_reserved > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(carpool_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_carpool_passengers_carpool ON carpool_passengers(carpool_id);
CREATE INDEX IF NOT EXISTS idx_carpool_passengers_user ON carpool_passengers(user_id);

-- 5. Mettre à jour les valeurs existantes du compteur de participants
UPDATE events 
SET participants_count = (
  SELECT COUNT(*) 
  FROM event_registrations 
  WHERE event_registrations.event_id = events.id
)
WHERE participants_count = 0;

-- 6. Créer les fonctions pour les triggers automatiques
CREATE OR REPLACE FUNCTION increment_event_participants()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events
  SET participants_count = participants_count + 1
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_event_participants()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events
  SET participants_count = GREATEST(0, participants_count - 1)
  WHERE id = OLD.event_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 7. Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS trigger_increment_participants ON event_registrations;
DROP TRIGGER IF EXISTS trigger_decrement_participants ON event_registrations;

-- 8. Créer les nouveaux triggers
CREATE TRIGGER trigger_increment_participants
  AFTER INSERT ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION increment_event_participants();

CREATE TRIGGER trigger_decrement_participants
  AFTER DELETE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION decrement_event_participants();

-- 9. Ajouter les index pour performance
CREATE INDEX IF NOT EXISTS idx_events_participants_count ON events(participants_count);
CREATE INDEX IF NOT EXISTS idx_event_registrations_created_at ON event_registrations(created_at);

-- 10. Commentaires pour documentation
COMMENT ON COLUMN events.participants_count IS 'Nombre de participants inscrits (mis à jour automatiquement)';
COMMENT ON COLUMN events.latitude IS 'Latitude GPS de l''événement (géocodé depuis l''adresse)';
COMMENT ON COLUMN events.longitude IS 'Longitude GPS de l''événement (géocodé depuis l''adresse)';
COMMENT ON COLUMN events.is_hidden IS 'Événement masqué temporairement par l''organisateur (non visible dans les listes publiques)';
COMMENT ON COLUMN event_registrations.created_at IS 'Date d''inscription à l''événement';

-- 11. Vérification finale
DO $$ 
BEGIN
  RAISE NOTICE 'Migration terminée avec succès!';
  RAISE NOTICE 'Colonne participants_count: %', (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'participants_count');
  RAISE NOTICE 'Triggers créés: %', (SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE '%participants%');
END $$;
