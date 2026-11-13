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
});

export type EnquiryResult = { ok: true; reference: string; duplicate: boolean } | { ok: false; error: string };

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
  const { company_website, started_at, ...payload } = parsed.data;
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
  return { ok: true, reference: res.reference!, duplicate: Boolean(res.duplicate) };
}
