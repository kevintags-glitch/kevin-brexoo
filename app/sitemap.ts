import type { MetadataRoute } from "next";
import { COUNTRIES, type CountryCode } from "@/config/locations";
import { SEO_CITIES, cityRegion, countrySlug } from "@/config/seo-markets";
import { TRADES } from "@/config/trades";
import { HAS_SUPABASE, SITE_URL } from "@/lib/env";
import { createAnonClient } from "@/lib/supabase/server";

export const revalidate = 3600;

const STATIC = ["/", "/how-it-works", "/industries", "/builders", "/trades", "/pricing", "/ai", "/managed-services", "/resources", "/demo", "/leads", "/legal/privacy", "/legal/terms", "/legal/acceptable-use"];

/** Marketing pages, every trade × city page, and each published business page with its area pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC.map((p) => ({ url: `${SITE_URL}${p === "/" ? "" : p}`, lastModified: now, changeFrequency: "weekly", priority: p === "/" ? 1 : 0.7 }));
  for (const t of TRADES) {
    entries.push({ url: `${SITE_URL}/leads/${t.slug}`, lastModified: now, priority: 0.7 });
    for (const c of Object.keys(COUNTRIES) as CountryCode[]) entries.push({ url: `${SITE_URL}/leads/${t.slug}/${COUNTRIES[c].slug}`, lastModified: now, priority: 0.5 });
    for (const city of SEO_CITIES) entries.push({ url: `${SITE_URL}/leads/${t.slug}/${countrySlug(city.country)}/${cityRegion(city).slug}/${city.slug}`, lastModified: now, priority: 0.6 });
  }
  if (HAS_SUPABASE) {
    try {
      const { data } = await createAnonClient().rpc("list_public_places");
      const pages = new Set<string>();
      for (const row of data ?? []) {
        if (!pages.has(row.page_slug)) {
          pages.add(row.page_slug);
          entries.push({ url: `${SITE_URL}/p/${row.page_slug}`, lastModified: new Date(row.updated_at), priority: 0.8 });
        }
        if (row.area_slug) entries.push({ url: `${SITE_URL}/p/${row.page_slug}/${row.area_slug}`, lastModified: new Date(row.updated_at), priority: 0.6 });
      }
    } catch {
      // The sitemap still lists the marketing site if the database is unreachable.
    }
  }
  return entries;
}
