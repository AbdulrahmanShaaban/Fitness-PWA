-- Coach Log: initial schema + RLS
-- Single-trainer app: every row is scoped to auth.uid() via RLS.
-- Run this in the Supabase SQL editor (or via supabase db push).

create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  start_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz,
  is_deleted boolean not null default false
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz,
  is_deleted boolean not null default false
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  muscle_group text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz,
  is_deleted boolean not null default false
);

create table if not exists public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz,
  is_deleted boolean not null default false
);

create table if not exists public.sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_exercise_id uuid not null references public.session_exercises (id) on delete cascade,
  set_number integer not null,
  reps integer not null,
  weight_kg numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz,
  is_deleted boolean not null default false
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  type text not null,
  date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz,
  is_deleted boolean not null default false
);

create table if not exists public.assessment_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  test_name text not null,
  fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz,
  is_deleted boolean not null default false
);

create table if not exists public.client_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  assessment_id uuid references public.assessments (id) on delete set null,
  angle text not null,
  date date not null,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz,
  is_deleted boolean not null default false
);

create index if not exists idx_clients_user on public.clients (user_id, updated_at);
create index if not exists idx_sessions_user on public.sessions (user_id, updated_at);
create index if not exists idx_sessions_client on public.sessions (client_id);
create index if not exists idx_session_exercises_user on public.session_exercises (user_id, updated_at);
create index if not exists idx_sets_user on public.sets (user_id, updated_at);
create index if not exists idx_exercises_user on public.exercises (user_id, updated_at);
create index if not exists idx_assessments_user on public.assessments (user_id, updated_at);
create index if not exists idx_assessment_tests_user on public.assessment_tests (user_id, updated_at);
create index if not exists idx_client_photos_user on public.client_photos (user_id, updated_at);

alter table public.clients enable row level security;
alter table public.sessions enable row level security;
alter table public.session_exercises enable row level security;
alter table public.sets enable row level security;
alter table public.exercises enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_tests enable row level security;
alter table public.client_photos enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'clients', 'sessions', 'session_exercises', 'sets', 'exercises',
    'assessments', 'assessment_tests', 'client_photos'
  ] loop
    execute format(
      'create policy "owner_all_%s" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t, t
    );
  end loop;
end $$;

-- Storage bucket for client photos (public read via signed/public URL).
insert into storage.buckets (id, name, public)
values ('client-photos', 'client-photos', true)
on conflict (id) do nothing;

-- Base grants: SQL-created tables do not inherit project default privileges.
grant select on all tables in schema public to anon;
grant all on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

-- Storage policies for the client-photos bucket.
create policy "client_photos_public_read" on storage.objects
  for select using (bucket_id = 'client-photos');
create policy "client_photos_auth_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'client-photos');
create policy "client_photos_auth_update" on storage.objects
  for update to authenticated using (bucket_id = 'client-photos');
create policy "client_photos_auth_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'client-photos');