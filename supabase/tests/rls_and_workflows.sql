-- Tenant isolation, public access and workflow tests (blueprint §15.4, §21.1, §21.2).
-- Runs inside one transaction and rolls back. Any failed assertion raises and stops the run.
-- Usage: bash scripts/db-test.sh
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

create function pg_temp.as_admin() returns void language plpgsql as $$
begin
  execute 'reset role';
end $$;

create function pg_temp.check(ok boolean, label text) returns void language plpgsql as $$
begin
  if ok is not true then
    raise exception 'FAILED: %', label;
  end if;
  raise notice 'ok - %', label;
end $$;

-- Fixtures: three verified users. Alice owns Acme, Bob owns Bayside, Mia is a member of Acme.
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'alice@acme.test', now(), '{"full_name":"Alice Owner"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'bob@bayside.test', now(), '{"full_name":"Bob Owner"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c1', 'mia@acme.test', now(), '{"full_name":"Mia Member"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d1', 'unverified@x.test', null, '{}', 'authenticated', 'authenticated');

create temp table ids (k text primary key, v uuid);
grant all on ids to authenticated, anon;

-- ---------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
do $$ begin
  perform public.create_organization('Nope', 'nope-co');
  raise exception 'FAILED: unverified user created an organisation';
exception when insufficient_privilege then raise notice 'ok - unverified email cannot create an organisation';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
insert into ids values ('acme', public.create_organization('Acme Builds', 'acme-builds', 'Australia/Sydney'));
select pg_temp.check((select role from public.memberships where organization_id = (select v from ids where k = 'acme')) = 'owner', 'creator becomes owner');
select pg_temp.check((select status from public.onboarding where organization_id = (select v from ids where k = 'acme')) = 'not_started', 'onboarding row created');

-- Onboarding: status can't be set directly; missing essentials send it back.
do $$ begin
  update public.onboarding set status = 'active' where organization_id = (select v from ids where k = 'acme');
  raise exception 'FAILED: onboarding status changed directly';
exception when insufficient_privilege then raise notice 'ok - onboarding status cannot be set directly';
end $$;
select public.advance_onboarding('in_progress');
select pg_temp.check(public.advance_onboarding('submitted') = 'needs_changes', 'incomplete onboarding is sent back');
select pg_temp.check((select review_note from public.onboarding where organization_id = (select v from ids where k = 'acme')) like 'Add %', 'review note lists what is missing');

update public.organizations set phone = '0400 000 000', contact_name = 'Alice', settings = '{"brand":{"description":"Custom homes on the coast."}}'
where id = (select v from ids where k = 'acme');
insert into public.org_services (organization_id, category_code) values ((select v from ids where k = 'acme'), 'home_builder'), ((select v from ids where k = 'acme'), 'renovation');
insert into public.service_areas (organization_id, label) values ((select v from ids where k = 'acme'), 'Newcastle NSW');
insert into public.org_questions (organization_id, key, label, kind, options, is_public) values
  ((select v from ids where k = 'acme'), 'land_owned', 'Do you own the land?', 'select', '["Yes","Not yet"]', true),
  ((select v from ids where k = 'acme'), 'internal_score', 'Internal note', 'text', '[]', false);
select public.advance_onboarding('in_progress');
select pg_temp.check(public.advance_onboarding('submitted') = 'approved', 'complete onboarding is approved');
select pg_temp.check((select count(*) from public.onboarding_transitions where organization_id = (select v from ids where k = 'acme')) = 6, 'every onboarding transition is recorded');

-- Landing page lifecycle
insert into public.landing_pages (organization_id, slug, title, draft)
values ((select v from ids where k = 'acme'), 'acme-homes', 'Acme Homes', '{"headline":"Build on your block"}')
returning id as page_id \gset
do $$ begin
  update public.landing_pages set status = 'published' where slug = 'acme-homes';
  raise exception 'FAILED: page published by direct update';
exception when insufficient_privilege then raise notice 'ok - page status cannot be set directly';
end $$;
do $$ begin
  perform public.publish_landing_page((select id from public.landing_pages where slug = 'acme-homes'));
  raise exception 'FAILED: unapproved page published';
exception when invalid_parameter_value then raise notice 'ok - unapproved page cannot publish';
end $$;
select public.submit_landing_page(:'page_id');
select pg_temp.check((select status from public.landing_pages where id = :'page_id') = 'awaiting_approval', 'submitted page awaits approval');

-- Mia (member) may not approve or publish.
select pg_temp.as_admin();
insert into public.memberships (organization_id, user_id, role) values ((select v from ids where k = 'acme'), '00000000-0000-0000-0000-0000000000c1', 'member');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
do $$ begin
  perform public.approve_landing_page((select id from public.landing_pages where slug = 'acme-homes'));
  raise exception 'FAILED: member approved a page';
exception when insufficient_privilege then raise notice 'ok - members cannot approve pages';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
select public.approve_landing_page(:'page_id');
select public.publish_landing_page(:'page_id');
select pg_temp.check((select status from public.landing_pages where id = :'page_id') = 'published', 'owner publishes approved page');
select pg_temp.check((select status from public.onboarding where organization_id = (select v from ids where k = 'acme')) = 'active', 'first publish activates onboarding');
do $$ begin
  update public.landing_page_versions set content = '{}' where page_id = (select id from public.landing_pages where slug = 'acme-homes');
  if found then raise exception 'FAILED: version content changed'; end if;
  raise notice 'ok - published snapshots are immutable';
end $$;

-- Editing the draft of a live page keeps the live snapshot.
update public.landing_pages set draft = '{"headline":"Changed"}' where id = :'page_id';
select pg_temp.check((select status from public.landing_pages where id = :'page_id') = 'published', 'live page stays live while draft changes');

-- ---------------------------------------------------------------------------
-- Anonymous visitor
select pg_temp.as_anon();
select pg_temp.check(public.get_public_page('acme-homes') #>> '{content,headline}' = 'Build on your block', 'public page serves the published snapshot');
select pg_temp.check(jsonb_array_length(public.get_public_page('acme-homes') -> 'questions') = 1, 'internal questions are not public');
select pg_temp.check(public.get_public_page('nope') is null, 'unknown page returns nothing');
do $$ begin
  perform 1 from public.contacts;
  raise exception 'FAILED: anon read contacts';
exception when insufficient_privilege then raise notice 'ok - anon cannot read contacts';
end $$;
do $$ begin
  perform 1 from public.organizations;
  raise exception 'FAILED: anon read organisations';
exception when insufficient_privilege then raise notice 'ok - anon cannot read organisations';
end $$;

select pg_temp.check(public.submit_public_enquiry('acme-homes', '{"name":"Jane","email":"jane@example.com","description":"New home","category_code":"home_builder","consent":true,"answers":{"land_owned":"Yes","internal_score":"9"}}', 'fp1') ->> 'ok' = 'true', 'valid enquiry accepted');
select pg_temp.check((public.submit_public_enquiry('acme-homes', '{"name":"Jane","email":"jane@example.com","description":"New  home","category_code":"home_builder","consent":true}', 'fp1') ->> 'duplicate')::boolean, 'resubmission is deduplicated');
select pg_temp.check(public.submit_public_enquiry('acme-homes', '{"name":"Jane","email":"jane@example.com","description":"x y z","category_code":"plumber","consent":true}', 'fp2') ->> 'error' = 'category_invalid', 'unoffered category rejected');
select pg_temp.check(public.submit_public_enquiry('acme-homes', '{"name":"Jane","email":"jane@example.com","description":"New home"}', 'fp3') ->> 'error' = 'consent_required', 'consent required');
select pg_temp.check(public.submit_public_enquiry('acme-homes', '{"name":"Jane","description":"New home","consent":true}', 'fp3') ->> 'error' = 'contact_required', 'a contact method is required');
select pg_temp.check(public.submit_public_enquiry('acme-homes', '{"name":"Ray","phone":"0411 222 333","description":"Kitchen reno","category_code":"renovation","consent":true}', 'fp4') ->> 'ok' = 'true', 'phone-only enquiry accepted');
do $$
declare i int; r jsonb;
begin
  for i in 1..6 loop
    r := public.submit_public_enquiry('acme-homes', jsonb_build_object('name', 'Spam', 'email', 's' || i || '@x.test', 'description', 'spam ' || i, 'consent', true, 'category_code', 'home_builder'), 'fp-spam');
  end loop;
  if r ->> 'error' <> 'rate_limited' then raise exception 'FAILED: rate limit (%)', r; end if;
  raise notice 'ok - rate limit blocks repeated submissions';
end $$;

-- ---------------------------------------------------------------------------
-- Alice sees the enquiry and everything created with it.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
select pg_temp.check((select count(*) from public.enquiries where answers ? 'internal_score') = 0, 'non-public answers are discarded');
select pg_temp.check((select duplicate_count from public.enquiries e join public.contacts c on c.id = e.contact_id where c.email = 'jane@example.com') = 1, 'duplicate counted on the original');
select pg_temp.check((select count(*) from public.opportunities where stage = 'new') >= 2, 'opportunities created in New');
select pg_temp.check((select count(*) from public.tasks where title like 'Respond to%') >= 2, 'follow-up task created');
select pg_temp.check((select count(*) from public.notification_outbox where kind = 'enquiry.received') >= 2, 'notification queued in outbox');
select pg_temp.check((select count(*) from public.activity_events where kind = 'enquiry_received') >= 2, 'timeline records receipt');

select o.id as opp_id, o.contact_id as contact_id from public.opportunities o join public.contacts c on c.id = o.contact_id where c.email = 'jane@example.com' \gset
do $$ begin
  update public.opportunities set stage = 'lost' where title like 'Home builders — Jane';
  raise exception 'FAILED: lost without reason';
exception when check_violation then raise notice 'ok - lost requires a reason';
end $$;
update public.opportunities set stage = 'reviewing' where id = :'opp_id';
select pg_temp.check((select first_response_at is not null from public.enquiries e join public.opportunities o on o.enquiry_id = e.id where o.id = :'opp_id'), 'first response time recorded');
insert into public.appointments (organization_id, opportunity_id, contact_id, type, starts_at, ends_at, timezone)
values ((select v from ids where k = 'acme'), :'opp_id', :'contact_id', 'site_visit', now() + interval '2 days', now() + interval '2 days 1 hour', 'Australia/Sydney');
select pg_temp.check((select stage from public.opportunities where id = :'opp_id') = 'appointment_booked', 'booking advances the stage');
update public.opportunities set stage = 'won', value_minor = 45000000 where id = :'opp_id';
select pg_temp.check((select closed_at is not null from public.opportunities where id = :'opp_id'), 'won sets closed_at');
select pg_temp.check((select count(*) from public.activity_events where opportunity_id = :'opp_id') >= 4, 'full activity history');

-- ---------------------------------------------------------------------------
-- Bob (another tenant) sees and changes nothing of Acme's.
select set_config('test.opp', :'opp_id', false);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
insert into ids values ('bay', public.create_organization('Bayside Plumbing', 'bayside-plumbing'));
select pg_temp.check((select count(*) from public.contacts) = 0, 'other tenant reads no contacts');
select pg_temp.check((select count(*) from public.enquiries) = 0, 'other tenant reads no enquiries');
select pg_temp.check((select count(*) from public.opportunities where id = :'opp_id') = 0, 'id substitution reveals nothing');
select pg_temp.check((select count(*) from public.activity_events) = 0, 'other tenant reads no activity');
select pg_temp.check((select count(*) from public.landing_pages) = 0, 'other tenant reads no pages');
do $$ begin
  update public.opportunities set stage = 'lost', loss_reason = 'other' where id = current_setting('test.opp')::uuid;
  if found then raise exception 'FAILED: other tenant updated by id'; end if;
  raise notice 'ok - other tenant cannot update by id';
end $$;
do $$ begin
  insert into public.tasks (organization_id, title) values ((select v from ids where k = 'acme'), 'sneaky');
  raise exception 'FAILED: inserted into another tenant';
exception when insufficient_privilege then raise notice 'ok - cannot insert into another tenant';
end $$;
do $$ begin
  -- Bob's own org, but pointing at Acme's opportunity: blocked by the composite key.
  execute format('insert into public.tasks (organization_id, title, opportunity_id) values (%L, %L, %L)',
    (select v from ids where k = 'bay'), 'cross link', current_setting('test.opp'));
  raise exception 'FAILED: cross-tenant reference accepted';
exception
  when foreign_key_violation then raise notice 'ok - cross-tenant references are rejected';
end $$;
do $$ begin
  perform public.set_active_organization((select v from ids where k = 'acme'));
  raise exception 'FAILED: switched into a foreign org';
exception when insufficient_privilege then raise notice 'ok - cannot switch into a foreign organisation';
end $$;
do $$ begin
  perform public.usage_remaining((select v from ids where k = 'acme'), 'xoo_ai');
  raise exception 'FAILED: read foreign usage';
exception when insufficient_privilege then raise notice 'ok - usage is tenant-scoped';
end $$;

rollback;
