-- Discovery (blueprint §8): a source registry, imported project records with provenance, and an
-- idempotent "save to CRM" that keeps the source attached. MVP sources are customer-provided or
-- otherwise approved lists imported by the business itself; records stay private to the
-- organisation that imported them (no shared database is exposed across businesses, §2.4/§8.3).

create table public.discovery_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  source_type text not null check (source_type in ('customer_provided', 'public', 'licensed', 'partner')),
  provider text check (char_length(provider) <= 120),
  permitted_use text not null check (char_length(permitted_use) between 5 and 1000),
  attribution_url text check (char_length(attribution_url) <= 500),
  limitations text check (char_length(limitations) <= 1000),
  refresh_note text check (char_length(refresh_note) <= 200),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (id, organization_id)
);

create table public.project_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  source_id uuid not null,
  external_id text not null check (char_length(external_id) between 1 and 200),
  title text not null check (char_length(title) between 2 and 200),
  description text check (char_length(description) <= 4000),
  category_code text references public.service_categories (code),
  location_text text check (char_length(location_text) <= 160),
  postcode text check (char_length(postcode) <= 12),
  project_stage text check (char_length(project_stage) <= 80),
  estimated_value_minor bigint check (estimated_value_minor >= 0),
  currency char(3),
  timeline text check (char_length(timeline) <= 80),
  observed_at date,
  imported_at timestamptz not null default now(),
  last_verified_at timestamptz,
  source_url text check (char_length(source_url) <= 500),
  contact_name text check (char_length(contact_name) <= 120),
  contact_email extensions.citext check (contact_email is null or contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  contact_phone text check (char_length(contact_phone) <= 40),
  -- Whether the source permits contacting this person (§8.3, §17.3). Unknown blocks outreach drafts.
  contact_permission text not null default 'unknown' check (contact_permission in ('unknown', 'permitted', 'not_permitted')),
  status text not null default 'new' check (status in ('new', 'saved', 'dismissed')),
  saved_project_id uuid,
  saved_opportunity_id uuid,
  saved_at timestamptz,
  unique (source_id, external_id),
  foreign key (source_id, organization_id) references public.discovery_sources (id, organization_id) on delete cascade
);
create index project_records_org_idx on public.project_records (organization_id, status, observed_at desc);
create index project_records_cat_idx on public.project_records (organization_id, category_code);

alter table public.discovery_sources enable row level security;
alter table public.project_records enable row level security;

create policy "sources: members read" on public.discovery_sources for select to authenticated using (public.is_org_member(organization_id));
create policy "sources: owners create" on public.discovery_sources for insert to authenticated with check (public.is_org_owner(organization_id) and created_by = (select auth.uid()));
create policy "sources: owners update" on public.discovery_sources for update to authenticated using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy "sources: owners delete" on public.discovery_sources for delete to authenticated using (public.is_org_owner(organization_id));

create policy "records: members read" on public.project_records for select to authenticated using (public.is_org_member(organization_id));
create policy "records: owners import" on public.project_records for insert to authenticated with check (public.is_org_owner(organization_id));
create policy "records: owners update imports" on public.project_records for update to authenticated using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy "records: owners delete" on public.project_records for delete to authenticated using (public.is_org_owner(organization_id));

create trigger discovery_sources_no_move before update on public.discovery_sources for each row execute function public.prevent_org_change();
create trigger project_records_no_move before update on public.project_records for each row execute function public.prevent_org_change();
revoke all on public.discovery_sources from anon;
revoke all on public.project_records from anon;

-- Save a record into the CRM. Idempotent: saving twice returns what the first save created.
-- Always creates a project carrying its provenance; creates a contact + opportunity only when the
-- record has contact details and the source doesn't forbid contact.
create or replace function public.save_project_record(p_record uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  r public.project_records;
  src public.discovery_sources;
  org public.organizations;
  v_project uuid;
  v_contact uuid;
  v_opp uuid;
  uid uuid := (select auth.uid());
begin
  select * into r from public.project_records where id = p_record for update;
  if r.id is null or not public.is_org_member(r.organization_id) then
    raise exception 'Record not found' using errcode = '42501';
  end if;
  if r.status = 'saved' then
    return jsonb_build_object('project_id', r.saved_project_id, 'opportunity_id', r.saved_opportunity_id, 'already_saved', true);
  end if;
  select * into src from public.discovery_sources where id = r.source_id;
  select * into org from public.organizations where id = r.organization_id;

  if (r.contact_email is not null or r.contact_phone is not null) and r.contact_permission <> 'not_permitted' then
    if r.contact_email is not null then
      select id into v_contact from public.contacts where organization_id = org.id and email = r.contact_email and merged_into is null;
    end if;
    if v_contact is null then
      insert into public.contacts (organization_id, full_name, email, phone, source, owner_id, do_not_contact, restriction_note)
      values (org.id, coalesce(nullif(r.contact_name, ''), r.title), r.contact_email, r.contact_phone, 'import', uid,
              false, case when r.contact_permission = 'unknown' then 'Imported from ' || src.name || ': contact permission not confirmed.' end)
      returning id into v_contact;
    end if;
  end if;

  insert into public.projects (organization_id, contact_id, title, category_code, location_text, postcode, description, budget_label, currency, start_timing, details)
  values (org.id, v_contact, left(r.title, 160), r.category_code, r.location_text, r.postcode, r.description,
          case when r.estimated_value_minor is not null then 'Estimated ' || (r.estimated_value_minor / 100)::text || ' ' || coalesce(r.currency, org.currency) end,
          coalesce(r.currency, org.currency), r.timeline,
          jsonb_build_object('provenance', jsonb_build_object(
            'source_id', src.id, 'source_name', src.name, 'source_type', src.source_type, 'external_id', r.external_id,
            'source_url', r.source_url, 'observed_at', r.observed_at, 'imported_at', r.imported_at, 'project_stage', r.project_stage,
            'contact_permission', r.contact_permission, 'permitted_use', src.permitted_use)))
  returning id into v_project;

  if v_contact is not null then
    insert into public.opportunities (organization_id, title, contact_id, project_id, owner_id, value_minor, currency)
    values (org.id, left(r.title, 140) || ' — ' || coalesce(nullif(r.contact_name, ''), 'prospect'), v_contact, v_project, uid, r.estimated_value_minor, coalesce(r.currency, org.currency))
    returning id into v_opp;
    perform public.add_activity(org.id, v_opp, v_contact, 'discovered',
      'Saved from Discover: ' || src.name || coalesce(' (observed ' || to_char(r.observed_at, 'DD Mon YYYY') || ')', ''),
      jsonb_build_object('record_id', r.id, 'source_id', src.id));
    insert into public.tasks (organization_id, title, due_at, assignee_id, opportunity_id, contact_id)
    values (org.id, case when r.contact_permission = 'permitted' then 'Make first contact: ' else 'Confirm contact permission: ' end || left(r.title, 120),
            now() + interval '1 day', uid, v_opp, v_contact);
  else
    insert into public.tasks (organization_id, title, due_at, assignee_id)
    values (org.id, 'Research decision-maker for: ' || left(r.title, 140), now() + interval '2 days', uid);
  end if;

  update public.project_records set status = 'saved', saved_project_id = v_project, saved_opportunity_id = v_opp, saved_at = now() where id = r.id;
  perform public.log_audit(org.id, 'discovery.saved', 'project_record', r.id, jsonb_build_object('source', src.name));
  return jsonb_build_object('project_id', v_project, 'opportunity_id', v_opp, 'already_saved', false);
end $$;
revoke execute on function public.save_project_record(uuid) from public, anon;

-- Members may dismiss/restore records (status only).
create or replace function public.set_project_record_status(p_record uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  r public.project_records;
begin
  select * into r from public.project_records where id = p_record;
  if r.id is null or not public.is_org_member(r.organization_id) then
    raise exception 'Record not found' using errcode = '42501';
  end if;
  if p_status not in ('new', 'dismissed') or r.status = 'saved' then
    raise exception 'That change is not allowed' using errcode = '22023';
  end if;
  update public.project_records set status = p_status where id = r.id;
end $$;
revoke execute on function public.set_project_record_status(uuid, text) from public, anon;
