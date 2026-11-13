-- Landing pages with immutable versions, approval and authorised publishing. Blueprint §7.

create table public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  slug extensions.citext not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$'),
  title text not null check (char_length(title) between 2 and 120),
  status public.page_status not null default 'draft',
  draft jsonb not null default '{}'::jsonb,
  submitted_version_id uuid,
  published_version_id uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id)
);
create index landing_pages_org_idx on public.landing_pages (organization_id);
create trigger landing_pages_touch before update on public.landing_pages for each row execute function public.touch_updated_at();
create trigger landing_pages_no_move before update on public.landing_pages for each row execute function public.prevent_org_change();

-- A snapshot is written whenever a draft is submitted for approval. It never changes afterwards
-- except for the approval stamp.
create table public.landing_page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null,
  organization_id uuid not null,
  version int not null,
  content jsonb not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  unique (page_id, version),
  foreign key (page_id, organization_id) references public.landing_pages (id, organization_id) on delete cascade
);

alter table public.landing_pages
  add constraint landing_pages_submitted_fk foreign key (submitted_version_id) references public.landing_page_versions (id) on delete set null,
  add constraint landing_pages_published_fk foreign key (published_version_id) references public.landing_page_versions (id) on delete set null;

alter table public.landing_pages enable row level security;
alter table public.landing_page_versions enable row level security;

create policy "pages: members read" on public.landing_pages for select to authenticated
  using (public.is_org_member(organization_id));
create policy "pages: members create" on public.landing_pages for insert to authenticated
  with check (public.is_org_member(organization_id) and status = 'draft' and published_version_id is null and submitted_version_id is null);
create policy "pages: members edit draft" on public.landing_pages for update to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "versions: members read" on public.landing_page_versions for select to authenticated
  using (public.is_org_member(organization_id));

-- Members may edit the draft, title and slug; status and version pointers only move through the
-- RPCs below (they run as the table owner, so this guard does not apply to them).
create or replace function public.landing_page_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') and (
    new.status is distinct from old.status
    or new.submitted_version_id is distinct from old.submitted_version_id
    or new.published_version_id is distinct from old.published_version_id
    or new.published_at is distinct from old.published_at
  ) then
    raise exception 'Use the page workflow actions to change status' using errcode = '42501';
  end if;
  -- Editing the draft after submission returns the page to draft (the snapshot stays as it was).
  -- On a live or paused page the pending (unpublished) snapshot is dropped; the live one stays.
  if new.draft is distinct from old.draft then
    if old.status in ('awaiting_approval', 'approved') then
      new.status := 'draft';
      new.submitted_version_id := null;
    elsif old.status in ('published', 'paused') then
      new.submitted_version_id := old.published_version_id;
    end if;
  end if;
  return new;
end $$;
create trigger landing_pages_guard before update on public.landing_pages for each row execute function public.landing_page_guard();

-- Draft → Awaiting approval: snapshot the draft into an immutable version.
create or replace function public.submit_landing_page(p_page uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  p public.landing_pages;
  v_id uuid;
  next_version int;
begin
  select * into p from public.landing_pages where id = p_page for update;
  if p.id is null or not public.is_org_member(p.organization_id) then
    raise exception 'Page not found' using errcode = '42501';
  end if;
  if p.status not in ('draft', 'paused', 'published', 'approved', 'awaiting_approval') then
    raise exception 'This page cannot be submitted from %', p.status using errcode = '22023';
  end if;
  if coalesce(p.draft ->> 'headline', '') = '' then
    raise exception 'Add a headline before submitting' using errcode = '22023';
  end if;
  select coalesce(max(version), 0) + 1 into next_version from public.landing_page_versions where page_id = p.id;
  insert into public.landing_page_versions (page_id, organization_id, version, content, created_by)
  values (p.id, p.organization_id, next_version, p.draft, (select auth.uid()))
  returning id into v_id;
  -- A live page stays live on its published version while the new one awaits approval.
  update public.landing_pages
    set status = case when status = 'published' then 'published'::public.page_status else 'awaiting_approval' end,
        submitted_version_id = v_id
  where id = p.id;
  perform public.log_audit(p.organization_id, 'landing_page.submitted', 'landing_page', p.id, jsonb_build_object('version', next_version));
  return v_id;
end $$;

-- Owner approves the submitted snapshot.
create or replace function public.approve_landing_page(p_page uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  p public.landing_pages;
begin
  select * into p from public.landing_pages where id = p_page for update;
  if p.id is null or not public.is_org_owner(p.organization_id) then
    raise exception 'Only an owner can approve a page' using errcode = '42501';
  end if;
  if p.submitted_version_id is null then
    raise exception 'There is no submitted version to approve' using errcode = '22023';
  end if;
  update public.landing_page_versions set approved_by = (select auth.uid()), approved_at = now()
  where id = p.submitted_version_id and approved_at is null;
  update public.landing_pages set status = case when status = 'published' then status else 'approved' end where id = p.id;
  perform public.log_audit(p.organization_id, 'landing_page.approved', 'landing_page', p.id, jsonb_build_object('version_id', p.submitted_version_id));
end $$;

-- Owner publishes an approved snapshot. Plan limits apply to the number of live pages.
create or replace function public.publish_landing_page(p_page uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  p public.landing_pages;
  approved boolean;
  live_limit int;
  live_count int;
begin
  select * into p from public.landing_pages where id = p_page for update;
  if p.id is null or not public.is_org_owner(p.organization_id) then
    raise exception 'Only an owner can publish a page' using errcode = '42501';
  end if;
  select v.approved_at is not null into approved from public.landing_page_versions v where v.id = p.submitted_version_id;
  if not coalesce(approved, false) then
    raise exception 'Approve the page before publishing' using errcode = '22023';
  end if;
  select e.limit_value into live_limit from public.organizations o
  join public.plan_entitlements e on e.plan_code = o.plan_code and e.key = 'published_pages'
  where o.id = p.organization_id;
  select count(*) into live_count from public.landing_pages
  where organization_id = p.organization_id and status = 'published' and id <> p.id;
  if live_limit is not null and live_count >= live_limit then
    raise exception 'Your plan allows % published page(s)', live_limit using errcode = '54000';
  end if;

  update public.landing_page_versions set published_at = now() where id = p.submitted_version_id;
  update public.landing_pages
    set status = 'published', published_version_id = p.submitted_version_id, published_at = now()
  where id = p.id;
  perform public.log_audit(p.organization_id, 'landing_page.published', 'landing_page', p.id, jsonb_build_object('version_id', p.submitted_version_id));

  -- First live page activates an approved onboarding.
  if (select status from public.onboarding where organization_id = p.organization_id) = 'approved' then
    perform public.move_onboarding(p.organization_id, 'active', 'First landing page published.', 'system');
  end if;
end $$;

create or replace function public.set_landing_page_paused(p_page uuid, p_paused boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  p public.landing_pages;
begin
  select * into p from public.landing_pages where id = p_page for update;
  if p.id is null or not public.is_org_owner(p.organization_id) then
    raise exception 'Only an owner can pause or resume a page' using errcode = '42501';
  end if;
  if p_paused and p.status <> 'published' then
    raise exception 'Only a published page can be paused' using errcode = '22023';
  end if;
  if not p_paused and (p.status <> 'paused' or p.published_version_id is null) then
    raise exception 'Only a paused page can be resumed' using errcode = '22023';
  end if;
  update public.landing_pages set status = case when p_paused then 'paused'::public.page_status else 'published' end where id = p.id;
  perform public.log_audit(p.organization_id, case when p_paused then 'landing_page.paused' else 'landing_page.resumed' end, 'landing_page', p.id);
end $$;

revoke execute on function public.submit_landing_page(uuid) from public, anon;
revoke execute on function public.approve_landing_page(uuid) from public, anon;
revoke execute on function public.publish_landing_page(uuid) from public, anon;
revoke execute on function public.set_landing_page_paused(uuid, boolean) from public, anon;
