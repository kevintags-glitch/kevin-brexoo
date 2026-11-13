"use server";
import { z } from "zod";
import { createAnonClient } from "@/lib/supabase/server";
import { visitorFingerprint } from "@/lib/fingerprint";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().max(254).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  preferred_contact: z.enum(["email", "phone", "sms", "any"]).optional(),
  category_code: z.string().max(40).optional(),
  description: z.string().trim().min(3).max(4000),
  location: z.string().trim().max(160).optional().default(""),
  postcode: z.string().trim().max(12).optional().default(""),
  answers: z.record(z.string(), z.string().max(300)).default({}),
  consent: z.literal(true),
  consent_text: z.string().max(500),
  source: z.enum(["landing_page", "visitor_chat"]).default("landing_page"),
  // Anti-spam: honeypot must be empty; real people take more than a couple of seconds.
  company_website: z.string().max(0).optional(),
  started_at: z.number().optional(),
  // Optional time request (confirmed later by the business).
  requested_start: z.string().datetime({ offset: true }).optional(),
  requested_type: z.enum(["phone", "video", "site_visit"]).optional(),
});

export type EnquiryResult = { ok: true; reference: string; duplicate: boolean; requested?: string | null; bookingError?: string } | { ok: false; error: string };

export type Availability = { ok: boolean; timezone?: string; minutes?: number; types?: string[]; slots?: string[] };

/** Free times for a published page. Only start times are returned, never other bookings. */
export async function getAvailability(slug: string): Promise<Availability> {
  const { data, error } = await createAnonClient().rpc("get_public_availability", { p_slug: slug, p_days: 14 });
  if (error || !data) return { ok: false };
  return data as Availability;
}

const ERRORS: Record<string, string> = {
  name_required: "Please add your name.",
  contact_required: "Please add an email address or phone number.",
  email_invalid: "That email address doesn't look right.",
  phone_invalid: "That phone number doesn't look right.",
  description_required: "Please describe the project in a few words.",
  consent_required: "Please confirm we can pass your details to the business.",
  category_invalid: "Please choose one of the listed services.",
  rate_limited: "Too many enquiries from this device. Please try again a little later.",
  page_unavailable: "This page isn't accepting enquiries right now.",
};

export async function submitEnquiry(slug: string, input: unknown): Promise<EnquiryResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form and try again." };
  const { company_website, started_at, requested_start, requested_type, ...payload } = parsed.data;
  if (company_website || (started_at && Date.now() - started_at < 2500)) {
    // Looks automated: accept silently without saving.
    return { ok: true, reference: "RECEIVED", duplicate: false };
  }
  const { data, error } = await createAnonClient().rpc("submit_public_enquiry", {
    p_slug: slug,
    p: payload,
    p_fingerprint: await visitorFingerprint(),
  });
  if (error) return { ok: false, error: "We couldn't send that just now. Please try again in a minute." };
  const res = data as { ok: boolean; reference?: string; duplicate?: boolean; error?: string };
  if (!res.ok) return { ok: false, error: ERRORS[res.error ?? ""] ?? "Please check the form and try again." };
  if (requested_start && requested_type && !res.duplicate) {
    const { data: b } = await createAnonClient().rpc("request_public_booking", { p_slug: slug, p_reference: res.reference!, p_start: requested_start, p_type: requested_type });
    const booking = (b ?? {}) as { ok?: boolean; error?: string };
    if (!booking.ok) {
      return { ok: true, reference: res.reference!, duplicate: false, requested: null, bookingError: booking.error === "slot_taken" ? "That time was just taken, so we've sent your enquiry without it. The business will suggest a time." : "We couldn't add your preferred time, so the business will suggest one." };
    }
    return { ok: true, reference: res.reference!, duplicate: false, requested: requested_start };
  }
  return { ok: true, reference: res.reference!, duplicate: Boolean(res.duplicate) };
}
