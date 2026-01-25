-- Ajout de la colonne participants_count à la table events
-- Cette colonne permet de suivre le nombre de participants inscrits

-- Ajouter la colonne si elle n'existe pas déjà
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS participants_count INTEGER DEFAULT 0 NOT NULL;

-- Mettre à jour les valeurs existantes en comptant les inscriptions
UPDATE events 
SET participants_count = (
  SELECT COUNT(*) 
  FROM event_registrations 
  WHERE event_registrations.event_id = events.id
);

-- Créer un trigger pour mettre à jour automatiquement le compteur
-- lors de l'ajout ou suppression d'une inscription

-- Fonction pour incrémenter le compteur
CREATE OR REPLACE FUNCTION increment_event_participants()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events
  SET participants_count = participants_count + 1
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour décrémenter le compteur
CREATE OR REPLACE FUNCTION decrement_event_participants()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events
  SET participants_count = GREATEST(0, participants_count - 1)
  WHERE id = OLD.event_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS trigger_increment_participants ON event_registrations;
DROP TRIGGER IF EXISTS trigger_decrement_participants ON event_registrations;

-- Créer les triggers
CREATE TRIGGER trigger_increment_participants
  AFTER INSERT ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION increment_event_participants();

CREATE TRIGGER trigger_decrement_participants
  AFTER DELETE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION decrement_event_participants();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_events_participants_count ON events(participants_count);

-- Commentaires pour la documentation
COMMENT ON COLUMN events.participants_count IS 'Nombre de participants inscrits à l''événement, mis à jour automatiquement';
