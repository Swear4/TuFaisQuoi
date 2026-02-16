-- ============================================
-- Carpool requests + invitations
-- Adds: carpool_requests, carpool_invitations
-- Also aligns carpools table with app expectations (total_seats + notes)
-- ============================================

-- 0) Align carpools schema (app uses total_seats + notes)
ALTER TABLE public.carpools
  ADD COLUMN IF NOT EXISTS total_seats INTEGER,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- If total_seats is missing but available_seats exists, backfill total_seats
UPDATE public.carpools
SET total_seats = COALESCE(total_seats, available_seats)
WHERE total_seats IS NULL;

-- Ensure total_seats is always set (after backfill)
ALTER TABLE public.carpools
  ALTER COLUMN total_seats SET NOT NULL;

-- Helpful constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_carpools_seats'
  ) THEN
    ALTER TABLE public.carpools
      ADD CONSTRAINT check_carpools_seats
      CHECK (available_seats >= 0 AND total_seats > 0 AND available_seats <= total_seats);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_carpools_driver_event
ON public.carpools(driver_id, event_id);

-- 1) Requests: "Je cherche X places"
CREATE TABLE IF NOT EXISTS public.carpool_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  departure_location TEXT NOT NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  seats_needed INTEGER NOT NULL DEFAULT 1 CHECK (seats_needed > 0),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(event_id, requester_id, departure_time)
);

CREATE INDEX IF NOT EXISTS idx_carpool_requests_event
ON public.carpool_requests(event_id, status, departure_time);

CREATE INDEX IF NOT EXISTS idx_carpool_requests_requester
ON public.carpool_requests(requester_id, created_at DESC);

-- 2) Invitations: driver invites a requester into a specific carpool
CREATE TABLE IF NOT EXISTS public.carpool_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  carpool_id UUID REFERENCES public.carpools(id) ON DELETE CASCADE NOT NULL,
  request_id UUID REFERENCES public.carpool_requests(id) ON DELETE CASCADE NOT NULL,
  from_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(carpool_id, request_id)
);

CREATE INDEX IF NOT EXISTS idx_carpool_invitations_to
ON public.carpool_invitations(to_user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_carpool_invitations_from
ON public.carpool_invitations(from_user_id, status, created_at DESC);

-- ============================================
-- RLS
-- ============================================

-- carpool_requests
ALTER TABLE public.carpool_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Carpool requests are viewable by all"
ON public.carpool_requests FOR SELECT
USING (true);

CREATE POLICY "Users can create their own carpool requests"
ON public.carpool_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own carpool requests"
ON public.carpool_requests FOR UPDATE
USING (auth.uid() = requester_id)
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can delete their own carpool requests"
ON public.carpool_requests FOR DELETE
USING (auth.uid() = requester_id);

-- carpool_invitations
ALTER TABLE public.carpool_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invitation participants can view"
ON public.carpool_invitations FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Drivers can create invitations"
ON public.carpool_invitations FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

-- Only receiver can accept/decline
CREATE POLICY "Receivers can respond to invitations"
ON public.carpool_invitations FOR UPDATE
USING (auth.uid() = to_user_id)
WITH CHECK (auth.uid() = to_user_id);
