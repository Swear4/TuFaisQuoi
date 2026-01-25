-- ============================================
-- SCHEMA TUFAISQUOI - Base de données optimisée
-- ============================================

-- 1. TABLE USERS (Utilisateurs)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'premium', 'premium_plus')),
  is_professional BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par email
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON public.users(subscription_type) WHERE subscription_type != 'free';

-- 2. TABLE EVENTS (Événements)
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('culturel', 'concert', 'sport', 'nature', 'gastronomie', 'festival', 'nocturne', 'famille', 'bien-etre', 'shopping')),
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  attendees INTEGER DEFAULT 0 CHECK (attendees >= 0 AND attendees <= capacity),
  image_url TEXT,
  is_premium_only BOOLEAN DEFAULT false,
  organizer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index couvrant CRITIQUE pour performance (category + date)
CREATE INDEX IF NOT EXISTS idx_events_category_date ON public.events(category, date DESC) 
  INCLUDE (title, location, capacity, attendees, image_url, is_premium_only);

-- Index sur date pour tri rapide
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date DESC);

-- Index GIN pour recherche full-text
CREATE INDEX IF NOT EXISTS idx_events_search ON public.events 
  USING GIN (to_tsvector('french', title || ' ' || COALESCE(description, '')));

-- Index pour événements d'un organisateur
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id, date DESC);

-- 3. TABLE CARPOOLS (Covoiturages)
-- ============================================
CREATE TABLE IF NOT EXISTS public.carpools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  departure_location TEXT NOT NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  available_seats INTEGER NOT NULL CHECK (available_seats > 0),
  price_per_seat DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour covoiturages d'un événement
CREATE INDEX IF NOT EXISTS idx_carpools_event ON public.carpools(event_id, departure_time);

-- 4. TABLE BEFORE_AFTER (Groupes Before/After)
-- ============================================
CREATE TABLE IF NOT EXISTS public.before_after (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('before', 'after')),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  time TIMESTAMPTZ NOT NULL,
  max_participants INTEGER DEFAULT 15,
  current_participants INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour before/after d'un événement
CREATE INDEX IF NOT EXISTS idx_before_after_event ON public.before_after(event_id, type);

-- 5. TABLE TRIPS (Voyages organisés)
-- ============================================
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration TEXT NOT NULL, -- ex: "2 jours / 1 nuit"
  image_url TEXT,
  min_price DECIMAL(10,2) NOT NULL,
  max_price DECIMAL(10,2) NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.users(id), -- Admin qui a créé
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour voyages publiés et à venir
CREATE INDEX IF NOT EXISTS idx_trips_published ON public.trips(start_date) 
  WHERE is_published = true;

-- 6. TABLE TRIP_OPTIONS (Options de billets pour voyages)
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Éco", "Flex", "Standard", "VIP"
  price DECIMAL(10,2) NOT NULL,
  features JSONB NOT NULL, -- ["AirBnB simple", "Liberté sur place"]
  available_spots INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour options d'un voyage
CREATE INDEX IF NOT EXISTS idx_trip_options_trip ON public.trip_options(trip_id);

-- 7. TABLE EVENT_REGISTRATIONS (Inscriptions aux événements)
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  carpool_id UUID REFERENCES public.carpools(id) ON DELETE SET NULL,
  before_after_id UUID REFERENCES public.before_after(id) ON DELETE SET NULL,
  ticket_type TEXT DEFAULT 'standard',
  is_refundable BOOLEAN DEFAULT true,
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id) -- Un user ne peut s'inscrire qu'une fois par événement
);

-- Index pour inscriptions d'un user
CREATE INDEX IF NOT EXISTS idx_registrations_user ON public.event_registrations(user_id, registration_date DESC);

-- 8. TABLE TRIP_BOOKINGS (Réservations de voyages)
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  option_id UUID REFERENCES public.trip_options(id) ON DELETE CASCADE,
  booking_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  UNIQUE(trip_id, user_id) -- Un user ne peut réserver qu'une fois par voyage
);

-- Index pour réservations d'un user
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.trip_bookings(user_id, booking_date DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - SÉCURITÉ
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carpools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.before_after ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_bookings ENABLE ROW LEVEL SECURITY;

-- POLICIES USERS
CREATE POLICY "Users visibles par tous" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users peuvent s'inscrire" ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users peuvent modifier leur profil" ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- POLICIES EVENTS
CREATE POLICY "Événements non-premium visibles par tous" ON public.events FOR SELECT 
  USING (is_premium_only = false OR auth.uid() IN (
    SELECT id FROM public.users WHERE subscription_type IN ('premium', 'premium_plus')
  ));

CREATE POLICY "Organisateurs peuvent créer événements" ON public.events FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organisateurs peuvent modifier leurs événements" ON public.events FOR UPDATE
  USING (auth.uid() = organizer_id);

CREATE POLICY "Organisateurs peuvent supprimer leurs événements" ON public.events FOR DELETE
  USING (auth.uid() = organizer_id);

-- POLICIES CARPOOLS
CREATE POLICY "Covoiturages visibles par tous" ON public.carpools FOR SELECT USING (true);
CREATE POLICY "Users peuvent créer covoiturages" ON public.carpools FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

-- POLICIES BEFORE_AFTER
CREATE POLICY "Before/After visibles par Premium+ uniquement" ON public.before_after FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM public.users WHERE subscription_type = 'premium_plus'
  ));

-- POLICIES TRIPS
CREATE POLICY "Voyages publiés visibles par tous" ON public.trips FOR SELECT
  USING (is_published = true);

CREATE POLICY "Options de voyage visibles par tous" ON public.trip_options FOR SELECT USING (true);

-- POLICIES REGISTRATIONS
CREATE POLICY "Users voient leurs inscriptions" ON public.event_registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users peuvent s'inscrire" ON public.event_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- POLICIES BOOKINGS
CREATE POLICY "Users voient leurs réservations" ON public.trip_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users peuvent réserver" ON public.trip_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TRIGGERS AUTO-UPDATE
-- ============================================

-- Fonction pour auto-update du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur users
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger sur events
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger sur trips
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FIN DU SCHEMA
-- ============================================
