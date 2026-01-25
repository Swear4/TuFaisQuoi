-- ============================================
-- SYSTÈME DE FAVORIS
-- ============================================
-- Permet aux utilisateurs de sauvegarder leurs événements préférés

-- Table des favoris
CREATE TABLE IF NOT EXISTS event_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Un user ne peut pas mettre 2 fois le même event en favori
  UNIQUE(user_id, event_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_favorites_user ON event_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_event ON event_favorites(event_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON event_favorites(created_at);

-- Colonne compteur de favoris sur events (dénormalisé pour performance)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0 NOT NULL;

-- Index sur le compteur
CREATE INDEX IF NOT EXISTS idx_events_favorites_count ON events(favorites_count);

-- Trigger pour incrémenter le compteur
CREATE OR REPLACE FUNCTION increment_event_favorites()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events
  SET favorites_count = favorites_count + 1
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour décrémenter le compteur
CREATE OR REPLACE FUNCTION decrement_event_favorites()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events
  SET favorites_count = GREATEST(0, favorites_count - 1)
  WHERE id = OLD.event_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers
DROP TRIGGER IF EXISTS trigger_increment_favorites ON event_favorites;
CREATE TRIGGER trigger_increment_favorites
  AFTER INSERT ON event_favorites
  FOR EACH ROW
  EXECUTE FUNCTION increment_event_favorites();

DROP TRIGGER IF EXISTS trigger_decrement_favorites ON event_favorites;
CREATE TRIGGER trigger_decrement_favorites
  AFTER DELETE ON event_favorites
  FOR EACH ROW
  EXECUTE FUNCTION decrement_event_favorites();

-- RPC pour ajouter/supprimer favori (toggle)
CREATE OR REPLACE FUNCTION toggle_event_favorite(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_favorite_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Vérifier si déjà en favori
  SELECT id INTO v_favorite_id
  FROM event_favorites
  WHERE event_id = p_event_id AND user_id = p_user_id;
  
  v_exists := FOUND;
  
  IF v_exists THEN
    -- Supprimer des favoris
    DELETE FROM event_favorites
    WHERE id = v_favorite_id;
    
    RETURN json_build_object(
      'success', true,
      'is_favorite', false,
      'message', 'Retiré des favoris'
    );
  ELSE
    -- Ajouter aux favoris
    INSERT INTO event_favorites (event_id, user_id)
    VALUES (p_event_id, p_user_id)
    RETURNING id INTO v_favorite_id;
    
    RETURN json_build_object(
      'success', true,
      'is_favorite', true,
      'favorite_id', v_favorite_id,
      'message', 'Ajouté aux favoris'
    );
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INTERNAL_ERROR',
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Initialiser le compteur pour les events existants
UPDATE events 
SET favorites_count = (
  SELECT COUNT(*) 
  FROM event_favorites 
  WHERE event_favorites.event_id = events.id
)
WHERE favorites_count = 0;

-- RLS (Row Level Security) pour event_favorites
ALTER TABLE event_favorites ENABLE ROW LEVEL SECURITY;

-- Policy : Les users peuvent voir leurs propres favoris
CREATE POLICY "Users can view their own favorites"
ON event_favorites FOR SELECT
USING (auth.uid() = user_id);

-- Policy : Les users peuvent ajouter leurs favoris
CREATE POLICY "Users can insert their own favorites"
ON event_favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy : Les users peuvent supprimer leurs favoris
CREATE POLICY "Users can delete their own favorites"
ON event_favorites FOR DELETE
USING (auth.uid() = user_id);

-- Vérifications
DO $$ 
BEGIN
  RAISE NOTICE '✅ Table event_favorites créée';
  RAISE NOTICE '✅ Triggers de compteur configurés';
  RAISE NOTICE '✅ Fonction toggle_event_favorite créée';
  RAISE NOTICE '✅ Politiques RLS configurées';
END $$;
