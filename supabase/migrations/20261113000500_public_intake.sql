-- Public surfaces: published page read model, enquiry submission, demo requests, rate limits,
-- notification outbox and brand asset storage. Blueprint §5.3, §7.4, §16.2, §17.1.
--
-- Anonymous visitors never read tables directly. They call two SECURITY DEFINER functions that
-- resolve the organisation from a *published* page only and return no private CRM data.

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security; -- no policies: definer functions only

create or replace function public.hit_rate_limit(p_key text, p_window interval, p_max int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / extract(epoch from p_window)) * extract(epoch from p_window));
  n int;
begin
  insert into public.rate_limits as r (key, window_start, hits) values (p_key, w, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into n;
  -- Opportunistic clean-up of old windows.
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '2 days';
  end if;
  return n <= p_max;
end $$;
revoke execute on function public.hit_rate_limit(text, interval, int) from public, anon, authenticated;

-- Durable outbox: the enquiry is committed first; notifications are retried separately and a
-- delivery failure never removes the enquiry (§7.4, §16.2).
create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'skipped')),
  attempts int not null default 0,
  last_error text,
  dedupe_key text unique,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index notification_outbox_due_idx on public.notification_outbox (status, next_attempt_at);
alter table public.notification_outbox enable row level security;
create policy "outbox: members read" on public.notification_outbox for select to authenticated
  using (organization_id is not null and public.is_org_member(organization_id));

-- Job runner API (service role only): claim a batch, then report each result.
create or replace function public.claim_notifications(p_limit int default 20)
returns setof public.notification_outbox language sql security definer set search_path = '' as $$
  update public.notification_outbox o
     set status = 'processing', attempts = o.attempts + 1
   where o.id in (
     select id from public.notification_outbox
     where status in ('pending', 'failed') and attempts < 6 and next_attempt_at <= now()
     order by created_at
     limit p_limit
     for update skip locked
   )
  returning o.*;
$$;

create or replace function public.finish_notification(p_id uuid, p_ok boolean, p_error text default null, p_skipped boolean default false)
returns void language sql security definer set search_path = '' as $$
  update public.notification_outbox
     set status = case when p_skipped then 'skipped' when p_ok then 'sent' else 'failed' end,
         sent_at = case when p_ok or p_skipped then now() else null end,
         last_error = left(p_error, 500),
         -- exponential backoff: 1, 2, 4, 8, 16 minutes
         next_attempt_at = case when p_ok or p_skipped then next_attempt_at else now() + make_interval(mins => power(2, attempts - 1)::int) end
   where id = p_id;
$$;
revoke execute on function public.claim_notifications(int) from public, anon, authenticated;
revoke execute on function public.finish_notification(uuid, boolean, text, boolean) from public, anon, authenticated;
grant execute on function public.claim_notifications(int) to service_role;
grant execute on function public.finish_notification(uuid, boolean, text, boolean) to service_role;

-- ---------------------------------------------------------------------------
-- Published page read model
-- ---------------------------------------------------------------------------
create or replace function public.get_public_page(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'page_id', p.id,
    'slug', p.slug,
    'title', p.title,
    'content', v.content,
    'published_at', p.published_at,
    'business', jsonb_build_object(
      'name', o.name,
      'website', o.website,
      'phone', o.phone,
      'timezone', o.timezone,
      'country', o.country,
      'description', o.settings #>> '{brand,description}',
      'logo_url', o.settings #>> '{brand,logo_url}'
    ),
    'services', coalesce((
      select jsonb_agg(jsonb_build_object('code', c.code, 'name', c.name) order by c.sort)
      from public.org_services s join public.service_categories c on c.code = s.category_code
      where s.organization_id = o.id
    ), '[]'::jsonb),
    'areas', coalesce((
      select jsonb_agg(a.label order by a.label) from public.service_areas a where a.organization_id = o.id
    ), '[]'::jsonb),
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object('key', q.key, 'label', q.label, 'kind', q.kind, 'options', q.options, 'required', q.required) order by q.sort)
      from public.org_questions q where q.organization_id = o.id and q.is_public and q.active
    ), '[]'::jsonb)
  )
  from public.landing_pages p
  join public.landing_page_versions v on v.id = p.published_version_id
  join public.organizations o on o.id = p.organization_id
  where p.slug = lower(p_slug) and p.status = 'published';
$$;
grant execute on function public.get_public_page(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Enquiry submission (§7.4). Validate → rate limit → resolve org from the published page →
-- dedupe → save contact, project, enquiry, opportunity, follow-up task → enqueue notification.
-- ---------------------------------------------------------------------------
create or replace function public.submit_public_enquiry(p_slug text, p jsonb, p_fingerprint text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  page public.landing_pages;
  org public.organizations;
  v_name text := left(trim(coalesce(p ->> 'name', '')), 120);
  v_email text := nullif(lower(trim(coalesce(p ->> 'email', ''))), '');
  v_phone text := nullif(trim(coalesce(p ->> 'phone', '')), '');
  v_phone_norm text;
  v_category text := nullif(p ->> 'category_code', '');
  v_description text := left(trim(coalesce(p ->> 'description', '')), 4000);
  v_location text := left(nullif(trim(coalesce(p ->> 'location', '')), ''), 160);
  v_postcode text := left(nullif(trim(coalesce(p ->> 'postcode', '')), ''), 12);
  v_source text := coalesce(nullif(p ->> 'source', ''), 'landing_page');
  v_preferred text := nullif(p ->> 'preferred_contact', '');
  v_answers jsonb := '{}'::jsonb;
  v_hash text;
  v_existing public.enquiries;
  v_contact uuid;
  v_project uuid;
  v_enquiry public.enquiries;
  v_opp uuid;
  v_owner uuid;
  v_category_name text;
  v_response_hours int;
  q record;
begin
  -- Validation
  if char_length(v_name) < 1 then
    return jsonb_build_object('ok', false, 'error', 'name_required');
  end if;
  if v_email is null and v_phone is null then
    return jsonb_build_object('ok', false, 'error', 'contact_required');
  end if;
  if v_email is not null and (v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 254) then
    return jsonb_build_object('ok', false, 'error', 'email_invalid');
  end if;
  v_phone_norm := nullif(regexp_replace(coalesce(v_phone, ''), '[^0-9+]', '', 'g'), '');
  if v_phone is not null and (char_length(regexp_replace(v_phone_norm, '[^0-9]', '', 'g')) < 6 or char_length(v_phone) > 40) then
    return jsonb_build_object('ok', false, 'error', 'phone_invalid');
  end if;
  if char_length(v_description) < 3 then
    return jsonb_build_object('ok', false, 'error', 'description_required');
  end if;
  if coalesce((p ->> 'consent')::boolean, false) is not true then
    return jsonb_build_object('ok', false, 'error', 'consent_required');
  end if;
  if v_source not in ('landing_page', 'visitor_chat') then v_source := 'landing_page'; end if;
  if v_preferred is not null and v_preferred not in ('email', 'phone', 'sms', 'any') then v_preferred := null; end if;

  -- Rate limits: per visitor fingerprint and per page.
  if not public.hit_rate_limit('enq:fp:' || left(coalesce(p_fingerprint, 'none'), 128), interval '10 minutes', 5)
     or not public.hit_rate_limit('enq:page:' || lower(p_slug), interval '1 hour', 120) then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  -- The organisation comes only from trusted, published page configuration.
  select * into page from public.landing_pages where slug = lower(p_slug) and status = 'published';
  if page.id is null then
    return jsonb_build_object('ok', false, 'error', 'page_unavailable');
  end if;
  select * into org from public.organizations where id = page.organization_id;

  -- Category must be one the business offers; default when it offers exactly one.
  if v_category is null then
    if (select count(*) from public.org_services s where s.organization_id = org.id) = 1 then
      select s.category_code into v_category from public.org_services s where s.organization_id = org.id;
    end if;
  elsif not exists (select 1 from public.org_services s where s.organization_id = org.id and s.category_code = v_category) then
    return jsonb_build_object('ok', false, 'error', 'category_invalid');
  end if;
  select name into v_category_name from public.service_categories where code = v_category;

  -- Keep only answers to this business's public questions, as short strings.
  for q in select key, kind, options from public.org_questions where organization_id = org.id and is_public and active loop
    if p -> 'answers' ? q.key and jsonb_typeof(p -> 'answers' -> q.key) in ('string', 'boolean', 'number') then
      v_answers := v_answers || jsonb_build_object(q.key, left(p -> 'answers' ->> q.key, 300));
    end if;
  end loop;

  -- Duplicate check: same person, service and description within 24 hours.
  v_hash := md5(concat_ws('|', org.id, coalesce(v_email, ''), coalesce(v_phone_norm, ''), coalesce(v_category, ''), lower(regexp_replace(v_description, '\s+', ' ', 'g'))));
  select * into v_existing from public.enquiries
  where organization_id = org.id and dedupe_hash = v_hash and received_at > now() - interval '24 hours'
  order by received_at desc limit 1;
  if v_existing.id is not null then
    update public.enquiries set duplicate_count = duplicate_count + 1 where id = v_existing.id;
    return jsonb_build_object('ok', true, 'reference', v_existing.reference, 'duplicate', true);
  end if;

  -- Owner for follow-up: configured default, else the first owner.
  v_owner := nullif(org.settings #>> '{operations,default_owner_id}', '')::uuid;
  if v_owner is null or not exists (select 1 from public.memberships m where m.organization_id = org.id and m.user_id = v_owner) then
    select m.user_id into v_owner from public.memberships m where m.organization_id = org.id and m.role = 'owner' order by m.created_at limit 1;
  end if;
  v_response_hours := coalesce(nullif(org.settings #>> '{operations,response_hours}', '')::int, 4);

  -- Contact: match by email, then phone; fill gaps but never overwrite what's recorded.
  if v_email is not null then
    select id into v_contact from public.contacts where organization_id = org.id and email = v_email and merged_into is null;
  end if;
  if v_contact is null and v_phone_norm is not null then
    select id into v_contact from public.contacts where organization_id = org.id and phone_normalized = v_phone_norm and merged_into is null
    order by created_at limit 1;
  end if;
  if v_contact is null then
    insert into public.contacts (organization_id, full_name, email, phone, preferred_contact, source, owner_id)
    values (org.id, v_name, v_email, v_phone, v_preferred, v_source, v_owner)
    returning id into v_contact;
  else
    update public.contacts set
      email = coalesce(email, v_email),
      phone = coalesce(phone, v_phone),
      preferred_contact = coalesce(preferred_contact, v_preferred)
    where id = v_contact;
  end if;

  insert into public.projects (organization_id, contact_id, title, category_code, template_version, location_text, postcode, description, budget_label, currency, start_timing, details)
  values (
    org.id, v_contact,
    coalesce(v_category_name, 'Project') || coalesce(' · ' || v_location, ''),
    v_category,
    (select s.template_version from public.org_services s where s.organization_id = org.id and s.category_code = v_category),
    v_location, v_postcode, v_description,
    nullif(v_answers ->> 'budget_range', ''), org.currency,
    nullif(v_answers ->> 'start_timing', ''),
    v_answers
  )
  returning id into v_project;

  insert into public.enquiries (organization_id, contact_id, project_id, landing_page_id, source, answers, message, consent_text, consent_at, dedupe_hash)
  values (org.id, v_contact, v_project, page.id, v_source, v_answers, v_description,
          left(coalesce(p ->> 'consent_text', 'Consented to be contacted about this enquiry.'), 500), now(), v_hash)
  returning * into v_enquiry;

  insert into public.opportunities (organization_id, title, contact_id, project_id, enquiry_id, owner_id, currency)
  values (org.id, coalesce(v_category_name, 'Enquiry') || ' — ' || v_name, v_contact, v_project, v_enquiry.id, v_owner, org.currency)
  returning id into v_opp;

  perform public.add_activity(org.id, v_opp, v_contact, 'enquiry_received',
    'Enquiry ' || v_enquiry.reference || ' received from ' || case v_source when 'visitor_chat' then 'the website chat' else 'the landing page' end,
    jsonb_build_object('enquiry_id', v_enquiry.id, 'reference', v_enquiry.reference));

  insert into public.tasks (organization_id, title, due_at, assignee_id, opportunity_id, contact_id)
  values (org.id, 'Respond to ' || v_name || '''s enquiry', now() + make_interval(hours => v_response_hours), v_owner, v_opp, v_contact);

  insert into public.notification_outbox (organization_id, kind, payload, dedupe_key)
  values (org.id, 'enquiry.received', jsonb_build_object(
    'enquiry_id', v_enquiry.id, 'reference', v_enquiry.reference, 'opportunity_id', v_opp,
    'contact_name', v_name, 'category', v_category_name, 'owner_id', v_owner
  ), 'enquiry.received:' || v_enquiry.id);

  return jsonb_build_object('ok', true, 'reference', v_enquiry.reference, 'duplicate', false);
end $$;
revoke execute on function public.submit_public_enquiry(text, jsonb, text) from public;
grant execute on function public.submit_public_enquiry(text, jsonb, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Marketing demo requests (§5.1 "Demo / Contact")
-- ---------------------------------------------------------------------------
create table public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 1 and 120),
  email extensions.citext not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  company text check (char_length(company) <= 120),
  industry text references public.service_categories (code),
  team_size text check (char_length(team_size) <= 20),
  message text check (char_length(message) <= 2000),
  consent_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.demo_requests enable row level security; -- no policies: read by staff tools later

create or replace function public.submit_demo_request(p jsonb, p_fingerprint text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_name text := left(trim(coalesce(p ->> 'name', '')), 120);
  v_email text := lower(trim(coalesce(p ->> 'email', '')));
  v_industry text := nullif(p ->> 'industry', '');
begin
  if char_length(v_name) < 1 then return jsonb_build_object('ok', false, 'error', 'name_required'); end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('ok', false, 'error', 'email_invalid'); end if;
  if coalesce((p ->> 'consent')::boolean, false) is not true then return jsonb_build_object('ok', false, 'error', 'consent_required'); end if;
  if v_industry is not null and not exists (select 1 from public.service_categories where code = v_industry) then v_industry := null; end if;
  if not public.hit_rate_limit('demo:fp:' || left(coalesce(p_fingerprint, 'none'), 128), interval '1 hour', 5)
     or not public.hit_rate_limit('demo:all', interval '1 hour', 500) then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;
  insert into public.demo_requests (full_name, email, company, industry, team_size, message, consent_at)
  values (v_name, v_email, left(nullif(trim(p ->> 'company'), ''), 120), v_industry, left(nullif(p ->> 'team_size', ''), 20), left(nullif(trim(p ->> 'message'), ''), 2000), now());
  insert into public.notification_outbox (kind, payload) values ('demo.requested', jsonb_build_object('email', v_email, 'name', v_name));
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function public.submit_demo_request(jsonb, text) from public;
grant execute on function public.submit_demo_request(jsonb, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Brand assets: logos and approved project images shown on public pages. Readable by anyone
-- (they are published content); writable only by members, inside their organisation's folder.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brand-assets', 'brand-assets', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

create or replace function public.storage_org_from_path(p_name text)
returns uuid language sql immutable set search_path = '' as $$
  select case when split_part(p_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(p_name, '/', 1)::uuid end;
$$;

create policy "brand-assets: members upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'brand-assets' and public.is_org_member(public.storage_org_from_path(name)));
create policy "brand-assets: members update" on storage.objects for update to authenticated
  using (bucket_id = 'brand-assets' and public.is_org_member(public.storage_org_from_path(name)));
create policy "brand-assets: members delete" on storage.objects for delete to authenticated
  using (bucket_id = 'brand-assets' and public.is_org_member(public.storage_org_from_path(name)));

-- Defence in depth: anonymous API callers get no table privileges on tenant data at all
-- (RLS would already return nothing). Public reads go through the definer functions above.
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'organizations', 'memberships', 'invitations', 'audit_events', 'org_services', 'service_areas',
    'org_questions', 'onboarding', 'onboarding_transitions', 'usage_events', 'landing_pages', 'landing_page_versions',
    'contacts', 'projects', 'enquiries', 'opportunities', 'qualification_records', 'tasks', 'notes', 'appointments',
    'activity_events', 'rate_limits', 'notification_outbox', 'demo_requests'
  ] loop
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;
