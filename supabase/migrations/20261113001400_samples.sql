-- Sample data: the same example businesses and leads the website shows (config/samples.ts),
-- loadable into a real workspace so owners can explore Brexoo before their first enquiry.
-- Sample rows are flagged, labelled in the product, never sent to integrations, and removed in one go.

alter table public.contacts add column is_sample boolean not null default false;
alter table public.projects add column is_sample boolean not null default false;
alter table public.discovery_sources add column is_sample boolean not null default false;
create index contacts_sample_idx on public.contacts (organization_id) where is_sample;

-- The catalogue, generated from config/samples.ts (see scripts/generate-samples-sql.ts).
create table public.sample_businesses (
  key text primary key,
  data jsonb not null
);
alter table public.sample_businesses enable row level security;
revoke all on public.sample_businesses from anon;
create policy "samples: signed-in users read" on public.sample_businesses for select to authenticated using (true);

-- Integrations never receive sample activity.
create or replace function public.is_loading_samples()
returns boolean language sql stable set search_path = '' as $$
  select coalesce(current_setting('brexoo.loading_samples', true), '') = 'on';
$$;

create or replace function public.integration_fanout_appointment()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if public.is_loading_samples() or exists (select 1 from public.contacts c where c.id = new.contact_id and c.is_sample) then return new; end if;
  perform public.enqueue_integration_event(new.organization_id, 'appointment.booked', 'appointment:' || new.id,
    jsonb_build_object('appointment_id', new.id, 'type', new.type, 'starts_at', new.starts_at, 'opportunity_id', new.opportunity_id));
  return new;
end $$;

create or replace function public.integration_fanout_won()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.stage = 'won' and old.stage is distinct from 'won'
     and not exists (select 1 from public.contacts c where c.id = new.contact_id and c.is_sample) then
    perform public.enqueue_integration_event(new.organization_id, 'opportunity.won', 'won:' || new.id,
      jsonb_build_object('opportunity_id', new.id, 'title', new.title, 'value_minor', new.value_minor, 'currency', new.currency));
  end if;
  return new;
end $$;

create or replace function public.load_sample_data(p_org uuid, p_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  org public.organizations;
  biz jsonb;
  l jsonb;
  pr jsonb;
  uid uuid := (select auth.uid());
  v_contact uuid;
  v_project uuid;
  v_enquiry uuid;
  v_opp uuid;
  v_src uuid;
  v_received timestamptz;
  v_start timestamptz;
  v_count int := 0;
begin
  if not public.is_org_owner(p_org) then raise exception 'Only owners can load sample data' using errcode = '42501'; end if;
  select * into org from public.organizations where id = p_org;
  select data into biz from public.sample_businesses where key = p_key;
  if biz is null then raise exception 'Unknown sample set' using errcode = '22023'; end if;
  if exists (select 1 from public.contacts where organization_id = p_org and is_sample) then
    return jsonb_build_object('ok', true, 'already_loaded', true);
  end if;
  perform set_config('brexoo.loading_samples', 'on', true);

  for l in select * from jsonb_array_elements(biz -> 'leads') loop
    v_received := now() - make_interval(secs => ((l ->> 'hoursAgo')::numeric * 3600)::int);
    insert into public.contacts (organization_id, full_name, email, phone, source, owner_id, is_sample, created_at)
    values (p_org, l ->> 'name', l ->> 'email', l ->> 'phone', l ->> 'source', uid, true, v_received)
    returning id into v_contact;

    insert into public.projects (organization_id, contact_id, title, category_code, location_text, postcode, budget_label, currency, start_timing, details, is_sample, created_at)
    values (p_org, v_contact, l ->> 'title', l ->> 'service',
            concat_ws(', ', nullif(l ->> 'suburb', ''), l ->> 'city') || coalesce(' ' || nullif(l ->> 'postcode', ''), ''),
            l ->> 'postcode', l ->> 'budget', org.currency, l ->> 'timing', coalesce(l -> 'answers', '{}'::jsonb), true, v_received)
    returning id into v_project;

    insert into public.enquiries (organization_id, contact_id, project_id, source, status, answers, message, consent_text, consent_at, received_at, created_at, first_response_at)
    values (p_org, v_contact, v_project, case when l ->> 'source' = 'visitor_chat' then 'visitor_chat' when l ->> 'source' = 'manual' then 'manual' else 'landing_page' end,
            (l ->> 'status')::public.qual_status, coalesce(l -> 'answers', '{}'::jsonb), l ->> 'message',
            'Sample data for exploring Brexoo.', v_received, v_received, v_received,
            case when l ->> 'stage' <> 'new' then v_received + interval '47 minutes' end)
    returning id into v_enquiry;

    insert into public.opportunities (organization_id, title, stage, contact_id, project_id, enquiry_id, owner_id, value_minor, currency, loss_reason, closed_at, stage_changed_at, created_at)
    values (p_org, (l ->> 'title') || ' — ' || (l ->> 'name'), (l ->> 'stage')::public.opp_stage, v_contact, v_project, v_enquiry, uid,
            (l ->> 'valueMinor')::bigint, org.currency, (l ->> 'lossReason')::public.loss_reason,
            case when l ->> 'stage' in ('won', 'lost') then v_received + interval '3 days' end, v_received, v_received)
    returning id into v_opp;

    perform public.add_activity(p_org, v_opp, v_contact, 'enquiry_received', 'Sample enquiry ' || (l ->> 'ref') || ' received', jsonb_build_object('sample', true));

    if l ->> 'stage' not in ('won', 'lost') then
      insert into public.tasks (organization_id, title, due_at, assignee_id, opportunity_id, contact_id)
      values (p_org, case when l ->> 'stage' = 'new' then 'Respond to ' || (l ->> 'name') || '''s enquiry' else 'Follow up with ' || (l ->> 'name') end,
              greatest(now() + interval '2 hours', v_received + interval '1 day'), uid, v_opp, v_contact);
    end if;

    if l ? 'appointment' then
      v_start := ((date_trunc('day', now() at time zone org.timezone) + make_interval(days => (l #>> '{appointment,inDays}')::int, hours => (l #>> '{appointment,hour}')::int)) at time zone org.timezone);
      insert into public.appointments (organization_id, opportunity_id, contact_id, type, status, starts_at, ends_at, timezone, location, purpose, created_by)
      values (p_org, v_opp, v_contact, (l #>> '{appointment,type}')::public.appt_type, 'confirmed', v_start,
              v_start + make_interval(mins => (l #>> '{appointment,minutes}')::int), org.timezone,
              concat_ws(', ', nullif(l ->> 'suburb', ''), l ->> 'city'), l ->> 'title', uid);
    end if;
    v_count := v_count + 1;
  end loop;

  insert into public.discovery_sources (organization_id, name, source_type, permitted_use, limitations, created_by, is_sample)
  values (p_org, 'Sample project feed', 'customer_provided', 'Sample records for exploring Discover. Not real projects; do not contact.', 'Illustrative data only.', uid, true)
  returning id into v_src;
  for pr in select * from jsonb_array_elements(biz -> 'projects') loop
    insert into public.project_records (organization_id, source_id, external_id, title, category_code, location_text, postcode, project_stage, estimated_value_minor, currency, observed_at, contact_permission)
    values (p_org, v_src, pr ->> 'ref', pr ->> 'title', pr ->> 'service', pr ->> 'location', pr ->> 'postcode', pr ->> 'stage',
            (pr ->> 'valueMinor')::bigint, org.currency, current_date - (pr ->> 'observedDaysAgo')::int, 'not_permitted');
  end loop;

  perform set_config('brexoo.loading_samples', 'off', true);
  perform public.log_audit(p_org, 'samples.loaded', 'organization', p_org, jsonb_build_object('set', p_key, 'leads', v_count));
  return jsonb_build_object('ok', true, 'leads', v_count);
end $$;
revoke execute on function public.load_sample_data(uuid, text) from public, anon;
grant execute on function public.load_sample_data(uuid, text) to authenticated;

create or replace function public.clear_sample_data(p_org uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_count int;
begin
  if not public.is_org_owner(p_org) then raise exception 'Only owners can clear sample data' using errcode = '42501'; end if;
  delete from public.activity_events e using public.contacts c
   where c.organization_id = p_org and c.is_sample and e.organization_id = p_org and e.contact_id = c.id;
  delete from public.contacts where organization_id = p_org and is_sample;  -- cascades enquiries, opportunities, tasks, notes, appointments
  get diagnostics v_count = row_count;
  delete from public.projects where organization_id = p_org and is_sample;
  delete from public.discovery_sources where organization_id = p_org and is_sample;  -- cascades project records
  perform public.log_audit(p_org, 'samples.cleared', 'organization', p_org, jsonb_build_object('contacts', v_count));
  return jsonb_build_object('ok', true, 'removed', v_count);
end $$;
revoke execute on function public.clear_sample_data(uuid) from public, anon;
grant execute on function public.clear_sample_data(uuid) to authenticated;
