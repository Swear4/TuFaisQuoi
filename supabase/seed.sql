-- ============================================
-- SEED DATA - Données de test TuFaisQuoi
-- ============================================

-- 1. Créer des utilisateurs test
-- ============================================
INSERT INTO public.users (id, email, name, avatar_url, subscription_type, is_professional, is_verified) VALUES
  ('11111111-1111-1111-1111-111111111111', 'marie.dupont@example.com', 'Marie Dupont', 'https://i.pravatar.cc/150?img=1', 'free', false, true),
  ('22222222-2222-2222-2222-222222222222', 'thomas.martin@example.com', 'Thomas Martin', 'https://i.pravatar.cc/150?img=12', 'premium', false, true),
  ('33333333-3333-3333-3333-333333333333', 'julie.bernard@example.com', 'Julie Bernard', 'https://i.pravatar.cc/150?img=5', 'premium_plus', false, true),
  ('44444444-4444-4444-4444-444444444444', 'lucas.petit@example.com', 'Lucas Petit', 'https://i.pravatar.cc/150?img=15', 'free', false, true),
  ('55555555-5555-5555-5555-555555555555', 'emma.dubois@example.com', 'Emma Dubois', 'https://i.pravatar.cc/150?img=9', 'premium', true, true);

-- 2. Créer des événements
-- ============================================
INSERT INTO public.events (id, title, description, date, location, category, capacity, attendees, image_url, is_premium_only, organizer_id) VALUES
  -- Événements à venir (Décembre 2025 - Janvier 2026)
  ('e1111111-1111-1111-1111-111111111111', 
   'Festival des Lumières de Nantes', 
   'Un spectacle magique de projections lumineuses sur les monuments historiques de Nantes. Venez découvrir des installations artistiques uniques et une ambiance féerique.',
   '2025-12-15 19:00:00+01', 
   'Centre-ville de Nantes', 
   'festival', 
   500, 
   245,
   'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
   false,
   '55555555-5555-5555-5555-555555555555'),

  ('e2222222-2222-2222-2222-222222222222', 
   'Concert Jazz au Café Cult', 
   'Soirée jazz intime avec le quintet local "Les Notes Bleues". Ambiance cosy, cocktails artisanaux et musique live.',
   '2025-12-18 20:30:00+01', 
   'Le Café Cult, Pornic', 
   'concert', 
   80, 
   52,
   'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
   false,
   '22222222-2222-2222-2222-222222222222'),

  ('e3333333-3333-3333-3333-333333333333', 
   'Randonnée Côtière au Croisic', 
   'Découverte des sentiers côtiers du Croisic. 12km de marche avec vue sur l''océan. Niveau intermédiaire. Pique-nique prévu à mi-parcours.',
   '2025-12-21 09:00:00+01', 
   'Le Croisic, départ parking de la Criée', 
   'nature', 
   25, 
   18,
   'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
   false,
   '11111111-1111-1111-1111-111111111111'),

  ('e4444444-4444-4444-4444-444444444444', 
   'Marché de Noël Premium', 
   'Marché de Noël exclusif avec artisans locaux, dégustation de vins et produits du terroir. Accès réservé aux membres Premium.',
   '2025-12-22 14:00:00+01', 
   'Pornichet, Place du Marché', 
   'gastronomie', 
   100, 
   45,
   'https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=800',
   true,
   '55555555-5555-5555-5555-555555555555'),

  ('e5555555-5555-5555-5555-555555555555', 
   'Atelier Yoga sur la Plage', 
   'Séance de yoga au lever du soleil sur la plage de La Baule. Tous niveaux acceptés. Tapis fourni.',
   '2025-12-28 07:30:00+01', 
   'Plage de La Baule, poste de secours n°5', 
   'bien-etre', 
   30, 
   22,
   'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
   false,
   '33333333-3333-3333-3333-333333333333'),

  ('e6666666-6666-6666-6666-666666666666', 
   'Nouvel An à Saint-Nazaire', 
   'Soirée du réveillon avec DJ, food trucks et feu d''artifice sur le port. Ambiance festive garantie !',
   '2025-12-31 21:00:00+01', 
   'Port de Saint-Nazaire', 
   'nocturne', 
   800, 
   456,
   'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800',
   false,
   '55555555-5555-5555-5555-555555555555'),

  ('e7777777-7777-7777-7777-777777777777', 
   'Visite du Château des Ducs', 
   'Visite guidée du Château des Ducs de Bretagne avec accès aux expositions temporaires. Durée : 2h.',
   '2026-01-05 14:30:00+01', 
   'Château des Ducs, Nantes', 
   'culturel', 
   40, 
   28,
   'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800',
   false,
   '22222222-2222-2222-2222-222222222222'),

  ('e8888888-8888-8888-8888-888888888888', 
   'Match FC Nantes vs Lens', 
   'Championnat de Ligue 1 - Venez supporter les Canaris ! Places tribune Loire disponibles.',
   '2026-01-12 17:00:00+01', 
   'Stade de la Beaujoire, Nantes', 
   'sport', 
   35000, 
   28450,
   'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800',
   false,
   '44444444-4444-4444-4444-444444444444');

-- 3. Créer des voyages
-- ============================================
INSERT INTO public.trips (id, title, description, location, start_date, end_date, duration, image_url, min_price, max_price, is_published, created_by) VALUES
  ('a1111111-1111-1111-1111-111111111111',
   'Week-end à Paris',
   'Découvrez les monuments emblématiques de la capitale : Tour Eiffel, Louvre, Montmartre. Hébergement en centre-ville avec petit-déjeuner inclus.',
   'Paris, France',
   '2026-02-14',
   '2026-02-16',
   '3 jours / 2 nuits',
   'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
   89.00,
   349.00,
   true,
   '55555555-5555-5555-5555-555555555555'),

  ('a2222222-2222-2222-2222-222222222222',
   'Ski à Chamonix',
   'Séjour au pied du Mont-Blanc avec forfait remontées mécaniques inclus. Ski, snowboard et détente au spa.',
   'Chamonix, Haute-Savoie',
   '2026-03-07',
   '2026-03-14',
   '7 jours / 6 nuits',
   'https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=800',
   299.00,
   899.00,
   true,
   '55555555-5555-5555-5555-555555555555'),

  ('a3333333-3333-3333-3333-333333333333',
   'Escapade à Bordeaux',
   'Dégustation de vins dans les châteaux du Médoc, visite de la Cité du Vin et découverte du centre historique.',
   'Bordeaux et région viticole',
   '2026-04-18',
   '2026-04-20',
   '3 jours / 2 nuits',
   'https://images.unsplash.com/photo-1520471946988-d01ea8d85f59?w=800',
   129.00,
   499.00,
   true,
   '55555555-5555-5555-5555-555555555555');

-- 4. Créer les options pour chaque voyage
-- ============================================

-- Options pour Paris
INSERT INTO public.trip_options (trip_id, name, price, features, available_spots) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Éco', 89.00, '["Auberge de jeunesse", "Transport en bus", "Petit-déjeuner"]', 20),
  ('a1111111-1111-1111-1111-111111111111', 'Standard', 179.00, '["Hôtel 3* centre-ville", "Train 2de classe", "Petit-déjeuner", "Visite guidée"]', 15),
  ('a1111111-1111-1111-1111-111111111111', 'Flex', 249.00, '["Hôtel 4* avec vue", "Train 1ère classe", "Demi-pension", "2 visites guidées", "Annulation gratuite"]', 10),
  ('a1111111-1111-1111-1111-111111111111', 'VIP', 349.00, '["Hôtel 5* luxe", "TGV 1ère classe", "Pension complète", "Toutes visites incluses", "Annulation gratuite", "Transferts privés"]', 5);

-- Options pour Chamonix
INSERT INTO public.trip_options (trip_id, name, price, features, available_spots) VALUES
  ('a2222222-2222-2222-2222-222222222222', 'Éco', 299.00, '["Appartement partagé", "Forfait ski 3 jours", "Location matériel"]', 12),
  ('a2222222-2222-2222-2222-222222222222', 'Standard', 549.00, '["Studio privé", "Forfait ski 6 jours", "Location matériel", "Cours de ski 2h"]', 10),
  ('a2222222-2222-2222-2222-222222222222', 'Flex', 749.00, '["Chalet confort", "Forfait ski illimité", "Matériel premium", "3 cours de ski", "Accès spa", "Annulation gratuite"]', 8),
  ('a2222222-2222-2222-2222-222222222222', 'VIP', 899.00, '["Chalet de luxe", "Forfait illimité", "Matériel haut de gamme", "Moniteur privé", "Spa illimité", "Restaurant gastronomique", "Annulation gratuite"]', 4);

-- Options pour Bordeaux
INSERT INTO public.trip_options (trip_id, name, price, features, available_spots) VALUES
  ('a3333333-3333-3333-3333-333333333333', 'Éco', 129.00, '["Hôtel simple", "1 dégustation", "Transport en bus"]', 18),
  ('a3333333-3333-3333-3333-333333333333', 'Standard', 279.00, '["Hôtel 3* centre", "3 dégustations", "Visite Cité du Vin", "Train"]', 12),
  ('a3333333-3333-3333-3333-333333333333', 'Flex', 389.00, '["Hôtel de charme", "5 châteaux", "Cité du Vin", "Dîner gastronomique", "Train 1ère", "Annulation gratuite"]', 8),
  ('a3333333-3333-3333-3333-333333333333', 'VIP', 499.00, '["Château-hôtel 5*", "Dégustations illimitées", "Chef sommelier privé", "Repas étoilés Michelin", "Annulation gratuite", "Transfert privé"]', 4);

-- 5. Créer quelques covoiturages
-- ============================================
INSERT INTO public.carpools (event_id, driver_id, departure_location, departure_time, available_seats, price_per_seat) VALUES
  ('e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Pornic, Place de la Gare', '2025-12-15 17:30:00+01', 3, 5.00),
  ('e3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'La Baule, Parking Leclerc', '2025-12-21 08:15:00+01', 4, 3.00),
  ('e6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Nantes, Gare Nord', '2025-12-31 19:30:00+01', 2, 8.00);

-- 6. Créer des groupes Before/After
-- ============================================
INSERT INTO public.before_after (event_id, type, title, description, location, time, max_participants, current_participants) VALUES
  ('e2222222-2222-2222-2222-222222222222', 'before', 'Apéro avant le concert', 'Rendez-vous pour un verre avant le concert. On se retrouve au bar d''en face !', 'Le Comptoir, Pornic', '2025-12-18 19:00:00+01', 15, 8),
  ('e6666666-6666-6666-6666-666666666666', 'after', 'After du Nouvel An', 'Prolongez la soirée dans un club privé avec DJ jusqu''à 6h du matin. Entrée réservée aux membres Premium+.', 'Club Privé, Saint-Nazaire', '2026-01-01 02:00:00+01', 50, 23),
  ('e7777777-7777-7777-7777-777777777777', 'after', 'Café culturel', 'Discussion autour de l''histoire du château dans un salon de thé traditionnel.', 'Salon de Thé Duchesse Anne, Nantes', '2026-01-05 17:00:00+01', 12, 5);

-- 7. Créer quelques inscriptions
-- ============================================
INSERT INTO public.event_registrations (event_id, user_id, ticket_type, is_refundable) VALUES
  ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'standard', true),
  ('e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'vip', true),
  ('e3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'standard', true),
  ('e5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'standard', true),
  ('e6666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'standard', false);

-- 8. Créer quelques réservations de voyages
-- ============================================
INSERT INTO public.trip_bookings (trip_id, user_id, option_id, status) VALUES
  ('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 
   (SELECT id FROM public.trip_options WHERE trip_id = 'a1111111-1111-1111-1111-111111111111' AND name = 'Flex'), 
   'confirmed'),
  ('a2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 
   (SELECT id FROM public.trip_options WHERE trip_id = 'a2222222-2222-2222-2222-222222222222' AND name = 'VIP'), 
   'pending');

-- ============================================
-- FIN DES DONNÉES DE TEST
-- ============================================
