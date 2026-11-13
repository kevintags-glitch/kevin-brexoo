-- Discovery: provenance, permitted-contact handling, idempotent saves and tenant isolation.
\set ON_ERROR_STOP on
begin;

create function pg_temp.as_user(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;
create function pg_temp.check(ok boolean, label text) returns void language plpgsql as $$
begin
  if ok is not true then raise exception 'FAILED: %', label; end if;
  raise notice 'ok - %', label;
end $$;

insert into auth.users (id, email, email_confirmed_at, aud, role) values
  ('00000000-0000-0000-0000-00000000aa01', 'owner@disc.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000bb01', 'other@disc.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000cc01', 'member@disc.test', now(), 'authenticated', 'authenticated');
create temp table ids (k text primary key, v uuid);
grant all on ids to authenticated;

select pg_temp.as_user('00000000-0000-0000-0000-00000000aa01');
insert into ids values ('org', public.create_organization('Disc Builders', 'disc-builders'));
insert into public.discovery_sources (organization_id, name, source_type, permitted_use, created_by)
values ((select v from ids where k = 'org'), 'Client referral list', 'customer_provided', 'Our own client list; contact permitted for project follow-up.', '00000000-0000-0000-0000-00000000aa01')
returning id as src \gset
insert into public.project_records (organization_id, source_id, external_id, title, category_code, location_text, contact_name, contact_email, contact_permission, observed_at, estimated_value_minor, currency)
values
  ((select v from ids where k = 'org'), :'src', 'A-1', 'Duplex on two lots', 'home_builder', 'Lambton', 'Pat Lee', 'pat@example.com', 'permitted', current_date - 3, 65000000, 'AUD'),
  ((select v from ids where k = 'org'), :'src', 'A-2', 'Office fit-out', 'electrician', 'Newcastle', 'No Contact', 'nocontact@example.com', 'not_permitted', current_date - 10, null, null),
  ((select v from ids where k = 'org'), :'src', 'A-3', 'Tender: townhouse package', 'home_builder', 'Wallsend', null, null, 'unknown', current_date - 1, null, null);

do $$ begin
  insert into public.project_records (organization_id, source_id, external_id, title)
  values ((select v from ids where k = 'org'), (select id from public.discovery_sources limit 1), 'A-1', 'Duplicate');
  raise exception 'FAILED: duplicate source record accepted';
exception when unique_violation then raise notice 'ok - one record per source id';
end $$;

select public.save_project_record((select id from public.project_records where external_id = 'A-1')) as first \gset
select pg_temp.check((:'first'::jsonb ->> 'opportunity_id') is not null, 'saving a permitted record creates an opportunity');
select pg_temp.check((public.save_project_record((select id from public.project_records where external_id = 'A-1')) ->> 'already_saved')::boolean, 'saving twice is idempotent');
select pg_temp.check((select count(*) from public.opportunities) = 1, 'no duplicate opportunity');
select pg_temp.check((select details #>> '{provenance,source_name}' from public.projects where id = (:'first'::jsonb ->> 'project_id')::uuid) = 'Client referral list', 'provenance travels with the project');

select public.save_project_record((select id from public.project_records where external_id = 'A-2'));
select pg_temp.check((select count(*) from public.contacts where email = 'nocontact@example.com') = 0, 'not-permitted contacts are never created');
select public.save_project_record((select id from public.project_records where external_id = 'A-3'));
select pg_temp.check((select count(*) from public.tasks where title like 'Research decision-maker%') = 2, 'records without usable contacts become research tasks');

-- A member can save and dismiss but not import.
reset role;
insert into public.memberships (organization_id, user_id, role) values ((select v from ids where k = 'org'), '00000000-0000-0000-0000-00000000cc01', 'member');
select pg_temp.as_user('00000000-0000-0000-0000-00000000cc01');
do $$ begin
  insert into public.project_records (organization_id, source_id, external_id, title) values ((select v from ids where k = 'org'), (select id from public.discovery_sources limit 1), 'M-1', 'Member import');
  raise exception 'FAILED: member imported';
exception when insufficient_privilege then raise notice 'ok - only owners import records';
end $$;

-- Another business sees nothing.
select pg_temp.as_user('00000000-0000-0000-0000-00000000bb01');
select pg_temp.check((select count(*) from public.project_records) = 0, 'other tenants cannot read discovery records');
select pg_temp.check((select count(*) from public.discovery_sources) = 0, 'other tenants cannot read sources');
do $$ begin
  perform public.save_project_record((select id from public.project_records limit 1));
  perform public.save_project_record('00000000-0000-0000-0000-000000000000');
  raise exception 'FAILED: foreign save';
exception when insufficient_privilege then raise notice 'ok - cannot save another tenant''s record';
end $$;

rollback;
