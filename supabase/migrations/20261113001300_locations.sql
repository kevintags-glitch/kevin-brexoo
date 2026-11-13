-- Structured locations for the three launch markets (USA, Australia, New Zealand).
--
-- Service areas keep their display label and gain the parts that local search and matching need:
-- state/region, county (US), city, suburb/neighbourhood and ZIP/postcode, plus a URL slug used for
-- the business's public area pages (/p/<page>/<state>/<city>/<suburb>).

alter table public.service_areas
  add column country char(2) check (country in ('US', 'AU', 'NZ')),
  add column state text check (char_length(state) <= 80),
  add column county text check (char_length(county) <= 80),
  add column city text check (char_length(city) <= 80),
  add column suburb text check (char_length(suburb) <= 80),
  add column slug text check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*(/[a-z0-9]+(-[a-z0-9]+)*){0,2}$'),
  add column lat double precision check (lat between -90 and 90),
  add column lng double precision check (lng between -180 and 180);
create unique index service_areas_org_slug_unique on public.service_areas (organization_id, slug) where slug is not null;
create trigger service_areas_no_move_loc before update on public.service_areas for each row execute function public.prevent_org_change();

alter table public.organizations
  add column address_city text check (char_length(address_city) <= 80),
  add column address_state text check (char_length(address_state) <= 80),
  add column address_county text check (char_length(address_county) <= 80),
  add column address_postcode text check (char_length(address_postcode) <= 12);

-- Public page read model: keep the label list and add structured places and the business address.
create or replace function public.get_public_page(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'page_id', p.id,
    'slug', p.slug,
    'title', p.title,
    'content', v.content,
    'published_at', p.published_at,
    'business', jsonb_build_object(
      'name', o.name,
      'website', o.website,
      'phone', o.phone,
      'timezone', o.timezone,
      'country', o.country,
      'currency', o.currency,
      'description', o.settings #>> '{brand,description}',
      'logo_url', o.settings #>> '{brand,logo_url}',
      'address', jsonb_build_object('city', o.address_city, 'state', o.address_state, 'county', o.address_county, 'postcode', o.address_postcode)
    ),
    'services', coalesce((
      select jsonb_agg(jsonb_build_object('code', c.code, 'name', c.name) order by c.sort)
      from public.org_services s join public.service_categories c on c.code = s.category_code
      where s.organization_id = o.id
    ), '[]'::jsonb),
    'areas', coalesce((
      select jsonb_agg(a.label order by a.label) from public.service_areas a where a.organization_id = o.id
    ), '[]'::jsonb),
    'places', coalesce((
      select jsonb_agg(jsonb_build_object(
        'label', a.label, 'country', coalesce(a.country, o.country), 'state', a.state, 'county', a.county,
        'city', a.city, 'suburb', a.suburb, 'postcode', a.postcode, 'slug', a.slug
      ) order by a.state nulls last, a.city nulls last, a.suburb nulls last, a.label)
      from public.service_areas a where a.organization_id = o.id
    ), '[]'::jsonb),
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object('key', q.key, 'label', q.label, 'kind', q.kind, 'options', q.options, 'required', q.required) order by q.sort)
      from public.org_questions q where q.organization_id = o.id and q.is_public and q.active
    ), '[]'::jsonb)
  )
  from public.landing_pages p
  join public.landing_page_versions v on v.id = p.published_version_id
  join public.organizations o on o.id = p.organization_id
  where p.slug = lower(p_slug) and p.status = 'published';
$$;
grant execute on function public.get_public_page(text) to anon, authenticated;

-- For the sitemap: every published page and its area slugs. Public information only.
create or replace function public.list_public_places()
returns table (page_slug text, area_slug text, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.slug::text, a.slug, coalesce(p.published_at, p.updated_at)
  from public.landing_pages p
  left join public.service_areas a on a.organization_id = p.organization_id and a.slug is not null
  where p.status = 'published'
  order by p.slug, a.slug;
$$;
grant execute on function public.list_public_places() to anon, authenticated;
