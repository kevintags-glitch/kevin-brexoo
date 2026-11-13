-- Public booking requests: availability reveals only free times, taken slots are refused,
-- and booking the appointment confirms the request.
\set ON_ERROR_STOP on
begin;

create function pg_temp.as_user(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;
create function pg_temp.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  execute 'set local role anon';
end $$;
create function pg_temp.check(ok boolean, label text) returns void language plpgsql as $$
begin
  if ok is not true then raise exception 'FAILED: %', label; end if;
  raise notice 'ok - %', label;
end $$;

insert into auth.users (id, email, email_confirmed_at, aud, role) values ('00000000-0000-0000-0000-00000000b0a1', 'owner@booking.test', now(), 'authenticated', 'authenticated');
create temp table ids (k text primary key, v uuid);
grant all on ids to authenticated, anon;

select pg_temp.as_user('00000000-0000-0000-0000-00000000b0a1');
insert into ids values ('org', public.create_organization('Book Builders', 'book-builders', 'Australia/Sydney', 'AU', 'AUD'));
update public.organizations set phone = '0400 000 000', contact_name = 'Bo',
  settings = '{"brand":{"description":"Homes built well."},"appointments":{"days":[1,2,3,4,5,6,7],"start":"09:00","end":"12:00","meeting_minutes":60,"buffer_minutes":0,"meeting_types":["phone","site_visit"]}}'
where id = (select v from ids where k = 'org');
insert into public.org_services (organization_id, category_code) values ((select v from ids where k = 'org'), 'home_builder');
insert into public.service_areas (organization_id, label) values ((select v from ids where k = 'org'), 'Newcastle NSW');
select public.advance_onboarding('in_progress');
select public.advance_onboarding('submitted');
insert into public.landing_pages (organization_id, slug, title, draft) values ((select v from ids where k = 'org'), 'book-builders', 'Book Builders', '{"headline":"Hi"}') returning id as page_id \gset
select public.submit_landing_page(:'page_id');
select public.approve_landing_page(:'page_id');
select public.publish_landing_page(:'page_id');

-- Tomorrow 09:00–10:00 is taken by an existing appointment.
insert into public.contacts (organization_id, full_name, email) values ((select v from ids where k = 'org'), 'Existing', 'existing@example.com') returning id as c1 \gset
insert into public.appointments (organization_id, contact_id, type, starts_at, ends_at, timezone)
values ((select v from ids where k = 'org'), :'c1', 'phone',
        (((now() at time zone 'Australia/Sydney')::date + 1) + time '09:00') at time zone 'Australia/Sydney',
        (((now() at time zone 'Australia/Sydney')::date + 1) + time '10:00') at time zone 'Australia/Sydney', 'Australia/Sydney');
reset role;

select pg_temp.as_anon();
select public.get_public_availability('book-builders', 14) as av \gset
select pg_temp.check((:'av'::jsonb ->> 'ok')::boolean, 'availability is public for a published page');
select pg_temp.check((select array_agg(k order by k) from jsonb_object_keys(:'av'::jsonb) k) = array['minutes', 'ok', 'slots', 'timezone', 'types'], 'availability returns only times and settings, nothing about bookings');
select pg_temp.check(jsonb_array_length(:'av'::jsonb -> 'slots') = 13 * 5 + 3, 'business hours, meeting length and the existing booking shape the free slots');
select pg_temp.check(public.get_public_availability('nope') ->> 'ok' = 'false', 'unknown pages have no availability');

create temp table slots as select (s #>> '{}')::timestamptz as s from jsonb_array_elements(:'av'::jsonb -> 'slots') s;
select (public.submit_public_enquiry('book-builders', '{"name":"Ann","email":"ann@example.com","description":"New home","consent":true}', 'fpb1') ->> 'reference') as ref1 \gset
select public.request_public_booking('book-builders', :'ref1', (select min(s) from slots), 'site_visit') as r1 \gset
select pg_temp.check((:'r1'::jsonb ->> 'ok')::boolean, 'a free slot can be requested');
select pg_temp.check(public.request_public_booking('book-builders', :'ref1', (select max(s) from slots), 'phone') ->> 'error' = 'enquiry_not_found', 'an enquiry can request a time only once');

select (public.submit_public_enquiry('book-builders', '{"name":"Ben","email":"ben@example.com","description":"Extension","consent":true}', 'fpb2') ->> 'reference') as ref2 \gset
select pg_temp.check(public.request_public_booking('book-builders', :'ref2', (select min(s) from slots), 'site_visit') ->> 'error' = 'slot_taken', 'a slot someone else requested is no longer offered');
select pg_temp.check(public.request_public_booking('book-builders', :'ref2',
  (((now() at time zone 'Australia/Sydney')::date + 1) + time '09:00') at time zone 'Australia/Sydney', 'phone') ->> 'error' = 'slot_taken', 'a booked slot cannot be requested');
select pg_temp.check(public.request_public_booking('book-builders', :'ref2', (select max(s) from slots), 'video') ->> 'error' = 'type_unavailable', 'only offered appointment types can be requested');
select pg_temp.check(public.request_public_booking('book-builders', :'ref2', now() + interval '3 hours 7 minutes', 'phone') ->> 'error' = 'slot_taken', 'off-grid times are refused');
reset role;

select pg_temp.as_user('00000000-0000-0000-0000-00000000b0a1');
select pg_temp.check((select booking_status from public.enquiries where reference = :'ref1') = 'requested', 'the request waits for the business');
select pg_temp.check((select t.title from public.tasks t join public.opportunities o on o.id = t.opportunity_id join public.enquiries e on e.id = o.enquiry_id where e.reference = :'ref1') like 'Confirm requested site visit%', 'the follow-up task asks to confirm the time');
insert into public.appointments (organization_id, opportunity_id, contact_id, type, starts_at, ends_at, timezone)
select e.organization_id, o.id, e.contact_id, 'site_visit', e.requested_start, e.requested_start + interval '1 hour', 'Australia/Sydney'
from public.enquiries e join public.opportunities o on o.enquiry_id = e.id where e.reference = :'ref1';
select pg_temp.check((select booking_status from public.enquiries where reference = :'ref1') = 'confirmed', 'booking the appointment confirms the request');

update public.organizations set settings = jsonb_set(settings, '{appointments,requests}', 'false') where id = (select v from ids where k = 'org');
reset role;
select pg_temp.as_anon();
select pg_temp.check(jsonb_array_length(public.get_public_availability('book-builders') -> 'slots') = 0, 'turning requests off hides all times');
reset role;

rollback;
