-- Fix: permission denied for table routines / related tables
-- Run this in Supabase → SQL Editor → Run

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on table public.profiles to anon, authenticated, service_role;
grant all on table public.routines to anon, authenticated, service_role;
grant all on table public.routine_days to anon, authenticated, service_role;
grant all on table public.exercises to anon, authenticated, service_role;

grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- Backfill profiles for users created before the trigger existed
insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- Make sure RLS is on (policies from 001 still apply)
alter table public.profiles enable row level security;
alter table public.routines enable row level security;
alter table public.routine_days enable row level security;
alter table public.exercises enable row level security;
