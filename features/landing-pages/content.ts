import { z } from "zod";
import { getTemplate } from "@/config/industry-templates";

/** Landing page content (blueprint §7.1). Stored as the draft and snapshotted per version. */
export const pageContentSchema = z.object({
  headline: z.string().trim().min(4, "Add a headline").max(110),
  subheadline: z.string().trim().max(240).default(""),
  highlights: z.array(z.string().trim().max(80)).max(4).default([]),
  about: z.string().trim().max(1200).default(""),
  process: z
    .array(z.object({ title: z.string().trim().max(60), body: z.string().trim().max(240) }))
    .max(5)
    .default([]),
  faqs: z
    .array(z.object({ q: z.string().trim().max(160), a: z.string().trim().max(600) }))
    .max(10)
    .default([]),
  gallery: z
    .array(z.object({ url: z.string().url().max(500), caption: z.string().trim().max(120).default("") }))
    .max(9)
    .default([]),
  cta: z.string().trim().max(40).default("Request a quote"),
  formIntro: z.string().trim().max(240).default(""),
  chatEnabled: z.boolean().default(true),
  accent: z.enum(["blue", "teal", "navy"]).default("blue"),
});

export type PageContent = z.infer<typeof pageContentSchema>;

export function parsePageContent(raw: unknown): PageContent {
  const parsed = pageContentSchema.safeParse(raw ?? {});
  if (parsed.success) return parsed.data;
  // Older or partial drafts: keep whatever validates field by field.
  const base = pageContentSchema.parse({ headline: "Tell us about your project" });
  return { ...base, ...(typeof raw === "object" && raw ? (raw as Partial<PageContent>) : {}) };
}

/** First draft generated from onboarding answers. Every line is editable before approval. */
export function generateDraft(input: {
  businessName: string;
  description?: string | null;
  services: { code: string; name: string }[];
  areas: string[];
  responseHours?: number | null;
}): PageContent {
  const primary = input.services[0];
  const tpl = primary ? getTemplate(primary.code) : undefined;
  const noun = tpl?.workNoun ?? "project";
  const areaText = input.areas.length ? input.areas.slice(0, 3).join(", ") + (input.areas.length > 3 ? " and nearby" : "") : "your area";
  const response = input.responseHours ? (input.responseHours <= 24 ? `within ${input.responseHours} business hours` : "within a few business days") : "promptly";

  return {
    headline: primary ? `${primary.name.replace(/s$/, "")} services across ${areaText}` : `Let's talk about your next ${noun}`,
    subheadline: `Tell ${input.businessName} what you have in mind. We'll review the details and reply ${response}.`,
    highlights: [
      input.services.length > 1 ? `${input.services.length} services under one team` : `Specialists in ${primary?.name.toLowerCase() ?? "your project"}`,
      `Serving ${areaText}`,
      "Clear next steps after every enquiry",
    ],
    about: input.description ?? "",
    process: [
      { title: "Tell us about it", body: "Share the basics: where, what and when. Say “Not sure” to anything you haven't decided." },
      { title: "We review", body: "We check the details, ask anything that's missing and confirm we're a good fit." },
      { title: "Meet or visit", body: "If it suits both sides, we book a call or a site visit at a time that works for you." },
    ],
    faqs: [
      { q: "Is there a cost to enquire?", a: "No. Sending an enquiry is free and doesn't commit you to anything." },
      { q: "What areas do you cover?", a: input.areas.length ? `We work across ${input.areas.join(", ")}.` : "Tell us your location and we'll confirm." },
      { q: "How quickly will you reply?", a: `We aim to reply ${response}.` },
    ],
    gallery: [],
    cta: "Request a quote",
    formIntro: "A few details help us reply with something useful.",
    chatEnabled: true,
    accent: "blue",
  };
}
