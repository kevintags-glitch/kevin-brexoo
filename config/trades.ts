/**
 * The eight launch industry groups (master plan), with their templates, sample business and the
 * URL slug used for location SEO pages (/leads/<trade>/<country>/<state>/<city>).
 */
import type { SampleBusiness } from "./samples";

export type Trade = {
  slug: string;
  name: string;
  /** "electricians", used in sentences: "project leads for electricians in Austin". */
  plural: string;
  /** Singular service noun for local copy: "electrical work". */
  work: string;
  templates: string[];
  sample: SampleBusiness["key"];
  illustration: "house" | "bolt" | "tap" | "fan" | "hammer" | "leaf" | "spray" | "roof";
  industryPage: "/builders" | "/trades";
};

export const TRADES: Trade[] = [
  { slug: "builders", name: "Builders & developers", plural: "builders and developers", work: "new homes, extensions and developments", templates: ["home_builder", "property_developer"], sample: "builders", illustration: "house", industryPage: "/builders" },
  { slug: "electricians", name: "Electricians", plural: "electricians", work: "electrical work", templates: ["electrician"], sample: "electricians", illustration: "bolt", industryPage: "/trades" },
  { slug: "plumbers", name: "Plumbers", plural: "plumbers", work: "plumbing, hot water and drainage", templates: ["plumber"], sample: "plumbers", illustration: "tap", industryPage: "/trades" },
  { slug: "hvac", name: "HVAC contractors", plural: "HVAC contractors", work: "heating, cooling and ventilation", templates: ["hvac"], sample: "hvac", illustration: "fan", industryPage: "/trades" },
  { slug: "renovation", name: "Renovation & remodelling", plural: "renovation and remodelling contractors", work: "kitchen, bathroom and whole-home renovations", templates: ["renovation"], sample: "renovation", illustration: "hammer", industryPage: "/builders" },
  { slug: "landscaping", name: "Landscaping & lawn care", plural: "landscapers and lawn care businesses", work: "landscaping and lawn care", templates: ["landscaping", "lawn_care"], sample: "landscaping", illustration: "leaf", industryPage: "/trades" },
  { slug: "cleaning", name: "Cleaning services", plural: "cleaning businesses", work: "home and commercial cleaning", templates: ["cleaning"], sample: "cleaning", illustration: "spray", industryPage: "/trades" },
  { slug: "roofing-painting", name: "Roofing & painting", plural: "roofers and painters", work: "roofing and painting", templates: ["roofing", "painting"], sample: "roofing", illustration: "roof", industryPage: "/trades" },
];

export const TRADE_BY_SLUG = Object.fromEntries(TRADES.map((t) => [t.slug, t])) as Record<string, Trade>;
