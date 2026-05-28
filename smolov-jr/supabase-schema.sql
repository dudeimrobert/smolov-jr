-- Run this in your Supabase project: SQL Editor → New query → paste → Run

create table if not exists public.tracker_data (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  data     jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Only the owning user can read or write their row
alter table public.tracker_data enable row level security;

create policy "Users can read own data"
  on public.tracker_data for select
  using (auth.uid() = user_id);

create policy "Users can upsert own data"
  on public.tracker_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own data"
  on public.tracker_data for update
  using (auth.uid() = user_id);
