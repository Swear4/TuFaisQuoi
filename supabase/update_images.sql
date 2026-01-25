-- ============================================
-- UPDATE SEED DATA - Ajouter des images réelles
-- ============================================
-- Ce fichier met à jour les événements et voyages avec de vraies URLs d'images

-- Mise à jour des images des événements
UPDATE public.events SET image_url = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80' WHERE id = 'e1111111-1111-1111-1111-111111111111';
UPDATE public.events SET image_url = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80' WHERE id = 'e2222222-2222-2222-2222-222222222222';
UPDATE public.events SET image_url = 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80' WHERE id = 'e3333333-3333-3333-3333-333333333333';
UPDATE public.events SET image_url = 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=800&q=80' WHERE id = 'e4444444-4444-4444-4444-444444444444';
UPDATE public.events SET image_url = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80' WHERE id = 'e5555555-5555-5555-5555-555555555555';
UPDATE public.events SET image_url = 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&q=80' WHERE id = 'e6666666-6666-6666-6666-666666666666';
UPDATE public.events SET image_url = 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&q=80' WHERE id = 'e7777777-7777-7777-7777-777777777777';
UPDATE public.events SET image_url = 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80' WHERE id = 'e8888888-8888-8888-8888-888888888888';

-- Mise à jour des images des voyages
UPDATE public.trips SET image_url = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80' WHERE id = 'a1111111-1111-1111-1111-111111111111';
UPDATE public.trips SET image_url = 'https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=800&q=80' WHERE id = 'a2222222-2222-2222-2222-222222222222';
UPDATE public.trips SET image_url = 'https://images.unsplash.com/photo-1520471946988-d01ea8d85f59?w=800&q=80' WHERE id = 'a3333333-3333-3333-3333-333333333333';

-- Ajouter quelques inscriptions pour l'utilisateur mock (Marie Dupont)
-- pour tester l'affichage dans ProfileScreen
INSERT INTO public.event_registrations (event_id, user_id, ticket_type, is_refundable) VALUES
  ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'standard', true),
  ('e2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'standard', true),
  ('e3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'standard', true)
ON CONFLICT (event_id, user_id) DO NOTHING;

-- ============================================
-- FIN DES MISES À JOUR
-- ============================================
