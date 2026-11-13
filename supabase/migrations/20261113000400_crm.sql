-- CRM core: contacts, projects, enquiries, opportunities, qualification, tasks, notes,
-- appointments and the activity timeline. Blueprint §4.2, §9, §11.4, §15.
--
-- Cross-tenant safety: child rows reference parents with composite (id, organization_id) keys, so
-- a member of two organisations cannot attach a task in org A to an opportunity in org B.

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  email extensions.citext check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (char_length(phone) <= 40),
  phone_normalized text generated always as (nullif(regexp_replace(coalesce(phone, ''), '[^0-9+]', '', 'g'), '')) stored,
  company text check (char_length(company) <= 120),
  preferred_contact text check (preferred_contact in ('email', 'phone', 'sms', 'any')),
  source text not null default 'manual' check (source in ('landing_page', 'visitor_chat', 'manual', 'import')),
  owner_id uuid references public.profiles (id) on delete set null,
  -- Contact restrictions (§9.5, §17.3). Opt-out blocks outreach; the record is kept for suppression.
  do_not_contact boolean not null default false,
  opted_out_at timestamptz,
  restriction_note text check (char_length(restriction_note) <= 500),
  merged_into uuid references public.contacts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  check (email is not null or phone is not null)
);
create unique index contacts_org_email_unique on public.contacts (organization_id, email) where email is not null and merged_into is null;
create index contacts_org_phone_idx on public.contacts (organization_id, phone_normalized) where merged_into is null;
create index contacts_org_created_idx on public.contacts (organization_id, created_at desc);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  contact_id uuid,
  title text not null check (char_length(title) between 2 and 160),
  category_code text references public.service_categories (code),
  template_version int,
  location_text text check (char_length(location_text) <= 160),
  postcode text check (char_length(postcode) <= 12),
  description text check (char_length(description) <= 4000),
  -- Budget only when the prospect stated it (§12.3). Minor units + ISO currency (§15.3).
  budget_min_minor bigint check (budget_min_minor >= 0),
  budget_max_minor bigint check (budget_max_minor >= 0),
  budget_label text check (char_length(budget_label) <= 60),
  currency char(3),
  start_timing text check (char_length(start_timing) <= 60),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (contact_id, organization_id) references public.contacts (id, organization_id) on delete set null (contact_id)
);
create index projects_org_idx on public.projects (organization_id, category_code, created_at desc);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  reference text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  contact_id uuid not null,
  project_id uuid,
  landing_page_id uuid,
  source text not null default 'landing_page' check (source in ('landing_page', 'visitor_chat', 'manual')),
  status public.qual_status not null default 'unreviewed',
  answers jsonb not null default '{}'::jsonb,
  message text check (char_length(message) <= 4000),
  consent_text text,
  consent_at timestamptz,
  dedupe_hash text,
  duplicate_count int not null default 0,
  received_at timestamptz not null default now(),
  first_response_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (contact_id, organization_id) references public.contacts (id, organization_id) on delete cascade,
  foreign key (project_id, organization_id) references public.projects (id, organization_id) on delete set null (project_id),
  foreign key (landing_page_id, organization_id) references public.landing_pages (id, organization_id) on delete set null (landing_page_id)
);
create index enquiries_org_idx on public.enquiries (organization_id, status, received_at desc);
create index enquiries_dedupe_idx on public.enquiries (organization_id, dedupe_hash, received_at desc);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  stage public.opp_stage not null default 'new',
  contact_id uuid not null,
  project_id uuid,
  enquiry_id uuid,
  owner_id uuid references public.profiles (id) on delete set null,
  value_minor bigint check (value_minor >= 0),
  currency char(3),
  loss_reason public.loss_reason,
  loss_note text check (char_length(loss_note) <= 500),
  stage_changed_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  check (stage <> 'lost' or loss_reason is not null),
  foreign key (contact_id, organization_id) references public.contacts (id, organization_id) on delete cascade,
  foreign key (project_id, organization_id) references public.projects (id, organization_id) on delete set null (project_id),
  foreign key (enquiry_id, organization_id) references public.enquiries (id, organization_id) on delete set null (enquiry_id)
);
create index opportunities_org_stage_idx on public.opportunities (organization_id, stage, updated_at desc);
create index opportunities_owner_idx on public.opportunities (organization_id, owner_id);

-- Owners/assignees must belong to the organisation.
create or replace function public.check_member_ref()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  ref uuid := case tg_argv[0] when 'owner_id' then (to_jsonb(new) ->> 'owner_id')::uuid else (to_jsonb(new) ->> 'assignee_id')::uuid end;
begin
  if ref is not null and not exists (
    select 1 from public.memberships m where m.organization_id = new.organization_id and m.user_id = ref
  ) then
    raise exception 'Assignee is not a member of this organisation' using errcode = '23503';
  end if;
  return new;
end $$;
create trigger opportunities_owner_member before insert or update of owner_id on public.opportunities for each row execute function public.check_member_ref('owner_id');
create trigger contacts_owner_member before insert or update of owner_id on public.contacts for each row execute function public.check_member_ref('owner_id');

create table public.qualification_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  enquiry_id uuid not null,
  status public.qual_status not null,
  answers jsonb not null default '{}'::jsonb,
  reason text check (char_length(reason) <= 500),
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (enquiry_id, organization_id) references public.enquiries (id, organization_id) on delete cascade
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 200),
  notes text check (char_length(notes) <= 2000),
  due_at timestamptz,
  status public.task_status not null default 'open',
  assignee_id uuid references public.profiles (id) on delete set null,
  opportunity_id uuid,
  contact_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (opportunity_id, organization_id) references public.opportunities (id, organization_id) on delete cascade,
  foreign key (contact_id, organization_id) references public.contacts (id, organization_id) on delete cascade
);
create index tasks_org_due_idx on public.tasks (organization_id, status, due_at);
create index tasks_assignee_idx on public.tasks (organization_id, assignee_id, status);
create trigger tasks_assignee_member before insert or update of assignee_id on public.tasks for each row execute function public.check_member_ref('assignee_id');

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  opportunity_id uuid,
  contact_id uuid,
  body text not null check (char_length(body) between 1 and 4000),
  author_id uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  foreign key (opportunity_id, organization_id) references public.opportunities (id, organization_id) on delete cascade,
  foreign key (contact_id, organization_id) references public.contacts (id, organization_id) on delete cascade
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  opportunity_id uuid,
  contact_id uuid not null,
  type public.appt_type not null,
  status public.appt_status not null default 'scheduled',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null,
  location text check (char_length(location) <= 200),
  purpose text check (char_length(purpose) <= 500),
  outcome text check (char_length(outcome) <= 1000),
  provider text not null default 'internal',
  provider_event_id text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  foreign key (opportunity_id, organization_id) references public.opportunities (id, organization_id) on delete cascade,
  foreign key (contact_id, organization_id) references public.contacts (id, organization_id) on delete cascade
);
create index appointments_org_start_idx on public.appointments (organization_id, starts_at);

-- Timeline (§9.3 "full activity history"). Written by triggers and RPCs only.
create table public.activity_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  opportunity_id uuid,
  contact_id uuid,
  kind text not null,
  summary text not null,
  data jsonb not null default '{}'::jsonb,
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index activity_opp_idx on public.activity_events (organization_id, opportunity_id, created_at desc);
create index activity_contact_idx on public.activity_events (organization_id, contact_id, created_at desc);

create or replace function public.add_activity(org uuid, opp uuid, contact uuid, p_kind text, p_summary text, p_data jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.activity_events (organization_id, opportunity_id, contact_id, kind, summary, data, actor_id)
  values (org, opp, contact, p_kind, p_summary, coalesce(p_data, '{}'::jsonb), (select auth.uid()));
$$;
revoke execute on function public.add_activity(uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Activity + bookkeeping triggers
-- ---------------------------------------------------------------------------
create or replace function public.stage_label(s public.opp_stage)
returns text language sql immutable set search_path = '' as $$
  select case s
    when 'new' then 'New' when 'reviewing' then 'Reviewing' when 'contact_attempted' then 'Contact attempted'
    when 'connected' then 'Connected' when 'qualified' then 'Qualified' when 'appointment_booked' then 'Appointment booked'
    when 'proposal' then 'Estimate / proposal' when 'won' then 'Won' when 'lost' then 'Lost' end;
$$;

create or replace function public.opportunity_changes()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.stage is distinct from old.stage then
      new.stage_changed_at := now();
      new.closed_at := case when new.stage in ('won', 'lost') then now() else null end;
      if new.stage <> 'lost' then
        new.loss_reason := null;
        new.loss_note := null;
      end if;
      perform public.add_activity(new.organization_id, new.id, new.contact_id, 'stage_changed',
        'Moved from ' || public.stage_label(old.stage) || ' to ' || public.stage_label(new.stage),
        jsonb_build_object('from', old.stage, 'to', new.stage, 'loss_reason', new.loss_reason));
      perform public.log_audit(new.organization_id, 'opportunity.stage_changed', 'opportunity', new.id, jsonb_build_object('from', old.stage, 'to', new.stage));
      -- First move out of New counts as the first response to the enquiry.
      if old.stage = 'new' and new.enquiry_id is not null then
        update public.enquiries set first_response_at = coalesce(first_response_at, now()) where id = new.enquiry_id;
      end if;
    end if;
    if new.owner_id is distinct from old.owner_id then
      perform public.add_activity(new.organization_id, new.id, new.contact_id, 'owner_changed',
        coalesce('Assigned to ' || (select coalesce(p.full_name, p.email::text) from public.profiles p where p.id = new.owner_id), 'Unassigned'),
        jsonb_build_object('from', old.owner_id, 'to', new.owner_id));
    end if;
    if new.value_minor is distinct from old.value_minor then
      perform public.add_activity(new.organization_id, new.id, new.contact_id, 'value_changed', 'Value updated', jsonb_build_object('value_minor', new.value_minor, 'currency', new.currency));
    end if;
  end if;
  return new;
end $$;
create trigger opportunities_changes before update on public.opportunities for each row execute function public.opportunity_changes();

create or replace function public.task_changes()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  contact uuid := new.contact_id;
begin
  if contact is null and new.opportunity_id is not null then
    select o.contact_id into contact from public.opportunities o where o.id = new.opportunity_id;
  end if;
  if tg_op = 'INSERT' then
    perform public.add_activity(new.organization_id, new.opportunity_id, contact, 'task_created', 'Task: ' || new.title, jsonb_build_object('task_id', new.id, 'due_at', new.due_at));
  elsif new.status is distinct from old.status then
    new.completed_at := case when new.status = 'done' then now() else null end;
    perform public.add_activity(new.organization_id, new.opportunity_id, contact,
      case new.status when 'done' then 'task_completed' when 'cancelled' then 'task_cancelled' else 'task_reopened' end,
      case new.status when 'done' then 'Completed: ' when 'cancelled' then 'Cancelled: ' else 'Reopened: ' end || new.title,
      jsonb_build_object('task_id', new.id));
  end if;
  return new;
end $$;
create trigger tasks_changes_ins after insert on public.tasks for each row execute function public.task_changes();
create trigger tasks_changes_upd before update on public.tasks for each row execute function public.task_changes();

create or replace function public.note_added()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  contact uuid := new.contact_id;
begin
  if contact is null and new.opportunity_id is not null then
    select o.contact_id into contact from public.opportunities o where o.id = new.opportunity_id;
  end if;
  perform public.add_activity(new.organization_id, new.opportunity_id, contact, 'note_added', left(new.body, 140), jsonb_build_object('note_id', new.id));
  return new;
end $$;
create trigger notes_added after insert on public.notes for each row execute function public.note_added();

create or replace function public.appt_label(t public.appt_type)
returns text language sql immutable set search_path = '' as $$
  select case t when 'phone' then 'Phone call' when 'video' then 'Video meeting' else 'Site visit' end;
$$;

create or replace function public.appointment_changes()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform public.add_activity(new.organization_id, new.opportunity_id, new.contact_id, 'appointment_booked',
      public.appt_label(new.type) || ' booked for ' || to_char(new.starts_at at time zone new.timezone, 'Dy DD Mon, HH24:MI') || ' (' || new.timezone || ')',
      jsonb_build_object('appointment_id', new.id, 'starts_at', new.starts_at, 'timezone', new.timezone));
    perform public.log_audit(new.organization_id, 'appointment.created', 'appointment', new.id);
    -- Booking moves an open opportunity forward, never backwards.
    if new.opportunity_id is not null then
      update public.opportunities set stage = 'appointment_booked'
      where id = new.opportunity_id and stage in ('new', 'reviewing', 'contact_attempted', 'connected', 'qualified');
    end if;
  elsif new.status is distinct from old.status or new.starts_at is distinct from old.starts_at then
    perform public.add_activity(new.organization_id, new.opportunity_id, new.contact_id, 'appointment_' || new.status::text,
      public.appt_label(new.type) || ' ' || replace(new.status::text, '_', '-') ||
        case when new.starts_at is distinct from old.starts_at
          then ' to ' || to_char(new.starts_at at time zone new.timezone, 'Dy DD Mon, HH24:MI') else '' end,
      jsonb_build_object('appointment_id', new.id, 'from_status', old.status, 'to_status', new.status, 'starts_at', new.starts_at));
    perform public.log_audit(new.organization_id, 'appointment.' || new.status::text, 'appointment', new.id,
      jsonb_build_object('from_status', old.status, 'from_starts_at', old.starts_at, 'starts_at', new.starts_at));
  end if;
  return new;
end $$;
create trigger appointments_changes after insert or update on public.appointments for each row execute function public.appointment_changes();

create or replace function public.contact_changes()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.do_not_contact is distinct from old.do_not_contact then
    new.opted_out_at := case when new.do_not_contact then now() else null end;
    perform public.add_activity(new.organization_id, null, new.id,
      case when new.do_not_contact then 'do_not_contact_set' else 'do_not_contact_cleared' end,
      case when new.do_not_contact then 'Marked do not contact' else 'Do-not-contact removed' end);
    perform public.log_audit(new.organization_id, 'contact.do_not_contact', 'contact', new.id, jsonb_build_object('value', new.do_not_contact));
  end if;
  return new;
end $$;
create trigger contacts_changes before update on public.contacts for each row execute function public.contact_changes();

create or replace function public.qualification_recorded()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  opp public.opportunities;
begin
  update public.enquiries set status = new.status where id = new.enquiry_id;
  select * into opp from public.opportunities where enquiry_id = new.enquiry_id limit 1;
  perform public.add_activity(new.organization_id, opp.id, opp.contact_id, 'qualification_' || new.status::text,
    case new.status when 'qualified' then 'Qualified' when 'disqualified' then 'Disqualified' else 'Qualification in progress' end
      || coalesce(': ' || new.reason, ''),
    jsonb_build_object('qualification_id', new.id));
  if new.status = 'qualified' and opp.stage in ('new', 'reviewing', 'contact_attempted', 'connected') then
    update public.opportunities set stage = 'qualified' where id = opp.id;
  end if;
  return new;
end $$;
create trigger qualification_recorded after insert on public.qualification_records for each row execute function public.qualification_recorded();

-- updated_at + tenant pinning
create trigger contacts_touch before update on public.contacts for each row execute function public.touch_updated_at();
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();
create trigger opportunities_touch before update on public.opportunities for each row execute function public.touch_updated_at();
create trigger tasks_touch before update on public.tasks for each row execute function public.touch_updated_at();
create trigger appointments_touch before update on public.appointments for each row execute function public.touch_updated_at();
create trigger contacts_no_move before update on public.contacts for each row execute function public.prevent_org_change();
create trigger projects_no_move before update on public.projects for each row execute function public.prevent_org_change();
create trigger enquiries_no_move before update on public.enquiries for each row execute function public.prevent_org_change();
create trigger opportunities_no_move before update on public.opportunities for each row execute function public.prevent_org_change();
create trigger tasks_no_move before update on public.tasks for each row execute function public.prevent_org_change();
create trigger appointments_no_move before update on public.appointments for each row execute function public.prevent_org_change();

-- ---------------------------------------------------------------------------
-- RLS: members of the organisation; destructive deletes are owner-only.
-- ---------------------------------------------------------------------------
alter table public.contacts enable row level security;
alter table public.projects enable row level security;
alter table public.enquiries enable row level security;
alter table public.opportunities enable row level security;
alter table public.qualification_records enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.appointments enable row level security;
alter table public.activity_events enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['contacts', 'projects', 'enquiries', 'opportunities', 'tasks', 'appointments'] loop
    execute format('create policy "%1$s: members read" on public.%1$I for select to authenticated using (public.is_org_member(organization_id))', t);
    execute format('create policy "%1$s: members create" on public.%1$I for insert to authenticated with check (public.is_org_member(organization_id))', t);
    execute format('create policy "%1$s: members update" on public.%1$I for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id))', t);
  end loop;
  foreach t in array array['contacts', 'projects', 'enquiries', 'opportunities'] loop
    execute format('create policy "%1$s: owners delete" on public.%1$I for delete to authenticated using (public.is_org_owner(organization_id))', t);
  end loop;
  foreach t in array array['tasks', 'appointments'] loop
    execute format('create policy "%1$s: members delete" on public.%1$I for delete to authenticated using (public.is_org_member(organization_id))', t);
  end loop;
end $$;

create policy "qualification: members read" on public.qualification_records for select to authenticated
  using (public.is_org_member(organization_id));
create policy "qualification: members record" on public.qualification_records for insert to authenticated
  with check (public.is_org_member(organization_id) and recorded_by = (select auth.uid()));

create policy "notes: members read" on public.notes for select to authenticated
  using (public.is_org_member(organization_id));
create policy "notes: members add" on public.notes for insert to authenticated
  with check (public.is_org_member(organization_id) and author_id = (select auth.uid()));
create policy "notes: authors delete" on public.notes for delete to authenticated
  using (public.is_org_member(organization_id) and author_id = (select auth.uid()));

create policy "activity: members read" on public.activity_events for select to authenticated
  using (public.is_org_member(organization_id));
