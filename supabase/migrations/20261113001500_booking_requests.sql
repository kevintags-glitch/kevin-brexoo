-- Public booking requests. Visitors can ask for a time when they enquire; the business confirms it.
--
-- Availability is worked out from the business's bookable days and hours, meeting length, buffer,
-- existing appointments and other pending requests. Only free start times leave the database:
-- nothing about existing appointments is ever returned.

alter table public.enquiries
  add column requested_start timestamptz,
  add column requested_type public.appt_type,
  add column booking_status text check (booking_status in ('requested', 'confirmed', 'declined'));
create index enquiries_requests_idx on public.enquiries (organization_id, requested_start) where booking_status = 'requested';

-- Free start times for an organisation over the next p_days days (internal helper).
create or replace function public.booking_slots(p_org uuid, p_days int default 14)
returns setof timestamptz language plpgsql stable security definer set search_path = '' as $$
declare
  org public.organizations;
  appt jsonb;
  tz text;
  v_days int[];
  v_start time;
  v_end time;
  v_minutes int;
  v_buffer int;
  d date;
  t time;
  s timestamptz;
begin
  select * into org from public.organizations where id = p_org;
  if org.id is null then return; end if;
  appt := coalesce(org.settings -> 'appointments', '{}'::jsonb);
  if coalesce((appt ->> 'requests')::boolean, true) is false then return; end if;
  tz := org.timezone;
  v_days := coalesce((select array_agg(x::int) from jsonb_array_elements_text(appt -> 'days') x), array[1, 2, 3, 4, 5]);
  v_start := coalesce(nullif(appt ->> 'start', '')::time, time '08:00');
  v_end := coalesce(nullif(appt ->> 'end', '')::time, time '17:00');
  v_minutes := least(greatest(coalesce((appt ->> 'meeting_minutes')::int, 60), 15), 240);
  v_buffer := least(greatest(coalesce((appt ->> 'buffer_minutes')::int, 15), 0), 120);

  for i in 1 .. least(greatest(p_days, 1), 21) loop
    d := (now() at time zone tz)::date + i;
    continue when not (extract(isodow from d)::int = any (v_days));
    t := v_start;
    while t + make_interval(mins => v_minutes) <= v_end loop
      s := (d + t) at time zone tz;
      if not exists (
           select 1 from public.appointments a
           where a.organization_id = p_org and a.status in ('scheduled', 'confirmed', 'rescheduled')
             and tstzrange(a.starts_at - make_interval(mins => v_buffer), a.ends_at + make_interval(mins => v_buffer)) && tstzrange(s, s + make_interval(mins => v_minutes)))
         and not exists (
           select 1 from public.enquiries e
           where e.organization_id = p_org and e.booking_status = 'requested'
             and tstzrange(e.requested_start - make_interval(mins => v_buffer), e.requested_start + make_interval(mins => v_minutes + v_buffer)) && tstzrange(s, s + make_interval(mins => v_minutes))) then
        return next s;
      end if;
      t := t + interval '30 minutes';
      exit when t < v_start; -- wrapped past midnight
    end loop;
  end loop;
end $$;
revoke execute on function public.booking_slots(uuid, int) from public, anon, authenticated;

-- Public: free times for a published page, plus what the visitor needs to show them.
create or replace function public.get_public_availability(p_slug text, p_days int default 14)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  page public.landing_pages;
  org public.organizations;
begin
  select * into page from public.landing_pages where slug = lower(p_slug) and status = 'published';
  if page.id is null then return jsonb_build_object('ok', false); end if;
  select * into org from public.organizations where id = page.organization_id;
  return jsonb_build_object(
    'ok', true,
    'timezone', org.timezone,
    'minutes', coalesce((org.settings #>> '{appointments,meeting_minutes}')::int, 60),
    'types', coalesce(org.settings #> '{appointments,meeting_types}', '["phone", "site_visit"]'::jsonb),
    'slots', coalesce((select jsonb_agg(s order by s) from public.booking_slots(org.id, p_days) s), '[]'::jsonb)
  );
end $$;
grant execute on function public.get_public_availability(text, int) to anon, authenticated;

-- Public: attach a time request to an enquiry the visitor has just sent (identified by its
-- reference, within 15 minutes). The slot must still be free. This is a request, not a booking.
create or replace function public.request_public_booking(p_slug text, p_reference text, p_start timestamptz, p_type text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  page public.landing_pages;
  org public.organizations;
  e public.enquiries;
  v_type public.appt_type;
  v_label text;
begin
  select * into page from public.landing_pages where slug = lower(p_slug) and status = 'published';
  if page.id is null then return jsonb_build_object('ok', false, 'error', 'page_unavailable'); end if;
  select * into org from public.organizations where id = page.organization_id;
  select * into e from public.enquiries
   where organization_id = org.id and reference = upper(p_reference) and created_at > now() - interval '15 minutes' and booking_status is null;
  if e.id is null then return jsonb_build_object('ok', false, 'error', 'enquiry_not_found'); end if;
  if p_type not in ('phone', 'video', 'site_visit')
     or not coalesce(org.settings #> '{appointments,meeting_types}', '["phone", "site_visit"]'::jsonb) ? p_type then
    return jsonb_build_object('ok', false, 'error', 'type_unavailable');
  end if;
  v_type := p_type::public.appt_type;
  if not exists (select 1 from public.booking_slots(org.id, 21) s where s = p_start) then
    return jsonb_build_object('ok', false, 'error', 'slot_taken');
  end if;

  update public.enquiries set requested_start = p_start, requested_type = v_type, booking_status = 'requested' where id = e.id;
  v_label := public.appt_label(v_type) || ' ' || to_char(p_start at time zone org.timezone, 'Dy DD Mon, HH24:MI');
  update public.tasks set title = 'Confirm requested ' || lower(v_label)
   where organization_id = org.id and status = 'open'
     and opportunity_id = (select o.id from public.opportunities o where o.enquiry_id = e.id limit 1);
  perform public.add_activity(org.id, (select o.id from public.opportunities o where o.enquiry_id = e.id limit 1), e.contact_id,
    'booking_requested', 'Requested a ' || lower(v_label) || ' (' || org.timezone || ')',
    jsonb_build_object('requested_start', p_start, 'type', v_type));
  return jsonb_build_object('ok', true, 'requested_start', p_start);
end $$;
revoke execute on function public.request_public_booking(text, text, timestamptz, text) from public;
grant execute on function public.request_public_booking(text, text, timestamptz, text) to anon, authenticated;

-- When the business books an appointment for an enquiry with a pending request, mark it confirmed.
create or replace function public.booking_request_confirmed()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.enquiries e set booking_status = 'confirmed'
   from public.opportunities o
   where o.id = new.opportunity_id and e.id = o.enquiry_id and e.booking_status = 'requested';
  return new;
end $$;
create trigger appointments_confirm_request after insert on public.appointments for each row execute function public.booking_request_confirmed();
