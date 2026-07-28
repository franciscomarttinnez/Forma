-- Forma initial schema

create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  onboarding_completed boolean not null default false,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  summary text not null default '',
  ai_rationale text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.routine_days (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  day_index integer not null,
  name text not null,
  focus text not null default '',
  unique (routine_id, day_index)
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.routine_days (id) on delete cascade,
  sort_order integer not null default 0,
  name text not null,
  sets integer not null default 3,
  reps text not null default '8-12',
  rest_seconds integer not null default 90,
  muscles text[] not null default '{}',
  notes text not null default '',
  demo_url text
);

create index routines_user_id_idx on public.routines (user_id);
create index routine_days_routine_id_idx on public.routine_days (routine_id);
create index exercises_day_id_idx on public.exercises (day_id);

alter table public.profiles enable row level security;
alter table public.routines enable row level security;
alter table public.routine_days enable row level security;
alter table public.exercises enable row level security;

create policy "Profiles are readable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Routines are readable by owner"
  on public.routines for select
  using (auth.uid() = user_id);

create policy "Routines are insertable by owner"
  on public.routines for insert
  with check (auth.uid() = user_id);

create policy "Routines are updatable by owner"
  on public.routines for update
  using (auth.uid() = user_id);

create policy "Routines are deletable by owner"
  on public.routines for delete
  using (auth.uid() = user_id);

create policy "Routine days readable by owner"
  on public.routine_days for select
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

create policy "Routine days insertable by owner"
  on public.routine_days for insert
  with check (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

create policy "Routine days updatable by owner"
  on public.routine_days for update
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

create policy "Routine days deletable by owner"
  on public.routine_days for delete
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

create policy "Exercises readable by owner"
  on public.exercises for select
  using (
    exists (
      select 1
      from public.routine_days d
      join public.routines r on r.id = d.routine_id
      where d.id = day_id and r.user_id = auth.uid()
    )
  );

create policy "Exercises insertable by owner"
  on public.exercises for insert
  with check (
    exists (
      select 1
      from public.routine_days d
      join public.routines r on r.id = d.routine_id
      where d.id = day_id and r.user_id = auth.uid()
    )
  );

create policy "Exercises updatable by owner"
  on public.exercises for update
  using (
    exists (
      select 1
      from public.routine_days d
      join public.routines r on r.id = d.routine_id
      where d.id = day_id and r.user_id = auth.uid()
    )
  );

create policy "Exercises deletable by owner"
  on public.exercises for delete
  using (
    exists (
      select 1
      from public.routine_days d
      join public.routines r on r.id = d.routine_id
      where d.id = day_id and r.user_id = auth.uid()
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Privileges for Supabase API roles (required alongside RLS)
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on table public.profiles to anon, authenticated, service_role;
grant all on table public.routines to anon, authenticated, service_role;
grant all on table public.routine_days to anon, authenticated, service_role;
grant all on table public.exercises to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;