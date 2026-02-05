-- RE-RUN GUIDE:
-- Since you already ran the previous version, we need to drop the old table first 
-- to ensure the Foreign Key points to the correct table (public.users).
-- WARNING: This will delete any test messages you just created.
DROP TABLE IF EXISTS public.messages CASCADE;

-- Create messages table for event discussions
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null check (length(content) > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.messages enable row level security;

-- Policies
-- Authenticated users can read messages
create policy "Authenticated users can read messages"
  on public.messages for select
  using (auth.role() = 'authenticated');

-- Authenticated users can insert messages (must matches their own user_id)
create policy "Authenticated users can insert messages"
  on public.messages for insert
  with check (auth.role() = 'authenticated' and auth.uid() = user_id);

-- Indexes
create index messages_event_id_idx on public.messages(event_id);
create index messages_created_at_idx on public.messages(created_at);

-- Add realtime
alter publication supabase_realtime add table public.messages;

