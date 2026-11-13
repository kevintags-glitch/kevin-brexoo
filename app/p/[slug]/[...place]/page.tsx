import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicLanding } from "@/components/public/PublicLanding";
import type { PublicPageData, PublicPlace } from "@/components/public/types";
import { JsonLd } from "@/components/seo/JsonLd";
import { COUNTRIES, areaLabel, asCountry, findRegion } from "@/config/locations";
import { businessJsonLd, loadPublicPage, pageUrl, placesForPath, serviceNoun } from "@/features/public/page-data";
import { SITE_URL } from "@/lib/env";

export const revalidate = 60;

type Params = { slug: string; place: string[] };

/** Resolve a path like new-south-wales/newcastle/merewether to a named place on this page. */
function resolve(data: PublicPageData, parts: string[]) {
  if (parts.length > 3 || parts.some((p) => !/^[a-z0-9-]{1,60}$/.test(p))) return null;
  const path = parts.join("/");
  const { exact, within } = placesForPath(data, path);
  if (!exact && !within.length) return null;
  const country = asCountry(data.business.country);
  const sample: PublicPlace = exact ?? within[0]!;
  const region = findRegion(country, sample.state);
  // Name for the place at this level: suburb > city > state.
  const name = exact
    ? areaLabel({ country, state: exact.state, city: exact.city, suburb: exact.suburb, postcode: exact.postcode })
    : parts.length === 2
      ? `${sample.city ?? ""}${region ? `, ${region.code}` : ""}`.trim()
      : (region?.name ?? sample.state ?? "");
  return { path, exact, within, name, region, country };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, place } = await params;
  const data = await loadPublicPage(slug);
  if (!data) return { title: "Page not found" };
  const r = resolve(data, place);
  if (!r) return { title: "Page not found" };
  const title = `${serviceNoun(data)} in ${r.name} · ${data.business.name}`;
  const description = `${data.business.name}: ${data.services.map((s) => s.name.toLowerCase()).join(", ")} in ${r.name}. Send an enquiry or request a time online.`;
  return { title: { absolute: title }, description, alternates: { canonical: pageUrl(slug, r.path) }, openGraph: { title, description, url: pageUrl(slug, r.path) } };
}

export default async function PlacePage({ params }: { params: Promise<Params> }) {
  const { slug, place } = await params;
  const data = await loadPublicPage(slug);
  if (!data) notFound();
  const r = resolve(data, place);
  if (!r) notFound();
  const noun = serviceNoun(data);
  const counties = [...new Set(r.within.map((p) => p.county).filter(Boolean))];
  const postcodes = [...new Set(r.within.map((p) => p.postcode).filter(Boolean))];
  const intro = `${data.business.name} offers ${data.services.map((s) => s.name.toLowerCase()).join(", ")} in ${r.name}${
    counties.length ? ` (${counties.join(", ")})` : ""
  }${!r.exact && postcodes.length ? `, covering ${COUNTRIES[r.country].labels.postcode}${postcodes.length > 1 ? "s" : ""} ${postcodes.join(", ")}` : ""}. Tell us about your project below, and pick a time if one suits you.`;

  const crumbs = [{ href: `/p/${slug}`, label: data.business.name }];
  const parts = r.path.split("/");
  const firstState = r.within.find((p) => p.slug?.startsWith(parts[0]!));
  if (parts.length >= 1 && firstState) crumbs.push({ href: `/p/${slug}/${parts[0]}`, label: findRegion(r.country, firstState.state)?.name ?? parts[0]! });
  if (parts.length >= 2 && r.within[0]?.city) crumbs.push({ href: `/p/${slug}/${parts.slice(0, 2).join("/")}`, label: r.within[0].city });
  if (parts.length === 3 && r.exact?.suburb) crumbs.push({ href: `/p/${slug}/${r.path}`, label: r.exact.suburb });

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: `${SITE_URL}${c.href}` })),
  };

  return (
    <>
      <JsonLd data={businessJsonLd(data, { url: pageUrl(slug, r.path), places: r.within })} />
      <JsonLd data={breadcrumbLd} />
      <PublicLanding data={data} local={{ heading: `${noun} in ${r.name}`, intro, breadcrumb: crumbs }} />
    </>
  );
}
