-- Syncfolio schema
-- One auth user owns exactly one profile. Fresh setups run this file;
-- existing databases run supabase/migrations/ in order instead.

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
  github_username text,
  -- Modules: resume and portfolio are independent and both optional.
  resume_enabled boolean not null default true,
  portfolio_enabled boolean not null default true,
  -- Default for "sync to portfolio" when approving an update.
  portfolio_auto_sync boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (user_id),
  unique (public_token),
  constraint profiles_one_module_on check (resume_enabled or portfolio_enabled)
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
  source text not null default 'manual' check (source in ('manual', 'external', 'ai')),
  show_on_resume boolean not null default true,
  show_on_portfolio boolean not null default true,
  sort_order integer not null default 0,
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
  source text not null default 'manual' check (source in ('manual', 'external', 'ai')),
  show_on_resume boolean not null default true,
  show_on_portfolio boolean not null default true,
  sort_order integer not null default 0,
  -- Portfolio-only fields. The resume never reads these.
  slug text,
  long_description text,
  cover_image_url text,
  updated_at timestamptz not null default now(),
  unique (profile_id, slug)
);

create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  category text,
  level text check (level in ('learning', 'comfortable', 'strong')),
  show_on_resume boolean not null default true,
  show_on_portfolio boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists education (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  institution text not null,
  degree text,
  start_date text not null,
  end_date text,
  notes text,
  show_on_resume boolean not null default true,
  show_on_portfolio boolean not null default true,
  sort_order integer not null default 0
);

-- Proposed changes from AI parsing, GitHub scans and external sync.
-- Nothing here writes to the live tables until the user approves it.
create table if not exists pending_updates (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  source text not null check (source in ('ai_chat', 'github_scan', 'external_sync')),
  target_table text not null check (target_table in ('experience', 'projects', 'skills', 'education', 'profiles')),
  payload jsonb not null,     -- proposed fields + __action / __target_id
  diff_summary text,          -- one-liner for the review UI
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'undone')),
  -- Filled on approval so the change can be undone:
  applied_row_id uuid,        -- row created / updated / deleted
  previous jsonb,             -- full row before an update or delete
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- Each publish freezes the portfolio view. External sites read the latest.
create table if not exists portfolio_snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  data jsonb not null,        -- PortfolioView at publish time
  changes jsonb not null default '[]', -- [{ section, action, id }] vs previous snapshot
  published_at timestamptz not null default now()
);

create index if not exists pending_updates_profile_status_idx
  on pending_updates (profile_id, status, created_at desc);
create index if not exists portfolio_snapshots_profile_idx
  on portfolio_snapshots (profile_id, published_at desc);

alter table profiles enable row level security;
alter table experience enable row level security;
alter table projects enable row level security;
alter table skills enable row level security;
alter table education enable row level security;
alter table pending_updates enable row level security;
alter table portfolio_snapshots enable row level security;

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
create policy "own portfolio_snapshots" on portfolio_snapshots for all using (
  auth.uid() = (select user_id from profiles where profiles.id = portfolio_snapshots.profile_id)
);
