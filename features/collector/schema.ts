import { z } from "zod";

/**
 * The ingest contract shared by the Python collector and the API. Field limits mirror the
 * `collected_projects` table, so anything the API accepts the database accepts too.
 */
const text = (max: number) => z.string().trim().max(max).optional().nullable();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional().nullable();

export const collectedProjectSchema = z.object({
  external_id: z.string().trim().min(1).max(200),
  title: z.string().trim().min(2).max(200),
  description: text(4000),
  category_code: text(40),
  scope: z.enum(["local", "regional"]).optional(),
  country: z.enum(["US", "AU", "NZ"]).optional(),
  region: text(80),
  city: text(80),
  suburb: text(80),
  postcode: text(12),
  address: text(200),
  stage: text(80),
  estimated_value_minor: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/).optional().nullable(),
  observed_at: isoDate,
  closes_at: isoDate,
  source_url: z.string().url().max(500).optional().nullable(),
  status: z.enum(["active", "closed"]).optional(),
});
export type CollectedProject = z.infer<typeof collectedProjectSchema>;

export const ingestSchema = z.object({
  source: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(60),
  // Records are validated one by one in the database, so a single bad row doesn't sink the batch.
  records: z.array(z.record(z.string(), z.unknown())).max(500),
  run: z
    .object({ started_at: z.string().datetime({ offset: true }).optional(), fetched: z.number().int().nonnegative().optional(), cursor: z.string().max(200).optional() })
    .optional(),
});

/**
 * Inbound homeowner enquiry from Make.com (or any tool). Accepts the field names lead-form tools
 * commonly use, so a Make scenario needs little mapping.
 */
export const inboundEnquirySchema = z
  .object({
    name: z.string().trim().max(120).optional(),
    full_name: z.string().trim().max(120).optional(),
    first_name: z.string().trim().max(60).optional(),
    last_name: z.string().trim().max(60).optional(),
    email: z.string().trim().max(254).optional(),
    phone: z.string().trim().max(40).optional(),
    phone_number: z.string().trim().max(40).optional(),
    description: z.string().trim().max(4000).optional(),
    message: z.string().trim().max(4000).optional(),
    location: z.string().trim().max(160).optional(),
    suburb: z.string().trim().max(80).optional(),
    city: z.string().trim().max(80).optional(),
    postcode: z.string().trim().max(12).optional(),
    zip: z.string().trim().max(12).optional(),
    category_code: z.string().trim().max(40).optional(),
    preferred_contact: z.enum(["email", "phone", "sms", "any"]).optional(),
    consent: z.union([z.boolean(), z.enum(["true", "false", "yes", "no", "1", "0"])]).optional(),
    consent_text: z.string().trim().max(500).optional(),
    channel: z.string().trim().max(60).optional(),
    answers: z.record(z.string(), z.union([z.string().max(300), z.number(), z.boolean()])).optional(),
  })
  .transform((v) => {
    const name = v.name || v.full_name || [v.first_name, v.last_name].filter(Boolean).join(" ");
    const consent = typeof v.consent === "boolean" ? v.consent : ["true", "yes", "1"].includes(String(v.consent ?? ""));
    return {
      name,
      email: v.email || undefined,
      phone: v.phone || v.phone_number || undefined,
      description: v.description || v.message || "",
      location: v.location || [v.suburb, v.city].filter(Boolean).join(", ") || undefined,
      postcode: v.postcode || v.zip || undefined,
      category_code: v.category_code || undefined,
      preferred_contact: v.preferred_contact,
      consent,
      consent_text: v.consent_text,
      channel: v.channel,
      answers: v.answers ?? {},
    };
  });
export type InboundEnquiry = z.output<typeof inboundEnquirySchema>;

/** Messages a sending tool can show, keyed by the database's error codes. */
export const INBOUND_ERRORS: Record<string, { status: number; message: string }> = {
  key_invalid: { status: 401, message: "This inbound link is not valid or has been revoked." },
  rate_limited: { status: 429, message: "Too many enquiries in a short time. Try again in a few minutes." },
  name_required: { status: 400, message: "A name is required." },
  contact_required: { status: 400, message: "An email address or phone number is required." },
  email_invalid: { status: 400, message: "The email address isn't valid." },
  phone_invalid: { status: 400, message: "The phone number isn't valid." },
  description_required: { status: 400, message: "A short description of the project is required." },
  consent_required: { status: 400, message: "The person must have agreed to be contacted (consent: true)." },
};
