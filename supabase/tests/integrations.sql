-- Make.com integration: owner-only access, URL allowlist, event fan-out and notification reads.
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
  ('00000000-0000-0000-0000-00000000d1a1', 'owner@int.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000d1b1', 'other@int.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000d1c1', 'member@int.test', now(), 'authenticated', 'authenticated');
create temp table ids (k text primary key, v uuid);
grant all on ids to authenticated;

select pg_temp.as_user('00000000-0000-0000-0000-00000000d1a1');
insert into ids values ('org', public.create_organization('Int Builders', 'int-builders'));

do $$ begin
  insert into public.integrations (organization_id, url, created_by)
  values ((select v from ids where k = 'org'), 'https://evil.example.com/hook', '00000000-0000-0000-0000-00000000d1a1');
  raise exception 'FAILED: non-Make URL accepted';
exception when check_violation then raise notice 'ok - only Make.com webhook URLs are accepted';
end $$;

insert into public.integrations (organization_id, url, events, created_by)
values ((select v from ids where k = 'org'), 'https://hook.us1.make.com/abcDEF123456', array['enquiry.received', 'opportunity.won'], '00000000-0000-0000-0000-00000000d1a1');
select pg_temp.check((select length(secret) from public.integrations) = 48, 'a signing secret is generated');

-- A member of the same organisation can't see the integration (it holds the secret).
reset role;
insert into public.memberships (organization_id, user_id, role) values ((select v from ids where k = 'org'), '00000000-0000-0000-0000-00000000d1c1', 'member');
select pg_temp.as_user('00000000-0000-0000-0000-00000000d1c1');
select pg_temp.check((select count(*) from public.integrations) = 0, 'members cannot read integrations');
update public.integrations set url = 'https://hook.eu1.make.com/stolen123456';
reset role;
select pg_temp.check((select url from public.integrations) = 'https://hook.us1.make.com/abcDEF123456', 'members cannot change integrations');

-- Another organisation sees nothing.
select pg_temp.as_user('00000000-0000-0000-0000-00000000d1b1');
select pg_temp.check((select count(*) from public.integrations) = 0, 'other organisations cannot read integrations');
reset role;

-- Fan-out: an enquiry notification queues a webhook delivery; unsubscribed events don't.
insert into public.notification_outbox (organization_id, kind, payload, dedupe_key)
values ((select v from ids where k = 'org'), 'enquiry.received', '{"reference":"REF00001","contact_name":"Pat"}', 'enquiry.received:test-1');
select pg_temp.check((select count(*) from public.notification_outbox where kind = 'webhook.make' and payload ->> 'event' = 'enquiry.received') = 1, 'new enquiries fan out to the webhook');
select pg_temp.check((select payload #>> '{data,reference}' from public.notification_outbox where kind = 'webhook.make') = 'REF00001', 'the webhook payload carries the reference');

select pg_temp.as_user('00000000-0000-0000-0000-00000000d1a1');
insert into public.contacts (organization_id, full_name, email) values ((select v from ids where k = 'org'), 'Won Client', 'won@example.com') returning id as contact \gset
insert into public.opportunities (organization_id, title, contact_id) values ((select v from ids where k = 'org'), 'Kitchen', :'contact') returning id as opp \gset
insert into public.appointments (organization_id, opportunity_id, contact_id, type, starts_at, ends_at, timezone)
values ((select v from ids where k = 'org'), :'opp', :'contact', 'phone', now() + interval '1 day', now() + interval '1 day 30 minutes', 'Australia/Sydney');
update public.opportunities set stage = 'won', value_minor = 1200000 where id = :'opp';
reset role;
select pg_temp.check((select count(*) from public.notification_outbox where kind = 'webhook.make' and payload ->> 'event' = 'appointment.booked') = 0, 'unsubscribed events are not sent');
select pg_temp.check((select count(*) from public.notification_outbox where kind = 'webhook.make' and payload ->> 'event' = 'opportunity.won') = 1, 'won opportunities fan out once');

-- Pausing stops new deliveries.
update public.integrations set enabled = false;
insert into public.notification_outbox (organization_id, kind, payload, dedupe_key)
values ((select v from ids where k = 'org'), 'enquiry.received', '{}', 'enquiry.received:test-2');
select pg_temp.check((select count(*) from public.notification_outbox where kind = 'webhook.make' and payload ->> 'event' = 'enquiry.received') = 1, 'paused integrations receive nothing');
select pg_temp.check((select count(*) from public.audit_events where action like 'integration.%') >= 2, 'integration changes are audited');

-- Users can mark their own notifications read, but not someone else's.
select pg_temp.as_user('00000000-0000-0000-0000-00000000d1c1');
update public.profiles set notifications_seen_at = now() where id = '00000000-0000-0000-0000-00000000d1a1';
update public.profiles set notifications_seen_at = now() where id = '00000000-0000-0000-0000-00000000d1c1';
reset role;
select pg_temp.check((select notifications_seen_at is null from public.profiles where id = '00000000-0000-0000-0000-00000000d1a1'), 'cannot mark another user''s notifications read');
select pg_temp.check((select notifications_seen_at is not null from public.profiles where id = '00000000-0000-0000-0000-00000000d1c1'), 'can mark own notifications read');

rollback;
