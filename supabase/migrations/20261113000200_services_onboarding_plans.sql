-- Industry templates, service settings, onboarding state machine, plans and usage.
-- Blueprint §2.3, §6, §14.2.

-- ---------------------------------------------------------------------------
-- Global taxonomy (readable by everyone, writable only by migrations)
-- ---------------------------------------------------------------------------
create table public.service_categories (
  code text primary key check (code ~ '^[a-z][a-z0-9_]{1,40}$'),
  name text not null,
  sort int not null default 0
);

create table public.industry_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.service_categories (code),
  version int not null check (version > 0),
  name text not null,
  definition jsonb not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  unique (code, version)
);

-- ---------------------------------------------------------------------------
-- Organisation service settings
-- ---------------------------------------------------------------------------
create table public.org_services (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  category_code text not null references public.service_categories (code),
  template_version int not null default 1,
  focus text not null default 'both' check (focus in ('residential', 'commercial', 'both')),
  created_at timestamptz not null default now(),
  primary key (organization_id, category_code)
);

create table public.service_areas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  label text not null check (char_length(label) between 2 and 80),
  postcode text check (char_length(postcode) <= 12),
  region text check (char_length(region) <= 80),
  radius_km int check (radius_km between 0 and 500),
  created_at timestamptz not null default now()
);
create index service_areas_org_idx on public.service_areas (organization_id);

-- Organisation-level questions: copied from templates, then editable, plus custom ones (§2.3).
create table public.org_questions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  key text not null check (key ~ '^[a-z][a-z0-9_]{1,40}$'),
  label text not null check (char_length(label) between 2 and 160),
  kind text not null check (kind in ('text', 'select', 'yes_no', 'date')),
  options jsonb not null default '[]'::jsonb,
  is_public boolean not null default true,
  required boolean not null default false,
  disqualify_values jsonb not null default '[]'::jsonb,
  source text not null default 'template' check (source in ('template', 'custom')),
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, key)
);

-- ---------------------------------------------------------------------------
-- Onboarding (§6.3): every transition is persisted with actor and time.
-- ---------------------------------------------------------------------------
create table public.onboarding (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  status public.onboarding_status not null default 'not_started',
  completed_steps text[] not null default '{}',
  review_note text,
  updated_at timestamptz not null default now()
);
create trigger onboarding_touch before update on public.onboarding for each row execute function public.touch_updated_at();

create table public.onboarding_transitions (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  from_status public.onboarding_status,
  to_status public.onboarding_status not null,
  actor_id uuid references public.profiles (id) on delete set null,
  actor_kind text not null default 'user' check (actor_kind in ('user', 'system', 'staff')),
  note text,
  created_at timestamptz not null default now()
);
create index onboarding_transitions_org_idx on public.onboarding_transitions (organization_id, created_at);

create or replace function public.onboarding_can_move(from_s public.onboarding_status, to_s public.onboarding_status)
returns boolean language sql immutable set search_path = '' as $$
  select (from_s, to_s) in (
    ('not_started'::public.onboarding_status, 'in_progress'::public.onboarding_status),
    ('in_progress', 'submitted'),
    ('submitted', 'needs_changes'),
    ('submitted', 'approved'),
    ('needs_changes', 'in_progress'),
    ('needs_changes', 'submitted'),
    ('approved', 'active')
  );
$$;

-- Status only changes through this function so the history cannot be skipped.
create or replace function public.move_onboarding(p_org uuid, p_to public.onboarding_status, p_note text default null, p_actor_kind text default 'user')
returns public.onboarding_status language plpgsql security definer set search_path = '' as $$
declare
  cur public.onboarding_status;
begin
  if p_actor_kind = 'user' and not public.is_org_member(p_org) then
    raise exception 'Not a member of that organisation' using errcode = '42501';
  end if;
  insert into public.onboarding (organization_id) values (p_org) on conflict do nothing;
  select status into cur from public.onboarding where organization_id = p_org for update;
  if cur = p_to then
    return cur;
  end if;
  if not public.onboarding_can_move(cur, p_to) then
    raise exception 'Onboarding cannot move from % to %', cur, p_to using errcode = '22023';
  end if;
  update public.onboarding set status = p_to, review_note = coalesce(p_note, review_note) where organization_id = p_org;
  insert into public.onboarding_transitions (organization_id, from_status, to_status, actor_id, actor_kind, note)
  values (p_org, cur, p_to, (select auth.uid()), p_actor_kind, p_note);
  return p_to;
end $$;
revoke execute on function public.move_onboarding(uuid, public.onboarding_status, text, text) from public, anon, authenticated;

-- What a member may call. Members can start and submit; the review step is decided by
-- review_onboarding() (system checks today, Brexoo staff later).
create or replace function public.advance_onboarding(p_to public.onboarding_status)
returns public.onboarding_status language plpgsql security definer set search_path = '' as $$
declare
  org uuid;
begin
  select active_organization_id into org from public.profiles where id = (select auth.uid());
  if org is null or not public.is_org_member(org) then
    raise exception 'No active organisation' using errcode = '42501';
  end if;
  if p_to not in ('in_progress', 'submitted') then
    raise exception 'That step is decided by review' using errcode = '42501';
  end if;
  perform public.move_onboarding(org, p_to);
  if p_to = 'submitted' then
    perform public.review_onboarding(org);
  end if;
  return (select status from public.onboarding where organization_id = org);
end $$;
revoke execute on function public.advance_onboarding(public.onboarding_status) from public, anon;

-- Automated review: approve when the activation essentials are present, otherwise send back
-- with a note listing what's missing. Recorded as a 'system' actor.
create or replace function public.review_onboarding(p_org uuid)
returns public.onboarding_status language plpgsql security definer set search_path = '' as $$
declare
  o public.organizations;
  missing text[] := '{}';
begin
  select * into o from public.organizations where id = p_org;
  if coalesce(o.phone, '') = '' and coalesce(o.website, '') = '' then missing := array_append(missing, 'a phone number or website'); end if;
  if coalesce(o.contact_name, '') = '' then missing := array_append(missing, 'a contact person'); end if;
  if not exists (select 1 from public.org_services s where s.organization_id = p_org) then missing := array_append(missing, 'at least one service'); end if;
  if not exists (select 1 from public.service_areas a where a.organization_id = p_org) then missing := array_append(missing, 'at least one service area'); end if;
  if coalesce(o.settings #>> '{brand,description}', '') = '' then missing := array_append(missing, 'a company description'); end if;

  if cardinality(missing) = 0 then
    perform public.move_onboarding(p_org, 'approved', 'All activation essentials are present.', 'system');
  else
    perform public.move_onboarding(p_org, 'needs_changes', 'Add ' || array_to_string(missing, ', ') || '.', 'system');
  end if;
  return (select status from public.onboarding where organization_id = p_org);
end $$;
revoke execute on function public.review_onboarding(uuid) from public, anon, authenticated;

-- New organisations start with an onboarding row.
create or replace function public.org_bootstrap()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.onboarding (organization_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger organizations_bootstrap after insert on public.organizations for each row execute function public.org_bootstrap();

-- ---------------------------------------------------------------------------
-- Plans, entitlements and usage (§14.2)
-- ---------------------------------------------------------------------------
create table public.plans (
  code text primary key,
  name text not null,
  monthly_price_minor bigint not null check (monthly_price_minor >= 0),
  setup_fee_minor bigint not null check (setup_fee_minor >= 0),
  currency char(3) not null,
  positioning text not null,
  illustrative boolean not null default true,
  sort int not null default 0
);

create table public.plan_entitlements (
  plan_code text not null references public.plans (code) on delete cascade,
  key text not null,
  limit_value int,
  primary key (plan_code, key)
);

create table public.usage_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null check (kind in ('xoo_ai', 'visitor_chat')),
  quantity int not null default 1 check (quantity > 0),
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index usage_events_org_idx on public.usage_events (organization_id, kind, created_at desc);

-- Usage this calendar month against the plan limit. Returns remaining (null = unlimited).
create or replace function public.usage_remaining(p_org uuid, p_kind text)
returns int language plpgsql stable security definer set search_path = '' as $$
declare
  lim int;
  used int;
  ent_key text := case p_kind when 'xoo_ai' then 'xoo_ai_requests_month' when 'visitor_chat' then 'visitor_chat_conversations_month' end;
begin
  if not public.is_org_member(p_org) then
    raise exception 'Not a member of that organisation' using errcode = '42501';
  end if;
  select e.limit_value into lim from public.organizations o
  join public.plan_entitlements e on e.plan_code = o.plan_code and e.key = ent_key
  where o.id = p_org;
  if lim is null then return null; end if;
  select coalesce(sum(quantity), 0) into used from public.usage_events
  where organization_id = p_org and kind = p_kind and created_at >= date_trunc('month', now());
  return greatest(lim - used, 0);
end $$;
revoke execute on function public.usage_remaining(uuid, text) from public, anon;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.service_categories enable row level security;
alter table public.industry_templates enable row level security;
alter table public.org_services enable row level security;
alter table public.service_areas enable row level security;
alter table public.org_questions enable row level security;
alter table public.onboarding enable row level security;
alter table public.onboarding_transitions enable row level security;
alter table public.plans enable row level security;
alter table public.plan_entitlements enable row level security;
alter table public.usage_events enable row level security;

create policy "categories: public read" on public.service_categories for select to anon, authenticated using (true);
create policy "templates: public read published" on public.industry_templates for select to anon, authenticated using (published);
create policy "plans: public read" on public.plans for select to anon, authenticated using (true);
create policy "entitlements: public read" on public.plan_entitlements for select to anon, authenticated using (true);

create policy "org_services: members all" on public.org_services for all to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "service_areas: members all" on public.service_areas for all to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "org_questions: members all" on public.org_questions for all to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

create policy "onboarding: members read" on public.onboarding for select to authenticated
  using (public.is_org_member(organization_id));
-- Step bookkeeping only; status changes go through advance_onboarding().
create policy "onboarding: members track steps" on public.onboarding for update to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "onboarding_transitions: members read" on public.onboarding_transitions for select to authenticated
  using (public.is_org_member(organization_id));

create or replace function public.onboarding_status_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  -- Direct updates by API roles may not change status; move_onboarding runs as the owner role.
  if new.status is distinct from old.status and current_user in ('authenticated', 'anon') then
    raise exception 'Use advance_onboarding() to change status' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger onboarding_status_guard before update on public.onboarding for each row execute function public.onboarding_status_guard();

create policy "usage: members read" on public.usage_events for select to authenticated
  using (public.is_org_member(organization_id));
create policy "usage: members record" on public.usage_events for insert to authenticated
  with check (public.is_org_member(organization_id) and actor_id = (select auth.uid()));

create trigger org_services_no_move before update on public.org_services for each row execute function public.prevent_org_change();
create trigger service_areas_no_move before update on public.service_areas for each row execute function public.prevent_org_change();
create trigger org_questions_no_move before update on public.org_questions for each row execute function public.prevent_org_change();

alter table public.organizations
  add constraint organizations_plan_fk foreign key (plan_code) references public.plans (code) deferrable initially deferred;
