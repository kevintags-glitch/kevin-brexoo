import "server-only";
import { cache } from "react";
import type { PublicPageData, PublicPlace } from "@/components/public/types";
import { asCountry, findRegion } from "@/config/locations";
import { parsePageContent } from "@/features/landing-pages/content";
import { SITE_URL } from "@/lib/env";
import { createAnonClient } from "@/lib/supabase/server";

export const loadPublicPage = cache(async (slug: string): Promise<PublicPageData | null> => {
  const { data } = await createAnonClient().rpc("get_public_page", { p_slug: slug });
  if (!data) return null;
  const raw = data as unknown as PublicPageData & { content: unknown };
  return { ...raw, places: raw.places ?? [], content: parsePageContent(raw.content) };
});

/** Areas covered by a path: an exact area, or every area under a state or state/city roll-up. */
export function placesForPath(data: PublicPageData, path: string): { exact: PublicPlace | null; within: PublicPlace[] } {
  const exact = data.places.find((p) => p.slug === path) ?? null;
  const within = data.places.filter((p) => p.slug && (p.slug === path || p.slug.startsWith(`${path}/`)));
  return { exact, within };
}

/** "Home builders" from the business's first service; used for local headings. */
export function serviceNoun(data: PublicPageData) {
  return data.services[0]?.name ?? "Local services";
}

/** Structured data for a business page or one of its area pages (schema.org). */
export function businessJsonLd(data: PublicPageData, opts: { url: string; places: PublicPlace[] }) {
  const country = asCountry(data.business.country);
  const addr = data.business.address;
  const region = (code?: string | null) => findRegion(country, code)?.name ?? code ?? undefined;
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: data.business.name,
    url: opts.url,
    telephone: data.business.phone ?? undefined,
    description: data.business.description ?? data.content.subheadline ?? undefined,
    address: addr?.city || addr?.postcode ? { "@type": "PostalAddress", addressLocality: addr?.city ?? undefined, addressRegion: region(addr?.state), postalCode: addr?.postcode ?? undefined, addressCountry: country } : undefined,
    areaServed: opts.places.map((p) => ({
      "@type": p.suburb ? "Place" : "City",
      name: [p.suburb, p.city].filter(Boolean).join(", ") || p.label,
      address: { "@type": "PostalAddress", addressLocality: p.suburb || p.city || undefined, addressRegion: region(p.state), postalCode: p.postcode ?? undefined, addressCountry: country },
      ...(p.county ? { containedInPlace: { "@type": "AdministrativeArea", name: p.county } } : {}),
    })),
    makesOffer: data.services.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.name } })),
  };
}

export const pageUrl = (slug: string, path?: string) => `${SITE_URL}/p/${slug}${path ? `/${path}` : ""}`;
