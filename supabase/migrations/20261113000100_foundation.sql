-- Foundation: shared enums, profiles, organisations (tenants), memberships, invitations,
-- tenant helpers and the audit log. Blueprint §15, §20.4 (migrations 001–005).

create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums (explicit states with documented transitions, §15.3)
-- ---------------------------------------------------------------------------
create type public.member_role as enum ('owner', 'member');
create type public.onboarding_status as enum ('not_started', 'in_progress', 'submitted', 'needs_changes', 'approved', 'active');
create type public.page_status as enum ('draft', 'internal_review', 'awaiting_approval', 'approved', 'published', 'paused', 'archived');
create type public.opp_stage as enum ('new', 'reviewing', 'contact_attempted', 'connected', 'qualified', 'appointment_booked', 'proposal', 'won', 'lost');
create type public.loss_reason as enum ('no_response', 'outside_area', 'budget_mismatch', 'timing', 'competitor', 'not_a_fit', 'other');
create type public.qual_status as enum ('unreviewed', 'qualifying', 'qualified', 'disqualified');
create type public.task_status as enum ('open', 'done', 'cancelled');
create type public.appt_type as enum ('phone', 'video', 'site_visit');
create type public.appt_status as enum ('scheduled', 'confirmed', 'attended', 'no_show', 'cancelled', 'rescheduled');

-- ---------------------------------------------------------------------------
-- Shared trigger helpers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- A tenant-owned row never moves between organisations.
create or replace function public.prevent_org_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id cannot change' using errcode = '42501';
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email extensions.citext,
  full_name text check (char_length(full_name) <= 120),
  timezone text not null default 'UTC',
  active_organization_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Organisations (tenants) and memberships
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug extensions.citext not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$'),
  website text check (char_length(website) <= 300),
  phone text check (char_length(phone) <= 40),
  contact_name text check (char_length(contact_name) <= 120),
  country text not null default 'AU' check (char_length(country) = 2),
  timezone text not null default 'Australia/Sydney',
  currency char(3) not null default 'AUD',
  plan_code text not null default 'launch',
  -- Onboarding answers that are not queried relationally (ideal work, operations, engagement,
  -- appointment preferences, brand copy). Structured data lives in its own tables.
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger organizations_touch before update on public.organizations for each row execute function public.touch_updated_at();

alter table public.profiles
  add constraint profiles_active_org_fk foreign key (active_organization_id) references public.organizations (id) on delete set null;

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);
-- Second key to profiles so the API can embed member names (profiles.id = auth.users.id).
alter table public.memberships add constraint memberships_profile_fk foreign key (user_id) references public.profiles (id) on delete cascade;

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email extensions.citext not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role public.member_role not null default 'member',
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now()
);
create unique index invitations_open_unique on public.invitations (organization_id, email) where accepted_at is null;

-- ---------------------------------------------------------------------------
-- Tenant helpers. SECURITY DEFINER so policies can call them without recursing into the
-- memberships policies; they only ever answer for the calling user (auth.uid()).
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_org_owner(org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org and m.user_id = (select auth.uid()) and m.role = 'owner'
  );
$$;

-- ---------------------------------------------------------------------------
-- Audit log (§13, §17.1). Insert-only through log_audit(); members read their own org.
-- ---------------------------------------------------------------------------
create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_events_org_idx on public.audit_events (organization_id, created_at desc);

create or replace function public.log_audit(org uuid, p_action text, p_entity text, p_entity_id uuid, p_data jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_events (organization_id, actor_id, action, entity, entity_id, data)
  values (org, (select auth.uid()), p_action, p_entity, p_entity_id, coalesce(p_data, '{}'::jsonb));
$$;
revoke execute on function public.log_audit(uuid, text, text, uuid, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.audit_events enable row level security;

create policy "profiles: read self and teammates" on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.memberships mine
      join public.memberships theirs on theirs.organization_id = mine.organization_id
      where mine.user_id = (select auth.uid()) and theirs.user_id = profiles.id
    )
  );
create policy "profiles: update self" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "organizations: members read" on public.organizations for select to authenticated
  using (public.is_org_member(id));
create policy "organizations: owners update" on public.organizations for update to authenticated
  using (public.is_org_owner(id)) with check (public.is_org_owner(id));

create policy "memberships: members read" on public.memberships for select to authenticated
  using (public.is_org_member(organization_id));
create policy "memberships: owners change roles" on public.memberships for update to authenticated
  using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy "memberships: owners remove, members leave" on public.memberships for delete to authenticated
  using (public.is_org_owner(organization_id) or user_id = (select auth.uid()));

create policy "invitations: members read" on public.invitations for select to authenticated
  using (public.is_org_member(organization_id));
create policy "invitations: owners create" on public.invitations for insert to authenticated
  with check (public.is_org_owner(organization_id) and invited_by = (select auth.uid()));
create policy "invitations: owners revoke" on public.invitations for delete to authenticated
  using (public.is_org_owner(organization_id));

create policy "audit: members read" on public.audit_events for select to authenticated
  using (organization_id is not null and public.is_org_member(organization_id));

-- An org always keeps at least one owner.
create or replace function public.keep_one_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  org uuid := coalesce(old.organization_id, new.organization_id);
begin
  if exists (select 1 from public.organizations o where o.id = org) and not exists (
    select 1 from public.memberships m where m.organization_id = org and m.role = 'owner'
  ) then
    raise exception 'An organisation needs at least one owner' using errcode = '23514';
  end if;
  return null;
end $$;
create constraint trigger memberships_keep_owner after update or delete on public.memberships
  deferrable initially deferred for each row execute function public.keep_one_owner();
create trigger memberships_no_org_move before update on public.memberships for each row execute function public.prevent_org_change();

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Creates the organisation and its owner membership in one transaction (§6.1 step 3).
create or replace function public.create_organization(p_name text, p_slug text, p_timezone text default 'Australia/Sydney', p_country text default 'AU', p_currency text default 'AUD')
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  org uuid;
begin
  if uid is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;
  if not exists (select 1 from auth.users u where u.id = uid and u.email_confirmed_at is not null) then
    raise exception 'Verify your email first' using errcode = '42501';
  end if;
  if (select count(*) from public.memberships m where m.user_id = uid and m.role = 'owner') >= 5 then
    raise exception 'Organisation limit reached' using errcode = '54000';
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'Unknown time zone' using errcode = '22023';
  end if;

  insert into public.organizations (name, slug, timezone, country, currency, created_by)
  values (trim(p_name), lower(trim(p_slug)), p_timezone, upper(p_country), upper(p_currency), uid)
  returning id into org;

  insert into public.memberships (organization_id, user_id, role) values (org, uid, 'owner');
  update public.profiles set active_organization_id = org where id = uid;
  perform public.log_audit(org, 'organization.created', 'organization', org, jsonb_build_object('name', p_name));
  return org;
end $$;
revoke execute on function public.create_organization(text, text, text, text, text) from public, anon;

-- Accept an invitation addressed to the signed-in user's verified email.
create or replace function public.accept_invitation(p_token uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  inv public.invitations;
  user_email text;
begin
  select u.email into user_email from auth.users u where u.id = uid and u.email_confirmed_at is not null;
  if user_email is null then
    raise exception 'Verify your email first' using errcode = '42501';
  end if;
  select * into inv from public.invitations i
  where i.token = p_token and i.accepted_at is null and i.expires_at > now()
  for update;
  if inv.id is null or lower(inv.email::text) <> lower(user_email) then
    raise exception 'This invitation is not valid for your account' using errcode = '42501';
  end if;

  insert into public.memberships (organization_id, user_id, role) values (inv.organization_id, uid, inv.role)
  on conflict (organization_id, user_id) do nothing;
  update public.invitations set accepted_at = now() where id = inv.id;
  update public.profiles set active_organization_id = inv.organization_id where id = uid;
  perform public.log_audit(inv.organization_id, 'membership.joined', 'membership', uid, jsonb_build_object('role', inv.role));
  return inv.organization_id;
end $$;
revoke execute on function public.accept_invitation(uuid) from public, anon;

-- Switch the active organisation (only to one the user belongs to).
create or replace function public.set_active_organization(p_org uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_org_member(p_org) then
    raise exception 'Not a member of that organisation' using errcode = '42501';
  end if;
  update public.profiles set active_organization_id = p_org where id = (select auth.uid());
end $$;
revoke execute on function public.set_active_organization(uuid) from public, anon;

revoke execute on function public.is_org_member(uuid) from public, anon;
revoke execute on function public.is_org_owner(uuid) from public, anon;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_owner(uuid) to authenticated;
