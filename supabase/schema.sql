create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  set_id text,
  set_name text,
  answers jsonb not null,
  audio_path text,
  started_at timestamptz,
  finished_at timestamptz,
  duration_seconds integer,
  total_questions integer,
  answered_count integer,
  created_at timestamptz not null default now()
);

alter table public.test_results
  add column if not exists set_id text,
  add column if not exists set_name text,
  add column if not exists audio_path text;

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.test_results enable row level security;
alter table public.user_roles enable row level security;

create policy "insert own results" on public.test_results
for insert
with check (auth.uid() = user_id);

create policy "teachers can read all results" on public.test_results
for select
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'teacher'
  )
);

create policy "users can read own role" on public.user_roles
for select
using (auth.uid() = user_id);
