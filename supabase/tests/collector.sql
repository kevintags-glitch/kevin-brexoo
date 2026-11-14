-- Project Data Collector: idempotent ingestion, private per-business distribution by service and
-- area, opt-outs, platform tables closed to businesses, and inbound enquiries from Make.com.
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
  ('00000000-0000-0000-0000-0000000c0a01', 'hunter@collector.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000c0b01', 'sparks@collector.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000c0c01', 'optout@collector.test', now(), 'authenticated', 'authenticated');
create temp table ids (k text primary key, v uuid);
grant all on ids to authenticated;

-- A Newcastle builder, a Sydney electrician, and a Newcastle builder that switches the NSW source off.
select pg_temp.as_user('00000000-0000-0000-0000-0000000c0a01');
insert into ids values ('hunter', public.create_organization('Hunter Collect Builders', 'hunter-collect'));
reset role;
insert into public.org_services (organization_id, category_code) values ((select v from ids where k = 'hunter'), 'home_builder');
insert into public.service_areas (organization_id, label, country, state, city, suburb, postcode)
values ((select v from ids where k = 'hunter'), 'Merewether, Newcastle NSW 2291', 'AU', 'NSW', 'Newcastle', 'Merewether', '2291');

select pg_temp.as_user('00000000-0000-0000-0000-0000000c0b01');
insert into ids values ('sparks', public.create_organization('Bondi Collect Sparks', 'bondi-collect'));
reset role;
insert into public.org_services (organization_id, category_code) values ((select v from ids where k = 'sparks'), 'electrician');
insert into public.service_areas (organization_id, label, country, state, city, suburb, postcode)
values ((select v from ids where k = 'sparks'), 'Bondi, Sydney NSW 2026', 'AU', 'NSW', 'Sydney', 'Bondi', '2026');

select pg_temp.as_user('00000000-0000-0000-0000-0000000c0c01');
insert into ids values ('optout', public.create_organization('Opt Out Builders', 'optout-collect'));
reset role;
insert into public.org_services (organization_id, category_code) values ((select v from ids where k = 'optout'), 'home_builder');
insert into public.service_areas (organization_id, label, country, state, city, suburb, postcode)
values ((select v from ids where k = 'optout'), 'Merewether, Newcastle NSW 2291', 'AU', 'NSW', 'Newcastle', 'Merewether', '2291');
select pg_temp.as_user('00000000-0000-0000-0000-0000000c0c01');
select public.set_platform_source_enabled((select v from ids where k = 'optout'), 'nsw-planning-da', false);
reset role;

-- Ingest a batch the way the collector API does (service role).
select public.ingest_collected_projects('nsw-planning-da', '[
  {"external_id": "PAN-1001", "title": "New two-storey dwelling", "category_code": "home_builder", "region": "NSW", "city": "Newcastle",
   "suburb": "Merewether", "postcode": "2291", "address": "12 Example St", "stage": "Lodged", "estimated_value_minor": 85000000,
   "currency": "AUD", "observed_at": "2026-11-10", "source_url": "https://www.planningportal.nsw.gov.au/"},
  {"external_id": "PAN-1002", "title": "Switchboard upgrade and solar", "category_code": "electrician", "region": "NSW", "city": "Sydney",
   "suburb": "Bondi", "postcode": "2026", "observed_at": "2026-11-11"},
  {"external_id": "PAN-1003", "title": "Pool fence", "category_code": "fencing_decking", "region": "NSW", "city": "Dubbo", "postcode": "2830"},
  {"external_id": "", "title": "Missing id"},
  {"external_id": "PAN-1004", "title": "Bad value", "estimated_value_minor": "lots"}
]'::jsonb, '{"cursor": "2026-11-12", "fetched": 5}'::jsonb) as r1 \gset

select pg_temp.check((:'r1'::jsonb ->> 'inserted')::int = 3, 'valid records are added to the pool');
select pg_temp.check((:'r1'::jsonb ->> 'rejected')::int = 2, 'invalid records are rejected, not fatal');
select pg_temp.check(jsonb_array_length(:'r1'::jsonb -> 'errors') = 2, 'rejections are reported with a reason');
select pg_temp.check((:'r1'::jsonb ->> 'distributed')::int >= 2, 'matching businesses receive copies');
select pg_temp.check((select cursor from public.platform_sources where key = 'nsw-planning-da') = '2026-11-12', 'the source cursor advances');
select pg_temp.check((select count(*) from public.collector_runs r join public.platform_sources s on s.id = r.source_id where s.key = 'nsw-planning-da') = 1, 'each run is logged');

-- Distribution: right business, right service, right area.
select pg_temp.check((select count(*) from public.project_records where organization_id = (select v from ids where k = 'hunter')) = 1, 'the Newcastle builder gets only the Merewether build');
select pg_temp.check((select title from public.project_records where organization_id = (select v from ids where k = 'hunter')) = 'New two-storey dwelling', 'the matched project is the dwelling');
select pg_temp.check((select count(*) from public.project_records where organization_id = (select v from ids where k = 'sparks')) = 1, 'the Bondi electrician gets only the electrical job');
select pg_temp.check((select count(*) from public.project_records where organization_id = (select v from ids where k = 'optout')) = 0, 'a business that switched the source off gets nothing');
select pg_temp.check((select contact_permission from public.project_records where organization_id = (select v from ids where k = 'hunter')) = 'not_permitted', 'public-register records are marked contact not permitted');
select pg_temp.check((select d.name from public.project_records r join public.discovery_sources d on d.id = r.source_id where r.organization_id = (select v from ids where k = 'hunter')) = 'Brexoo · NSW Planning Portal applications', 'records arrive under a labelled Brexoo source');
select pg_temp.check((select location_text from public.project_records where organization_id = (select v from ids where k = 'hunter')) = '12 Example St, Merewether, Newcastle NSW 2291', 'location reads as an address');
select pg_temp.check((select count(*) from public.activity_events where organization_id = (select v from ids where k = 'hunter') and kind = 'discovery.matched') = 1, 'the business is notified once per batch');

-- Re-sending the same record changes nothing; a changed record updates the copy, keeping its status.
update public.project_records set status = 'dismissed' where organization_id = (select v from ids where k = 'hunter');
select public.ingest_collected_projects('nsw-planning-da', '[
  {"external_id": "PAN-1001", "title": "New two-storey dwelling", "category_code": "home_builder", "region": "NSW", "city": "Newcastle",
   "suburb": "Merewether", "postcode": "2291", "address": "12 Example St", "stage": "Lodged", "estimated_value_minor": 85000000,
   "currency": "AUD", "observed_at": "2026-11-10", "source_url": "https://www.planningportal.nsw.gov.au/"}
]'::jsonb) as r2 \gset
select pg_temp.check((:'r2'::jsonb ->> 'unchanged')::int = 1 and (:'r2'::jsonb ->> 'distributed')::int = 0, 'an unchanged record is a no-op');

select public.ingest_collected_projects('nsw-planning-da', '[
  {"external_id": "PAN-1001", "title": "New two-storey dwelling", "category_code": "home_builder", "region": "NSW", "city": "Newcastle",
   "suburb": "Merewether", "postcode": "2291", "address": "12 Example St", "stage": "Approved", "estimated_value_minor": 85000000,
   "currency": "AUD", "observed_at": "2026-11-10", "source_url": "https://www.planningportal.nsw.gov.au/"}
]'::jsonb) as r3 \gset
select pg_temp.check((:'r3'::jsonb ->> 'updated')::int = 1, 'a changed record is updated');
select pg_temp.check((select project_stage from public.project_records where organization_id = (select v from ids where k = 'hunter')) = 'Approved', 'the business copy picks up the new stage');
select pg_temp.check((select status from public.project_records where organization_id = (select v from ids where k = 'hunter')) = 'dismissed', 'the business''s own status is kept');
select pg_temp.check((select count(*) from public.project_records where organization_id = (select v from ids where k = 'hunter')) = 1, 'no duplicate copy');
select pg_temp.check((select count(*) from public.activity_events where organization_id = (select v from ids where k = 'hunter') and kind = 'discovery.matched') = 1, 'updates don''t re-notify');

-- Regional tenders go to building businesses in that state; they carry the closing date.
select public.ingest_collected_projects('austender-construction', '[
  {"external_id": "CN-77", "title": "Defence base amenities upgrade", "scope": "regional", "region": "NSW", "country": "AU",
   "estimated_value_minor": 120000000, "currency": "AUD", "observed_at": "2026-11-09", "closes_at": "2026-12-12"}
]'::jsonb) as r4 \gset
select pg_temp.check((select count(*) from public.project_records r join public.discovery_sources d on d.id = r.source_id
                       where d.platform_source_id = (select id from public.platform_sources where key = 'austender-construction')
                         and r.organization_id in (select v from ids where k in ('hunter', 'optout'))) = 2,
                     'a statewide tender reaches both NSW building businesses');
select pg_temp.check((select timeline from public.project_records where organization_id = (select v from ids where k = 'optout') and title like 'Defence%') = 'Closes 12 Dec 2026', 'tenders show when they close');
select pg_temp.check(not exists (select 1 from public.project_records where organization_id = (select v from ids where k = 'sparks') and title like 'Defence%'), 'uncategorised tenders skip non-building trades');

-- Unknown sources and oversized batches are refused.
do $$ begin
  perform public.ingest_collected_projects('no-such-source', '[]'::jsonb);
  raise exception 'FAILED: unknown source accepted';
exception when invalid_parameter_value then raise notice 'ok - unknown sources are refused';
end $$;

-- Businesses can't read or call into the platform pool, but can see which sources feed them.
select pg_temp.as_user('00000000-0000-0000-0000-0000000c0a01');
do $$ begin
  perform count(*) from public.collected_projects;
  raise exception 'FAILED: business read the pool';
exception when insufficient_privilege then raise notice 'ok - businesses cannot read the platform pool';
end $$;
do $$ begin
  perform public.ingest_collected_projects('nsw-planning-da', '[]'::jsonb);
  raise exception 'FAILED: business ingested';
exception when insufficient_privilege then raise notice 'ok - businesses cannot ingest';
end $$;
select pg_temp.check((select records from public.my_platform_sources((select v from ids where k = 'hunter')) where key = 'nsw-planning-da') = 1, 'a business sees its record count per source');
select pg_temp.check((select count(*) from public.my_platform_sources((select v from ids where k = 'sparks'))) = 0, 'a business cannot list another business''s sources');
do $$ begin
  perform public.set_platform_source_enabled((select v from ids where k = 'sparks'), 'nsw-planning-da', false);
  raise exception 'FAILED: switched another business''s source';
exception when insufficient_privilege then raise notice 'ok - only the business''s owners switch its sources';
end $$;
select pg_temp.check((select switched_off from public.my_platform_sources((select v from ids where k = 'hunter')) where key = 'nsw-planning-da') = false, 'sources are on by default');
reset role;

-- Inbound enquiries (Make.com): valid key creates the full enquiry pipeline; revoked keys are refused.
insert into public.inbound_keys (organization_id, key_hash, key_hint, label)
values ((select v from ids where k = 'hunter'), encode(extensions.digest('test-key-1', 'sha256'), 'hex'), 'key-1', 'Facebook Lead Ads');
select public.submit_inbound_enquiry(encode(extensions.digest('test-key-1', 'sha256'), 'hex'),
  '{"name": "Mia Nguyen", "email": "mia@example.com", "phone": "0400 111 222", "description": "Granny flat at the back of our block",
    "location": "Merewether", "postcode": "2291", "consent": true, "consent_text": "I agree to be contacted about my enquiry.",
    "channel": "Facebook Lead Ads", "category_code": "plumber"}'::jsonb) as inb \gset
select pg_temp.check((:'inb'::jsonb ->> 'ok')::boolean, 'an inbound enquiry is accepted');
select pg_temp.check((select source || '|' || channel from public.enquiries where reference = :'inb'::jsonb ->> 'reference') = 'integration|Facebook Lead Ads via Make.com', 'it is labelled with its channel');
select pg_temp.check((select category_code from public.projects p join public.enquiries e on e.project_id = p.id where e.reference = :'inb'::jsonb ->> 'reference') = 'home_builder', 'an unknown service falls back to the business''s only service');
select pg_temp.check(exists (select 1 from public.tasks where title = 'Respond to Mia Nguyen''s enquiry'), 'a follow-up task is created');
select pg_temp.check(exists (select 1 from public.notification_outbox where kind = 'enquiry.received' and payload ->> 'reference' = :'inb'::jsonb ->> 'reference'), 'the team is notified');
select pg_temp.check((select source from public.contacts where email = 'mia@example.com') = 'integration', 'the contact records where it came from');
select pg_temp.check((public.submit_inbound_enquiry(encode(extensions.digest('test-key-1', 'sha256'), 'hex'),
  '{"name": "Mia Nguyen", "email": "mia@example.com", "phone": "0400 111 222", "description": "Granny flat at the back of our block",
    "location": "Merewether", "postcode": "2291", "consent": true, "channel": "Facebook Lead Ads", "category_code": "plumber"}'::jsonb) ->> 'duplicate')::boolean,
  'a repeated inbound enquiry is linked, not duplicated');
select pg_temp.check(public.submit_inbound_enquiry(encode(extensions.digest('test-key-1', 'sha256'), 'hex'),
  '{"name": "No Consent", "email": "nc@example.com", "description": "Deck", "consent": false}'::jsonb) ->> 'error' = 'consent_required', 'inbound enquiries still need consent');
update public.inbound_keys set revoked_at = now() where key_hint = 'key-1';
select pg_temp.check(public.submit_inbound_enquiry(encode(extensions.digest('test-key-1', 'sha256'), 'hex'),
  '{"name": "Late", "email": "late@example.com", "description": "Deck", "consent": true}'::jsonb) ->> 'error' = 'key_invalid', 'a revoked key is refused');
select pg_temp.check(public.submit_inbound_enquiry(repeat('0', 64), '{}'::jsonb) ->> 'error' = 'key_invalid', 'an unknown key is refused');

-- Only owners see their business's keys.
select pg_temp.as_user('00000000-0000-0000-0000-0000000c0b01');
select pg_temp.check((select count(*) from public.inbound_keys) = 0, 'businesses cannot see each other''s inbound keys');
reset role;

rollback;
