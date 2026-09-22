-- Loom Phase 1 schema
-- One user = one profile for now (multi-user comes later if needed).

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  headline text,
  summary text,
  location text,
  email text,
  links jsonb not null default '[]',
  public_token uuid not null default gen_random_uuid(),
  webhook_url text,
  updated_at timestamptz not null default now(),
  unique (user_id),
  unique (public_token)
);

create table if not exists experience (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null,
  org text not null,
  location text,
  start_date text not null,
  end_date text,
  bullets jsonb not null default '[]',
  tags jsonb not null default '[]',
  source text not null default 'loom' check (source in ('loom', 'external', 'ai')),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text not null default '',
  bullets jsonb not null default '[]',
  links jsonb not null default '[]',
  tags jsonb not null default '[]',
  metrics jsonb not null default '[]',
  featured boolean not null default false,
  source text not null default 'loom' check (source in ('loom', 'external', 'ai')),
  updated_at timestamptz not null default now()
);

create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  category text,
  level text check (level in ('learning', 'comfortable', 'strong'))
);

create table if not exists education (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  institution text not null,
  degree text,
  start_date text not null,
  end_date text,
  notes text
);

-- Pending diffs from AI parsing or external-sync reconciliation.
-- Nothing here writes to the live tables until the user approves it
-- from the /sync dashboard page.
create table if not exists pending_updates (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  source text not null check (source in ('ai_chat', 'github_scan', 'external_sync')),
  target_table text not null, -- 'experience' | 'projects' | 'skills' | 'education' | 'profiles'
  payload jsonb not null,     -- proposed row (new or patched)
  diff_summary text,          -- human-readable one-liner for the review UI
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table experience enable row level security;
alter table projects enable row level security;
alter table skills enable row level security;
alter table education enable row level security;
alter table pending_updates enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = user_id);
create policy "own experience" on experience for all using (
  auth.uid() = (select user_id from profiles where profiles.id = experience.profile_id)
);
create policy "own projects" on projects for all using (
  auth.uid() = (select user_id from profiles where profiles.id = projects.profile_id)
);
create policy "own skills" on skills for all using (
  auth.uid() = (select user_id from profiles where profiles.id = skills.profile_id)
);
create policy "own education" on education for all using (
  auth.uid() = (select user_id from profiles where profiles.id = education.profile_id)
);
create policy "own pending_updates" on pending_updates for all using (
  auth.uid() = (select user_id from profiles where profiles.id = pending_updates.profile_id)
);
