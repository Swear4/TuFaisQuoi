-- Add multi-category support for events
-- This migration introduces a new `categories` column (text[]) while keeping the existing `category` column for backwards compatibility.

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS categories TEXT[];

-- Backfill: if categories is null/empty, populate it from the existing single category
UPDATE public.events
SET categories = ARRAY[category]
WHERE (categories IS NULL OR array_length(categories, 1) IS NULL)
  AND category IS NOT NULL;

-- Helpful index for contains queries (e.g. categories @> ARRAY['sport'])
CREATE INDEX IF NOT EXISTS idx_events_categories_gin
ON public.events
USING GIN (categories);
