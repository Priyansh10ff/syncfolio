-- Renames the content-row source value 'loom' to 'manual'.
-- Only needed for databases created from the schema before the
-- Syncfolio rename. Fresh setups get this from supabase/schema.sql.
-- Safe to run more than once.

begin;

alter table experience drop constraint if exists experience_source_check;
alter table projects drop constraint if exists projects_source_check;

update experience set source = 'manual' where source = 'loom';
update projects set source = 'manual' where source = 'loom';

alter table experience alter column source set default 'manual';
alter table projects alter column source set default 'manual';

alter table experience
  add constraint experience_source_check check (source in ('manual', 'external', 'ai'));
alter table projects
  add constraint projects_source_check check (source in ('manual', 'external', 'ai'));

commit;
