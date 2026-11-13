-- Notifications centre and Make.com integration (master plan: first milestone "Make.com notifications").
--
-- * profiles.notifications_seen_at drives the unread count on the bell.
-- * integrations holds one Make.com webhook per organisation. Only owners can see or change it,
--   because it includes the signing secret. The URL must be a Make.com hook, so the server never
--   posts business data to an arbitrary address.
-- * Events fan out through the existing notification_outbox, so delivery is retried and a failing
--   scenario never affects the enquiry or appointment that caused it.

alter table public.profiles add column notifications_seen_at timestamptz;

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null default 'make_webhook' check (kind in ('make_webhook')),
  url text not null check (url ~ '^https://hook\.[a-z0-9-]+\.make\.com/[A-Za-z0-9_-]{8,128}$'),
  secret text not null default encode(extensions.gen_random_bytes(24), 'hex'),
  events text[] not null default array['enquiry.received', 'appointment.booked']
    check (events <@ array['enquiry.received', 'appointment.booked', 'opportunity.won']),
  enabled boolean not null default true,
  last_delivery_at timestamptz,
  last_status text check (char_length(last_status) <= 200),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, kind)
);
create trigger integrations_touch before update on public.integrations for each row execute function public.touch_updated_at();
create trigger integrations_org_fixed before update on public.integrations for each row execute function public.prevent_org_change();
alter table public.integrations enable row level security;
revoke all on public.integrations from anon;

create policy "integrations: owners read" on public.integrations for select to authenticated using (public.is_org_owner(organization_id));
create policy "integrations: owners add" on public.integrations for insert to authenticated with check (public.is_org_owner(organization_id) and created_by = (select auth.uid()));
create policy "integrations: owners change" on public.integrations for update to authenticated using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy "integrations: owners remove" on public.integrations for delete to authenticated using (public.is_org_owner(organization_id));

-- Queue one webhook delivery per enabled integration that subscribes to the event.
create or replace function public.enqueue_integration_event(p_org uuid, p_event text, p_key text, p_data jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notification_outbox (organization_id, kind, payload, dedupe_key)
  select i.organization_id, 'webhook.make',
         jsonb_build_object('integration_id', i.id, 'event', p_event, 'data', p_data),
         'webhook:' || i.id || ':' || p_key
    from public.integrations i
   where i.organization_id = p_org and i.enabled and p_event = any (i.events)
  on conflict (dedupe_key) do nothing;
end $$;
revoke execute on function public.enqueue_integration_event(uuid, text, text, jsonb) from public, anon, authenticated;

create or replace function public.integration_fanout_enquiry()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.kind = 'enquiry.received' and new.organization_id is not null then
    perform public.enqueue_integration_event(new.organization_id, 'enquiry.received', coalesce(new.dedupe_key, new.id::text),
      jsonb_build_object('reference', new.payload ->> 'reference', 'contact_name', new.payload ->> 'contact_name',
                         'category', new.payload ->> 'category', 'opportunity_id', new.payload ->> 'opportunity_id'));
  end if;
  return new;
end $$;
create trigger outbox_integration_fanout after insert on public.notification_outbox for each row execute function public.integration_fanout_enquiry();

create or replace function public.integration_fanout_appointment()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.enqueue_integration_event(new.organization_id, 'appointment.booked', 'appointment:' || new.id,
    jsonb_build_object('appointment_id', new.id, 'type', new.type, 'starts_at', new.starts_at, 'opportunity_id', new.opportunity_id));
  return new;
end $$;
create trigger appointments_integration_fanout after insert on public.appointments for each row execute function public.integration_fanout_appointment();

create or replace function public.integration_fanout_won()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.stage = 'won' and old.stage is distinct from 'won' then
    perform public.enqueue_integration_event(new.organization_id, 'opportunity.won', 'won:' || new.id,
      jsonb_build_object('opportunity_id', new.id, 'title', new.title, 'value_minor', new.value_minor, 'currency', new.currency));
  end if;
  return new;
end $$;
create trigger opportunities_integration_fanout after update of stage on public.opportunities for each row execute function public.integration_fanout_won();

-- The worker reads the integration (including its secret) with the service role only.
create or replace function public.record_integration_delivery(p_id uuid, p_status text)
returns void language sql security definer set search_path = '' as $$
  update public.integrations set last_delivery_at = now(), last_status = left(p_status, 200) where id = p_id;
$$;
revoke execute on function public.record_integration_delivery(uuid, text) from public, anon, authenticated;
grant execute on function public.record_integration_delivery(uuid, text) to service_role;

-- Changes to an integration are sensitive (they decide where business data goes), so audit them.
create or replace function public.audit_integration_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r public.integrations := coalesce(new, old);
begin
  -- Skip when the whole organisation is being deleted (the cascade removes the audit trail too).
  if not exists (select 1 from public.organizations o where o.id = r.organization_id) then return null; end if;
  perform public.log_audit(r.organization_id, 'integration.' || lower(tg_op), 'integration', r.id,
    jsonb_build_object('kind', r.kind, 'enabled', r.enabled, 'events', to_jsonb(r.events)));
  return null;
end $$;
create trigger integrations_audit after insert or update of url, enabled, events or delete on public.integrations for each row execute function public.audit_integration_change();
