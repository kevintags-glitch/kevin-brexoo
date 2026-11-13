-- Sample data loader and structured locations.
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
  ('00000000-0000-0000-0000-00000000e5a1', 'owner@samples.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000e5b1', 'member@samples.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000e5c1', 'other@samples.test', now(), 'authenticated', 'authenticated');
create temp table ids (k text primary key, v uuid);
grant all on ids to authenticated;

select pg_temp.as_user('00000000-0000-0000-0000-00000000e5a1');
insert into ids values ('org', public.create_organization('Sample Electric', 'sample-electric', 'America/Chicago', 'US', 'USD'));
select pg_temp.check((select count(*) from public.sample_businesses) = 8, 'eight sample businesses are available');

-- Integrations must not receive sample activity.
insert into public.integrations (organization_id, url, events, created_by)
values ((select v from ids where k = 'org'), 'https://hook.us1.make.com/sampleTest123', array['enquiry.received', 'appointment.booked', 'opportunity.won'], '00000000-0000-0000-0000-00000000e5a1');

select public.load_sample_data((select v from ids where k = 'org'), 'electricians') as r \gset
select pg_temp.check((:'r'::jsonb ->> 'leads')::int = 5, 'loads every sample lead');
select pg_temp.check((select count(*) from public.contacts where is_sample) = 5, 'sample contacts are flagged');
select pg_temp.check((select count(*) from public.opportunities where stage = 'won') = 1, 'a won client is included');
select pg_temp.check((select count(*) from public.appointments) = 1, 'the booked visit is on the calendar');
select pg_temp.check((select timezone from public.appointments limit 1) = 'America/Chicago', 'appointments use the business time zone');
select pg_temp.check((select count(*) from public.project_records where contact_permission = 'not_permitted') = 1, 'sample discovery records are never contactable');
select pg_temp.check((select (public.load_sample_data((select v from ids where k = 'org'), 'electricians') ->> 'already_loaded')::boolean), 'loading twice does nothing');
reset role;
select pg_temp.check((select count(*) from public.notification_outbox where organization_id = (select v from ids where k = 'org')) = 0, 'sample activity never reaches integrations');

-- Members can't load or clear; other organisations see nothing.
insert into public.memberships (organization_id, user_id, role) values ((select v from ids where k = 'org'), '00000000-0000-0000-0000-00000000e5b1', 'member');
select pg_temp.as_user('00000000-0000-0000-0000-00000000e5b1');
do $$ begin
  perform public.clear_sample_data((select v from ids where k = 'org'));
  raise exception 'FAILED: member cleared samples';
exception when insufficient_privilege then raise notice 'ok - only owners clear sample data';
end $$;
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000e5c1');
select pg_temp.check((select count(*) from public.contacts) = 0, 'other organisations cannot see sample data');
do $$ begin
  perform public.load_sample_data((select v from ids where k = 'org'), 'plumbers');
  raise exception 'FAILED: outsider loaded samples';
exception when insufficient_privilege then raise notice 'ok - outsiders cannot load samples';
end $$;
reset role;

-- A real lead survives clearing.
select pg_temp.as_user('00000000-0000-0000-0000-00000000e5a1');
insert into public.contacts (organization_id, full_name, email) values ((select v from ids where k = 'org'), 'Real Customer', 'real@example.org');
select public.clear_sample_data((select v from ids where k = 'org'));
select pg_temp.check((select count(*) from public.contacts) = 1, 'clearing removes only sample contacts');
select pg_temp.check((select count(*) from public.opportunities) = 0 and (select count(*) from public.appointments) = 0 and (select count(*) from public.projects) = 0, 'sample opportunities, bookings and projects are gone');
select pg_temp.check((select count(*) from public.discovery_sources) = 0, 'the sample project feed is gone');

-- Structured service areas: slugs unique per organisation.
insert into public.service_areas (organization_id, label, country, state, county, city, postcode, slug)
values ((select v from ids where k = 'org'), 'Austin, TX 78701 (Travis County)', 'US', 'TX', 'Travis County', 'Austin', '78701', 'texas/austin');
do $$ begin
  insert into public.service_areas (organization_id, label, country, state, city, slug)
  values ((select v from ids where k = 'org'), 'Austin again', 'US', 'TX', 'Austin', 'texas/austin');
  raise exception 'FAILED: duplicate area slug accepted';
exception when unique_violation then raise notice 'ok - area slugs are unique per organisation';
end $$;
do $$ begin
  insert into public.service_areas (organization_id, label, slug) values ((select v from ids where k = 'org'), 'Bad', '../etc');
  raise exception 'FAILED: unsafe slug accepted';
exception when check_violation then raise notice 'ok - area slugs are URL-safe';
end $$;
reset role;

rollback;
