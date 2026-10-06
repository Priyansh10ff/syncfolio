-- Resume/portfolio modules, per-row visibility, ordering, portfolio-only
-- project fields, publish snapshots, and undo support for approvals.
-- Safe to run more than once.

begin;

-- Modules
alter table profiles add column if not exists resume_enabled boolean not null default true;
alter table profiles add column if not exists portfolio_enabled boolean not null default true;
alter table profiles add column if not exists portfolio_auto_sync boolean not null default true;
alter table profiles drop constraint if exists profiles_one_module_on;
alter table profiles add constraint profiles_one_module_on check (resume_enabled or portfolio_enabled);

-- Per-row visibility and ordering
alter table experience add column if not exists show_on_resume boolean not null default true;
alter table experience add column if not exists show_on_portfolio boolean not null default true;
alter table experience add column if not exists sort_order integer not null default 0;
alter table projects add column if not exists show_on_resume boolean not null default true;
alter table projects add column if not exists show_on_portfolio boolean not null default true;
alter table projects add column if not exists sort_order integer not null default 0;
alter table skills add column if not exists show_on_resume boolean not null default true;
alter table skills add column if not exists show_on_portfolio boolean not null default true;
alter table skills add column if not exists sort_order integer not null default 0;
alter table education add column if not exists show_on_resume boolean not null default true;
alter table education add column if not exists show_on_portfolio boolean not null default true;
alter table education add column if not exists sort_order integer not null default 0;

-- Portfolio-only project fields
alter table projects add column if not exists slug text;
alter table projects add column if not exists long_description text;
alter table projects add column if not exists cover_image_url text;
alter table projects drop constraint if exists projects_profile_id_slug_key;
alter table projects add constraint projects_profile_id_slug_key unique (profile_id, slug);

-- Undo support on approvals
alter table pending_updates add column if not exists applied_row_id uuid;
alter table pending_updates add column if not exists previous jsonb;
alter table pending_updates add column if not exists resolved_at timestamptz;
alter table pending_updates drop constraint if exists pending_updates_status_check;
alter table pending_updates add constraint pending_updates_status_check
  check (status in ('pending', 'approved', 'rejected', 'undone'));
alter table pending_updates drop constraint if exists pending_updates_target_table_check;
alter table pending_updates add constraint pending_updates_target_table_check
  check (target_table in ('experience', 'projects', 'skills', 'education', 'profiles'));

-- Publish snapshots
create table if not exists portfolio_snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  data jsonb not null,
  changes jsonb not null default '[]',
  published_at timestamptz not null default now()
);
alter table portfolio_snapshots enable row level security;
drop policy if exists "own portfolio_snapshots" on portfolio_snapshots;
create policy "own portfolio_snapshots" on portfolio_snapshots for all using (
  auth.uid() = (select user_id from profiles where profiles.id = portfolio_snapshots.profile_id)
);

create index if not exists pending_updates_profile_status_idx
  on pending_updates (profile_id, status, created_at desc);
create index if not exists portfolio_snapshots_profile_idx
  on portfolio_snapshots (profile_id, published_at desc);

commit;
