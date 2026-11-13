/**
 * Geography for the three launch markets. States/regions are complete lists; counties, cities and
 * suburbs are entered by the business (there are too many to ship), with postcode validation per
 * country. Used by onboarding, fit matching, public area pages and location SEO.
 */

export type CountryCode = "US" | "AU" | "NZ";
export type Region = { code: string; name: string; slug: string; tz: string };

const r = (code: string, name: string, tz: string): Region => ({ code, name, slug: slugify(name), tz });

export function slugify(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const ET = "America/New_York", CT = "America/Chicago", MT = "America/Denver", PT = "America/Los_Angeles";

export const US_STATES: Region[] = [
  r("AL", "Alabama", CT), r("AK", "Alaska", "America/Anchorage"), r("AZ", "Arizona", "America/Phoenix"), r("AR", "Arkansas", CT),
  r("CA", "California", PT), r("CO", "Colorado", MT), r("CT", "Connecticut", ET), r("DE", "Delaware", ET),
  r("DC", "District of Columbia", ET), r("FL", "Florida", ET), r("GA", "Georgia", ET), r("HI", "Hawaii", "Pacific/Honolulu"),
  r("ID", "Idaho", MT), r("IL", "Illinois", CT), r("IN", "Indiana", ET), r("IA", "Iowa", CT), r("KS", "Kansas", CT),
  r("KY", "Kentucky", ET), r("LA", "Louisiana", CT), r("ME", "Maine", ET), r("MD", "Maryland", ET), r("MA", "Massachusetts", ET),
  r("MI", "Michigan", ET), r("MN", "Minnesota", CT), r("MS", "Mississippi", CT), r("MO", "Missouri", CT), r("MT", "Montana", MT),
  r("NE", "Nebraska", CT), r("NV", "Nevada", PT), r("NH", "New Hampshire", ET), r("NJ", "New Jersey", ET), r("NM", "New Mexico", MT),
  r("NY", "New York", ET), r("NC", "North Carolina", ET), r("ND", "North Dakota", CT), r("OH", "Ohio", ET), r("OK", "Oklahoma", CT),
  r("OR", "Oregon", PT), r("PA", "Pennsylvania", ET), r("RI", "Rhode Island", ET), r("SC", "South Carolina", ET), r("SD", "South Dakota", CT),
  r("TN", "Tennessee", CT), r("TX", "Texas", CT), r("UT", "Utah", MT), r("VT", "Vermont", ET), r("VA", "Virginia", ET),
  r("WA", "Washington", PT), r("WV", "West Virginia", ET), r("WI", "Wisconsin", CT), r("WY", "Wyoming", MT),
];

export const AU_STATES: Region[] = [
  r("NSW", "New South Wales", "Australia/Sydney"), r("VIC", "Victoria", "Australia/Melbourne"), r("QLD", "Queensland", "Australia/Brisbane"),
  r("WA", "Western Australia", "Australia/Perth"), r("SA", "South Australia", "Australia/Adelaide"), r("TAS", "Tasmania", "Australia/Hobart"),
  r("ACT", "Australian Capital Territory", "Australia/Sydney"), r("NT", "Northern Territory", "Australia/Darwin"),
];

export const NZ_REGIONS: Region[] = [
  r("NTL", "Northland", "Pacific/Auckland"), r("AUK", "Auckland", "Pacific/Auckland"), r("WKO", "Waikato", "Pacific/Auckland"),
  r("BOP", "Bay of Plenty", "Pacific/Auckland"), r("GIS", "Gisborne", "Pacific/Auckland"), r("HKB", "Hawke's Bay", "Pacific/Auckland"),
  r("TKI", "Taranaki", "Pacific/Auckland"), r("MWT", "Manawatū-Whanganui", "Pacific/Auckland"), r("WGN", "Wellington", "Pacific/Auckland"),
  r("TAS", "Tasman", "Pacific/Auckland"), r("NSN", "Nelson", "Pacific/Auckland"), r("MBH", "Marlborough", "Pacific/Auckland"),
  r("WTC", "West Coast", "Pacific/Auckland"), r("CAN", "Canterbury", "Pacific/Auckland"), r("OTA", "Otago", "Pacific/Auckland"),
  r("STL", "Southland", "Pacific/Auckland"), r("CIT", "Chatham Islands", "Pacific/Chatham"),
];

export const COUNTRIES: Record<CountryCode, { name: string; slug: string; currency: string; regions: Region[]; labels: { region: string; county: string | null; city: string; suburb: string | null; postcode: string } }> = {
  US: { name: "United States", slug: "us", currency: "USD", regions: US_STATES, labels: { region: "State", county: "County", city: "City", suburb: "Neighborhood", postcode: "ZIP code" } },
  AU: { name: "Australia", slug: "au", currency: "AUD", regions: AU_STATES, labels: { region: "State or territory", county: null, city: "City or town", suburb: "Suburb", postcode: "Postcode" } },
  NZ: { name: "New Zealand", slug: "nz", currency: "NZD", regions: NZ_REGIONS, labels: { region: "Region", county: null, city: "City or district", suburb: "Suburb", postcode: "Postcode" } },
};

export function asCountry(c: string | null | undefined): CountryCode {
  return c === "US" || c === "NZ" ? c : "AU";
}

export function findRegion(country: CountryCode, codeOrName: string | null | undefined): Region | undefined {
  if (!codeOrName) return undefined;
  const v = codeOrName.trim().toLowerCase();
  return COUNTRIES[country].regions.find((x) => x.code.toLowerCase() === v || x.name.toLowerCase() === v || x.slug === v);
}

export function validPostcode(country: CountryCode, postcode: string | null | undefined): boolean {
  if (!postcode) return true;
  const p = postcode.trim();
  return country === "US" ? /^\d{5}(-\d{4})?$/.test(p) : /^\d{4}$/.test(p);
}

export type Area = {
  country: CountryCode;
  state?: string | null;
  county?: string | null;
  city?: string | null;
  suburb?: string | null;
  postcode?: string | null;
};

/** "Merewether, Newcastle NSW 2291" / "Downtown, Austin, TX 78701 (Travis County)". */
export function areaLabel(a: Area): string {
  const region = findRegion(a.country, a.state);
  const st = region?.code ?? a.state ?? "";
  const place = [a.suburb, a.city].filter(Boolean).join(", ");
  const tail = a.country === "US" ? [st && `${place ? ", " : ""}${st}`, a.postcode && ` ${a.postcode}`].filter(Boolean).join("") : [st && ` ${st}`, a.postcode && ` ${a.postcode}`].filter(Boolean).join("");
  const county = a.county ? ` (${a.county})` : "";
  return `${place}${tail}${county}`.trim() || region?.name || "";
}

/** URL path for an area: state/city/suburb, e.g. "new-south-wales/newcastle/merewether". */
export function areaSlug(a: Area): string {
  const region = findRegion(a.country, a.state);
  return [region?.slug ?? (a.state ? slugify(a.state) : null), a.city ? slugify(a.city) : null, a.suburb ? slugify(a.suburb) : null].filter(Boolean).join("/");
}

/** Does a free-text location (and optional postcode) fall inside this area? Most specific wins. */
export function areaMatches(a: Area & { label?: string | null }, location: string, postcode?: string | null): boolean {
  const loc = ` ${location.toLowerCase()} `;
  const has = (s?: string | null) => Boolean(s && loc.includes(s.toLowerCase().trim()));
  if (a.postcode && postcode && a.postcode.trim() === postcode.trim()) return true;
  if (a.suburb) return has(a.suburb);
  if (a.city) return has(a.city);
  if (a.county) return has(a.county.replace(/\s+county$/i, ""));
  if (a.label) return has(a.label.split(/[,(]/)[0]);
  return false;
}
