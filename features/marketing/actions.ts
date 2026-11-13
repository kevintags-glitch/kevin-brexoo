"use server";
import { z } from "zod";
import { createAnonClient } from "@/lib/supabase/server";
import { visitorFingerprint } from "@/lib/fingerprint";

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(254),
  company: z.string().trim().max(120).optional(),
  industry: z.string().max(40).optional(),
  team_size: z.string().max(20).optional(),
  message: z.string().trim().max(2000).optional(),
  consent: z.literal("on", { message: "Please confirm we can contact you" }),
  website: z.string().max(0).optional(), // honeypot: real people leave it empty
});

export type DemoState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

export async function requestDemo(_prev: DemoState, form: FormData): Promise<DemoState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    if (fieldErrors.website) return { ok: true }; // silently drop bots
    return { fieldErrors };
  }
  const { website: _hp, consent: _c, ...payload } = parsed.data;
  const { data, error } = await createAnonClient().rpc("submit_demo_request", {
    p: { ...payload, consent: true },
    p_fingerprint: await visitorFingerprint(),
  });
  if (error) return { error: "We couldn't send that just now. Please try again in a minute." };
  const res = data as { ok: boolean; error?: string };
  if (!res.ok) return { error: res.error === "rate_limited" ? "Too many requests from this device. Please try again later." : "Please check the form and try again." };
  return { ok: true };
}
