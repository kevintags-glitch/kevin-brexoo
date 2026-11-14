-- 01 · Project Data Collector.
--
-- Brexoo collects project information once, from approved public sources (planning applications,
-- building permits, public tenders) and approved data providers, into a platform-wide pool. Each
-- business then receives its own private copy of the projects that match its services and service
-- areas (as `project_records` under an automatically created discovery source), so the existing
-- Discover, fit and save-to-CRM flows work unchanged and no business sees another's activity.
--
-- Homeowner enquiries from outside tools (Facebook Lead Ads, Google Forms, Hipages…) arrive through
-- a per-business inbound key, usually posted by a Make.com scenario, and go through exactly the same
-- enquiry pipeline as landing-page enquiries.
--
-- The platform tables have RLS enabled and no policies: only the service role (the collector API)
-- reads or writes them. Personal contact details from public registers are never stored.

-- ---------------------------------------------------------------------------------------------
-- Source registry, project pool and run log
-- ---------------------------------------------------------------------------------------------
create table public.platform_sources (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(key) <= 60),
  name text not null check (char_length(name) between 2 and 120),
  kind text not null check (kind in ('permit', 'planning', 'tender', 'provider', 'enquiry')),
  country char(2) not null check (country in ('US', 'AU', 'NZ')),
  region text check (char_length(region) <= 80),
  provider text not null check (char_length(provider) between 2 and 120),
  licence text not null check (char_length(licence) between 2 and 200),
  attribution_url text check (char_length(attribution_url) <= 500),
  permitted_use text not null check (char_length(permitted_use) between 5 and 1000),
  limitations text check (char_length(limitations) <= 1000),
  default_contact_permission text not null default 'not_permitted' check (default_contact_permission in ('unknown', 'permitted', 'not_permitted')),
  enabled boolean not null default true,
  disabled_reason text check (char_length(disabled_reason) <= 300),
  cursor text check (char_length(cursor) <= 200),
  last_run_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.collected_projects (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.platform_sources (id) on delete cascade,
  external_id text not null check (char_length(external_id) between 1 and 200),
  title text not null check (char_length(title) between 2 and 200),
  description text check (char_length(description) <= 4000),
  category_code text references public.service_categories (code),
  -- 'local' projects have a site (permits, applications); 'regional' ones cover a state or region (most tenders).
  scope text not null default 'local' check (scope in ('local', 'regional')),
  country char(2) not null check (country in ('US', 'AU', 'NZ')),
  region text check (char_length(region) <= 80),
  city text check (char_length(city) <= 80),
  suburb text check (char_length(suburb) <= 80),
  postcode text check (char_length(postcode) <= 12),
  address text check (char_length(address) <= 200),
  stage text check (char_length(stage) <= 80),
  estimated_value_minor bigint check (estimated_value_minor >= 0),
  currency char(3),
  observed_at date,
  closes_at date,
  source_url text check (char_length(source_url) <= 500),
  content_hash text not null,
  status text not null default 'active' check (status in ('active', 'closed')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, external_id)
);
create index collected_projects_geo_idx on public.collected_projects (country, postcode);
create index collected_projects_seen_idx on public.collected_projects (source_id, last_seen_at desc);

create table public.collector_runs (
  id bigint generated always as identity primary key,
  source_id uuid not null references public.platform_sources (id) on delete cascade,
  started_at timestamptz,
  finished_at timestamptz not null default now(),
  fetched int not null default 0,
  inserted int not null default 0,
  updated int not null default 0,
  unchanged int not null default 0,
  rejected int not null default 0,
  distributed int not null default 0,
  cursor text,
  errors jsonb not null default '[]'::jsonb
);
create index collector_runs_source_idx on public.collector_runs (source_id, finished_at desc);

alter table public.platform_sources enable row level security;
alter table public.collected_projects enable row level security;
alter table public.collector_runs enable row level security;
revoke all on public.platform_sources, public.collected_projects, public.collector_runs from anon, authenticated;

-- A business's copy of a platform source, and of each collected project.
alter table public.discovery_sources
  add column platform_source_id uuid references public.platform_sources (id) on delete set null,
  add constraint discovery_sources_platform_uniq unique (organization_id, platform_source_id);
alter table public.project_records
  add column collected_project_id uuid references public.collected_projects (id) on delete set null;

-- Businesses can see which platform sources feed them (names, licence, last update), not the pool.
create or replace function public.my_platform_sources(p_org uuid)
returns table (key text, name text, kind text, country char(2), region text, provider text, licence text, attribution_url text,
               enabled boolean, disabled_reason text, last_run_at timestamptz, switched_off boolean, records bigint)
language sql stable security definer set search_path = '' as $$
  select s.key, s.name, s.kind, s.country, s.region, s.provider, s.licence, s.attribution_url, s.enabled, s.disabled_reason, s.last_run_at,
         coalesce(o.settings #> '{discovery,sources_off}', '[]'::jsonb) ? s.key,
         (select count(*) from public.project_records r join public.discovery_sources d on d.id = r.source_id
           where d.organization_id = o.id and d.platform_source_id = s.id)
    from public.platform_sources s
    cross join public.organizations o
   where o.id = p_org and public.is_org_member(p_org)
   order by s.country, s.name;
$$;
revoke execute on function public.my_platform_sources(uuid) from public, anon;
grant execute on function public.my_platform_sources(uuid) to authenticated;

-- Owners switch a platform source on or off for their business.
create or replace function public.set_platform_source_enabled(p_org uuid, p_key text, p_enabled boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_org uuid := p_org;
  v_off jsonb;
begin
  if v_org is null or not public.is_org_owner(v_org) then
    raise exception 'Only owners can change sources' using errcode = '42501';
  end if;
  if not exists (select 1 from public.platform_sources where key = p_key) then
    raise exception 'Unknown source';
  end if;
  select coalesce(settings #> '{discovery,sources_off}', '[]'::jsonb) into v_off from public.organizations where id = v_org;
  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_off from jsonb_array_elements_text(v_off) x where x <> p_key;
  if not p_enabled then v_off := v_off || to_jsonb(p_key); end if;
  update public.organizations
     set settings = jsonb_set(coalesce(settings, '{}'::jsonb), '{discovery}', coalesce(settings -> 'discovery', '{}'::jsonb) || jsonb_build_object('sources_off', v_off))
   where id = v_org;
  perform public.log_audit(v_org, case when p_enabled then 'discovery.source_on' else 'discovery.source_off' end, 'platform_source', null, jsonb_build_object('key', p_key));
end $$;
revoke execute on function public.set_platform_source_enabled(uuid, text, boolean) from public, anon;
grant execute on function public.set_platform_source_enabled(uuid, text, boolean) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Distribution: private copies for every business whose services and areas match.
-- ---------------------------------------------------------------------------------------------
create or replace function public.distribute_collected_projects(p_ids uuid[])
returns int language plpgsql security definer set search_path = '' as $$
declare
  cp record;
  o record;
  v_src uuid;
  v_inserted boolean;
  v_total int := 0;
  v_new jsonb := '{}'::jsonb;
  v_location text;
  k text;
begin
  for cp in
    select c.*, s.id as sid, s.key as skey, s.name as sname, s.provider as sprovider, s.licence as slicence,
           s.attribution_url as surl, s.permitted_use as suse, s.limitations as slimits, s.default_contact_permission as sperm
      from public.collected_projects c join public.platform_sources s on s.id = c.source_id
     where c.id = any (p_ids) and c.status = 'active' and s.enabled
  loop
    v_location := left(nullif(concat_ws(', ', nullif(cp.address, ''), nullif(cp.suburb, ''),
                       nullif(trim(concat_ws(' ', nullif(cp.city, ''), nullif(cp.region, ''), nullif(cp.postcode, ''))), '')), ''), 160);
    for o in
      select org.id
        from public.organizations org
       where not (coalesce(org.settings #> '{discovery,sources_off}', '[]'::jsonb) ? cp.skey)
         -- Service: the business offers this category. Uncategorised tenders go to building businesses.
         and exists (
           select 1 from public.org_services os
            where os.organization_id = org.id
              and (os.category_code = cp.category_code
                   or (cp.category_code is null and os.category_code in ('home_builder', 'property_developer', 'renovation'))))
         -- Area: same rules as the app's areaMatches (postcode, then suburb, then city), or the state for regional tenders.
         and exists (
           select 1 from public.service_areas sa
            where sa.organization_id = org.id
              and (sa.country is null or sa.country = cp.country)
              and (
                (cp.scope = 'regional' and cp.region is not null and sa.state is not null and upper(sa.state) = upper(cp.region))
                or (cp.postcode is not null and sa.postcode is not null and trim(sa.postcode) = trim(cp.postcode))
                or (sa.suburb is not null and cp.suburb is not null and lower(trim(sa.suburb)) = lower(trim(cp.suburb)))
                or (sa.suburb is null and sa.city is not null and cp.city is not null and lower(trim(sa.city)) = lower(trim(cp.city)))
              ))
    loop
      select id into v_src from public.discovery_sources where organization_id = o.id and platform_source_id = cp.sid;
      if v_src is null then
        insert into public.discovery_sources (organization_id, name, source_type, provider, permitted_use, attribution_url, limitations, refresh_note, platform_source_id)
        values (o.id, left('Brexoo · ' || cp.sname, 120), 'public', cp.sprovider,
                left(cp.suse || ' Licence: ' || cp.slicence || '.', 1000), cp.surl, cp.slimits, 'Updated automatically by Brexoo', cp.sid)
        returning id into v_src;
      end if;

      insert into public.project_records as r (organization_id, source_id, external_id, collected_project_id, title, description, category_code,
                                                location_text, postcode, project_stage, estimated_value_minor, currency, timeline, observed_at,
                                                last_verified_at, source_url, contact_permission)
      values (o.id, v_src, cp.id::text, cp.id, cp.title, cp.description, cp.category_code, v_location, cp.postcode, cp.stage,
              cp.estimated_value_minor, cp.currency, case when cp.closes_at is not null then 'Closes ' || to_char(cp.closes_at, 'DD Mon YYYY') end,
              cp.observed_at, now(), cp.source_url, cp.sperm)
      on conflict (source_id, external_id) do update set
        title = excluded.title, description = excluded.description, category_code = excluded.category_code,
        location_text = excluded.location_text, postcode = excluded.postcode, project_stage = excluded.project_stage,
        estimated_value_minor = excluded.estimated_value_minor, currency = excluded.currency, timeline = excluded.timeline,
        observed_at = excluded.observed_at, last_verified_at = now(), source_url = excluded.source_url
      returning (xmax = 0) into v_inserted;

      v_total := v_total + 1;
      if v_inserted then
        v_new := jsonb_set(v_new, array[o.id::text], to_jsonb(coalesce((v_new ->> o.id::text)::int, 0) + 1));
      end if;
    end loop;
  end loop;

  -- One notification per business per batch, shown on its notifications page.
  for k in select jsonb_object_keys(v_new) loop
    perform public.add_activity(k::uuid, null, null, 'discovery.matched',
      case when (v_new ->> k)::int = 1 then '1 new project from Brexoo sources matches your services and areas'
           else (v_new ->> k) || ' new projects from Brexoo sources match your services and areas' end,
      jsonb_build_object('count', (v_new ->> k)::int));
  end loop;
  return v_total;
end $$;
revoke execute on function public.distribute_collected_projects(uuid[]) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Ingestion: called by the collector API with a batch of normalised records.
-- ---------------------------------------------------------------------------------------------
create or replace function public.ingest_collected_projects(p_source_key text, p_records jsonb, p_run jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  src public.platform_sources;
  r jsonb;
  v_old public.collected_projects;
  v_id uuid;
  v_hash text;
  v_ext text;
  v_title text;
  v_cat text;
  v_country text;
  v_ins int := 0;
  v_upd int := 0;
  v_same int := 0;
  v_rej int := 0;
  v_dist int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_changed uuid[] := '{}';
begin
  select * into src from public.platform_sources where key = p_source_key;
  if src.id is null then
    raise exception 'Unknown source %', p_source_key using errcode = '22023';
  end if;
  if jsonb_typeof(p_records) <> 'array' or jsonb_array_length(p_records) > 500 then
    raise exception 'records must be an array of at most 500 items' using errcode = '22023';
  end if;

  for r in select value from jsonb_array_elements(p_records) loop
    begin
      v_ext := left(trim(coalesce(r ->> 'external_id', '')), 200);
      v_title := left(trim(regexp_replace(coalesce(r ->> 'title', ''), '\s+', ' ', 'g')), 200);
      if v_ext = '' or char_length(v_title) < 2 then
        raise exception 'external_id and title are required';
      end if;
      v_cat := nullif(r ->> 'category_code', '');
      if v_cat is not null and not exists (select 1 from public.service_categories where code = v_cat) then v_cat := null; end if;
      v_country := upper(coalesce(nullif(r ->> 'country', ''), src.country));
      -- The hash covers every field that matters to a business, so re-sending an unchanged record is a no-op.
      v_hash := md5(jsonb_build_array(v_title, r ->> 'description', v_cat, r ->> 'scope', v_country, r ->> 'region', r ->> 'city', r ->> 'suburb',
                                      r ->> 'postcode', r ->> 'address', r ->> 'stage', r ->> 'estimated_value_minor', r ->> 'currency',
                                      r ->> 'observed_at', r ->> 'closes_at', r ->> 'source_url', r ->> 'status')::text);

      select * into v_old from public.collected_projects where source_id = src.id and external_id = v_ext;
      if v_old.id is not null and v_old.content_hash = v_hash then
        update public.collected_projects set last_seen_at = now() where id = v_old.id;
        v_same := v_same + 1;
        continue;
      end if;

      insert into public.collected_projects as c (source_id, external_id, title, description, category_code, scope, country, region, city, suburb,
                                                  postcode, address, stage, estimated_value_minor, currency, observed_at, closes_at, source_url,
                                                  content_hash, status)
      values (src.id, v_ext, v_title, left(nullif(trim(r ->> 'description'), ''), 4000), v_cat,
              coalesce(nullif(r ->> 'scope', ''), 'local'), v_country,
              left(nullif(trim(r ->> 'region'), ''), 80), left(nullif(trim(r ->> 'city'), ''), 80), left(nullif(trim(r ->> 'suburb'), ''), 80),
              left(nullif(trim(r ->> 'postcode'), ''), 12), left(nullif(trim(r ->> 'address'), ''), 200), left(nullif(trim(r ->> 'stage'), ''), 80),
              nullif(r ->> 'estimated_value_minor', '')::bigint, upper(nullif(r ->> 'currency', '')),
              nullif(r ->> 'observed_at', '')::date, nullif(r ->> 'closes_at', '')::date,
              left(nullif(trim(r ->> 'source_url'), ''), 500), v_hash, coalesce(nullif(r ->> 'status', ''), 'active'))
      on conflict (source_id, external_id) do update set
        title = excluded.title, description = excluded.description, category_code = excluded.category_code, scope = excluded.scope,
        country = excluded.country, region = excluded.region, city = excluded.city, suburb = excluded.suburb, postcode = excluded.postcode,
        address = excluded.address, stage = excluded.stage, estimated_value_minor = excluded.estimated_value_minor, currency = excluded.currency,
        observed_at = excluded.observed_at, closes_at = excluded.closes_at, source_url = excluded.source_url,
        content_hash = excluded.content_hash, status = excluded.status, last_seen_at = now(), updated_at = now()
      returning c.id into v_id;

      if v_old.id is null then v_ins := v_ins + 1; else v_upd := v_upd + 1; end if;
      v_changed := v_changed || v_id;
    exception when others then
      v_rej := v_rej + 1;
      if jsonb_array_length(v_errors) < 20 then
        v_errors := v_errors || jsonb_build_object('external_id', left(coalesce(r ->> 'external_id', ''), 200), 'error', left(sqlerrm, 200));
      end if;
    end;
  end loop;

  if array_length(v_changed, 1) > 0 then
    v_dist := public.distribute_collected_projects(v_changed);
  end if;

  update public.platform_sources
     set cursor = coalesce(left(nullif(p_run ->> 'cursor', ''), 200), cursor), last_run_at = now()
   where id = src.id;

  insert into public.collector_runs (source_id, started_at, fetched, inserted, updated, unchanged, rejected, distributed, cursor, errors)
  values (src.id, nullif(p_run ->> 'started_at', '')::timestamptz, coalesce(nullif(p_run ->> 'fetched', '')::int, jsonb_array_length(p_records)),
          v_ins, v_upd, v_same, v_rej, v_dist, left(nullif(p_run ->> 'cursor', ''), 200), v_errors);

  return jsonb_build_object('inserted', v_ins, 'updated', v_upd, 'unchanged', v_same, 'rejected', v_rej, 'distributed', v_dist, 'errors', v_errors);
end $$;
revoke execute on function public.ingest_collected_projects(text, jsonb, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Approved sources (the collector's connectors use these keys).
-- ---------------------------------------------------------------------------------------------
insert into public.platform_sources (key, name, kind, country, region, provider, licence, attribution_url, permitted_use, limitations, enabled, disabled_reason) values
  ('nsw-planning-da', 'NSW Planning Portal applications', 'planning', 'AU', 'NSW', 'NSW Department of Planning, Housing and Infrastructure',
   'Creative Commons Attribution 4.0 (NSW Government open data)', 'https://www.planningportal.nsw.gov.au/opendata',
   'Identify proposed building work from lodged development applications and complying development certificates.',
   'Public register: applicant and owner details are not collected, and contacting people found here for marketing is not permitted. Approach through your own channels or tender processes.',
   true, null),
  ('austender-construction', 'AusTender construction contracts', 'tender', 'AU', null, 'Australian Government Department of Finance',
   'Creative Commons Attribution 3.0 Australia', 'https://www.tenders.gov.au/',
   'Find awarded Commonwealth construction contracts (UNSPSC 72) as subcontracting opportunities.',
   'Contract notices describe awarded work. Contact the awarded supplier through normal business channels; no personal details are collected.',
   true, null),
  ('austin-permits', 'Austin building permits', 'permit', 'US', 'TX', 'City of Austin Open Data',
   'Public domain (City of Austin open data terms)', 'https://data.austintexas.gov/',
   'Identify issued residential and commercial building permits in Austin, Texas.',
   'Public record: contractor and owner contact details are not collected.', true, null),
  ('chicago-permits', 'Chicago building permits', 'permit', 'US', 'IL', 'City of Chicago Data Portal',
   'City of Chicago Data Portal terms of use', 'https://data.cityofchicago.org/',
   'Identify issued building permits in Chicago, Illinois.',
   'Public record: contractor and owner contact details are not collected.', true, null),
  ('nyc-permits', 'New York City DOB permits', 'permit', 'US', 'NY', 'NYC Department of Buildings (NYC Open Data)',
   'NYC Open Data terms of use', 'https://opendata.cityofnewyork.us/',
   'Identify approved building permits in New York City.',
   'Public record: applicant, owner and filing representative details are not collected.', true, null),
  ('nz-gets-tenders', 'NZ Government Electronic Tenders (GETS)', 'tender', 'NZ', null, 'New Zealand Government Procurement (MBIE)',
   'GETS terms of use', 'https://www.gets.govt.nz/',
   'Find open New Zealand government construction tenders.',
   'Collected only from GETS''s published notice feed for construction categories; buyer contact details are not collected.',
   false, 'Waiting for confirmation of the official GETS notice feed and its terms before the first run.');

-- ---------------------------------------------------------------------------------------------
-- Inbound homeowner enquiries (Make.com and other tools), through the same pipeline as page enquiries.
-- ---------------------------------------------------------------------------------------------
alter table public.enquiries drop constraint enquiries_source_check;
alter table public.enquiries add constraint enquiries_source_check check (source in ('landing_page', 'visitor_chat', 'manual', 'integration'));
alter table public.enquiries add column channel text check (char_length(channel) <= 80);
alter table public.contacts drop constraint contacts_source_check;
alter table public.contacts add constraint contacts_source_check check (source in ('landing_page', 'visitor_chat', 'manual', 'import', 'integration'));

create table public.inbound_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  key_hash text not null unique check (key_hash ~ '^[0-9a-f]{64}$'),
  key_hint text not null check (char_length(key_hint) between 4 and 12),
  label text not null default 'Make.com' check (char_length(label) between 2 and 80),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
create index inbound_keys_org_idx on public.inbound_keys (organization_id, created_at desc);
alter table public.inbound_keys enable row level security;
create policy "inbound keys: owners read" on public.inbound_keys for select to authenticated using (public.is_org_owner(organization_id));
create policy "inbound keys: owners create" on public.inbound_keys for insert to authenticated
  with check (public.is_org_owner(organization_id) and created_by = (select auth.uid()));
create policy "inbound keys: owners revoke" on public.inbound_keys for update to authenticated
  using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create trigger inbound_keys_no_move before update on public.inbound_keys for each row execute function public.prevent_org_change();
revoke all on public.inbound_keys from anon;

-- Shared validation for every enquiry channel. Returns an error code, or null when the payload is valid.
create or replace function public.enquiry_payload_error(p jsonb)
returns text language plpgsql immutable set search_path = '' as $$
declare
  v_name text := trim(coalesce(p ->> 'name', ''));
  v_email text := nullif(lower(trim(coalesce(p ->> 'email', ''))), '');
  v_phone text := nullif(trim(coalesce(p ->> 'phone', '')), '');
  v_norm text := regexp_replace(coalesce(v_phone, ''), '[^0-9]', '', 'g');
begin
  if char_length(v_name) < 1 then return 'name_required'; end if;
  if v_email is null and v_phone is null then return 'contact_required'; end if;
  if v_email is not null and (v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 254) then return 'email_invalid'; end if;
  if v_phone is not null and (char_length(v_norm) < 6 or char_length(v_phone) > 40) then return 'phone_invalid'; end if;
  if char_length(trim(coalesce(p ->> 'description', ''))) < 3 then return 'description_required'; end if;
  if coalesce((p ->> 'consent')::boolean, false) is not true then return 'consent_required'; end if;
  return null;
end $$;

-- Shared enquiry pipeline: dedupe, contact, project, enquiry, opportunity, follow-up task, notification.
-- Callers validate (enquiry_payload_error), rate-limit and resolve the organisation first.
create or replace function public.create_enquiry(p_org uuid, p jsonb, p_source text, p_page uuid, p_channel text, p_strict_category boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  org public.organizations;
  v_name text := left(trim(coalesce(p ->> 'name', '')), 120);
  v_email text := nullif(lower(trim(coalesce(p ->> 'email', ''))), '');
  v_phone text := nullif(trim(coalesce(p ->> 'phone', '')), '');
  v_phone_norm text := nullif(regexp_replace(coalesce(nullif(trim(coalesce(p ->> 'phone', '')), ''), ''), '[^0-9+]', '', 'g'), '');
  v_category text := nullif(p ->> 'category_code', '');
  v_description text := left(trim(coalesce(p ->> 'description', '')), 4000);
  v_location text := left(nullif(trim(coalesce(p ->> 'location', '')), ''), 160);
  v_postcode text := left(nullif(trim(coalesce(p ->> 'postcode', '')), ''), 12);
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
  v_from text;
  q record;
begin
  select * into org from public.organizations where id = p_org;
  if v_preferred is not null and v_preferred not in ('email', 'phone', 'sms', 'any') then v_preferred := null; end if;

  -- Category must be one the business offers; default when it offers exactly one.
  if v_category is not null and not exists (select 1 from public.org_services s where s.organization_id = org.id and s.category_code = v_category) then
    if p_strict_category then
      return jsonb_build_object('ok', false, 'error', 'category_invalid');
    end if;
    v_category := null;
  end if;
  if v_category is null and (select count(*) from public.org_services s where s.organization_id = org.id) = 1 then
    select s.category_code into v_category from public.org_services s where s.organization_id = org.id;
  end if;
  select name into v_category_name from public.service_categories where code = v_category;

  -- Keep only answers to this business's public questions, as short strings.
  for q in select key from public.org_questions where organization_id = org.id and is_public and active loop
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
    values (org.id, v_name, v_email, v_phone, v_preferred, p_source, v_owner)
    returning id into v_contact;
  else
    update public.contacts set email = coalesce(email, v_email), phone = coalesce(phone, v_phone), preferred_contact = coalesce(preferred_contact, v_preferred)
     where id = v_contact;
  end if;

  insert into public.projects (organization_id, contact_id, title, category_code, template_version, location_text, postcode, description, budget_label, currency, start_timing, details)
  values (org.id, v_contact, coalesce(v_category_name, 'Project') || coalesce(' · ' || v_location, ''), v_category,
          (select s.template_version from public.org_services s where s.organization_id = org.id and s.category_code = v_category),
          v_location, v_postcode, v_description, nullif(v_answers ->> 'budget_range', ''), org.currency, nullif(v_answers ->> 'start_timing', ''), v_answers)
  returning id into v_project;

  insert into public.enquiries (organization_id, contact_id, project_id, landing_page_id, source, channel, answers, message, consent_text, consent_at, dedupe_hash)
  values (org.id, v_contact, v_project, p_page, p_source, left(p_channel, 80), v_answers, v_description,
          left(coalesce(p ->> 'consent_text', 'Consented to be contacted about this enquiry.'), 500), now(), v_hash)
  returning * into v_enquiry;

  insert into public.opportunities (organization_id, title, contact_id, project_id, enquiry_id, owner_id, currency)
  values (org.id, coalesce(v_category_name, 'Enquiry') || ' — ' || v_name, v_contact, v_project, v_enquiry.id, v_owner, org.currency)
  returning id into v_opp;

  v_from := case p_source when 'visitor_chat' then 'the website chat'
                          when 'integration' then coalesce(nullif(p_channel, ''), 'an integration')
                          else 'the landing page' end;
  perform public.add_activity(org.id, v_opp, v_contact, 'enquiry_received', 'Enquiry ' || v_enquiry.reference || ' received from ' || v_from,
    jsonb_build_object('enquiry_id', v_enquiry.id, 'reference', v_enquiry.reference));

  insert into public.tasks (organization_id, title, due_at, assignee_id, opportunity_id, contact_id)
  values (org.id, 'Respond to ' || v_name || '''s enquiry', now() + make_interval(hours => v_response_hours), v_owner, v_opp, v_contact);

  insert into public.notification_outbox (organization_id, kind, payload, dedupe_key)
  values (org.id, 'enquiry.received', jsonb_build_object('enquiry_id', v_enquiry.id, 'reference', v_enquiry.reference, 'opportunity_id', v_opp,
          'contact_name', v_name, 'category', v_category_name, 'owner_id', v_owner), 'enquiry.received:' || v_enquiry.id);

  return jsonb_build_object('ok', true, 'reference', v_enquiry.reference, 'duplicate', false);
end $$;
revoke execute on function public.create_enquiry(uuid, jsonb, text, uuid, text, boolean) from public, anon, authenticated;

-- Landing page and chat enquiries: unchanged behaviour, now on the shared pipeline.
create or replace function public.submit_public_enquiry(p_slug text, p jsonb, p_fingerprint text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  page public.landing_pages;
  v_error text := public.enquiry_payload_error(p);
  v_source text := coalesce(nullif(p ->> 'source', ''), 'landing_page');
begin
  if v_error is not null then return jsonb_build_object('ok', false, 'error', v_error); end if;
  if v_source not in ('landing_page', 'visitor_chat') then v_source := 'landing_page'; end if;

  if not public.hit_rate_limit('enq:fp:' || left(coalesce(p_fingerprint, 'none'), 128), interval '10 minutes', 5)
     or not public.hit_rate_limit('enq:page:' || lower(p_slug), interval '1 hour', 120) then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  -- The organisation comes only from trusted, published page configuration.
  select * into page from public.landing_pages where slug = lower(p_slug) and status = 'published';
  if page.id is null then return jsonb_build_object('ok', false, 'error', 'page_unavailable'); end if;

  return public.create_enquiry(page.organization_id, p, v_source, page.id, null, true);
end $$;
revoke execute on function public.submit_public_enquiry(text, jsonb, text) from public;
grant execute on function public.submit_public_enquiry(text, jsonb, text) to anon, authenticated;

-- Enquiries posted by an outside tool with a business's inbound key (service role only: the API
-- route hashes the key from the URL and calls this).
create or replace function public.submit_inbound_enquiry(p_key_hash text, p jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  k public.inbound_keys;
  v_error text := public.enquiry_payload_error(p);
  v_result jsonb;
begin
  select * into k from public.inbound_keys where key_hash = p_key_hash and revoked_at is null;
  if k.id is null then return jsonb_build_object('ok', false, 'error', 'key_invalid'); end if;
  if not public.hit_rate_limit('inbound:' || k.id, interval '10 minutes', 120) then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;
  if v_error is not null then return jsonb_build_object('ok', false, 'error', v_error); end if;

  v_result := public.create_enquiry(k.organization_id, p, 'integration', null,
                                    left(coalesce(nullif(trim(p ->> 'channel'), ''), k.label) || ' via Make.com', 80), false);
  update public.inbound_keys set last_used_at = now() where id = k.id;
  return v_result;
end $$;
revoke execute on function public.submit_inbound_enquiry(text, jsonb) from public, anon, authenticated;
