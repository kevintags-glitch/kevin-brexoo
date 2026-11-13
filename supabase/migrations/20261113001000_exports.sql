-- Exports are owner-only and audited (blueprint §9.5 "Export only when authorised", §13.2).
create or replace function public.record_export(p_entity text, p_count int, p_filters jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  org uuid;
begin
  select active_organization_id into org from public.profiles where id = (select auth.uid());
  if org is null or not public.is_org_owner(org) then
    raise exception 'Only an owner can export data' using errcode = '42501';
  end if;
  if p_entity not in ('enquiries', 'contacts') then
    raise exception 'Unknown export' using errcode = '22023';
  end if;
  perform public.log_audit(org, p_entity || '.exported', p_entity, null, jsonb_build_object('rows', p_count, 'filters', coalesce(p_filters, '{}'::jsonb)));
end $$;
revoke execute on function public.record_export(text, int, jsonb) from public, anon;
