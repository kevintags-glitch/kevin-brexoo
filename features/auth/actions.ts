"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/env";

export type AuthState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean; email?: string };

const email = z.string().trim().toLowerCase().email("Enter a valid email address");
const password = z.string().min(10, "Use at least 10 characters").max(72, "Use 72 characters or fewer");

function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) out[String(i.path[0])] ??= i.message;
  return out;
}

/** Only allow redirects to paths inside the app (no open redirects). */
function safeNext(raw: FormDataEntryValue | null, fallback = "/app") {
  const v = typeof raw === "string" ? raw : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : fallback;
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ email, password: z.string().min(1, "Enter your password") }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") return { error: "Please confirm your email first. Check your inbox for the link.", email: parsed.data.email };
    return { error: "That email and password don't match." };
  }
  redirect(safeNext(form.get("next")));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z
    .object({
      full_name: z.string().trim().min(1, "Enter your name").max(120),
      email,
      password,
      terms: z.literal("on", { message: "Please accept the terms to continue" }),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const plan = String(form.get("plan") ?? "");
  const next = safeNext(form.get("next"), "/app/setup");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name, requested_plan: ["launch", "growth", "managed"].includes(plan) ? plan : null },
      emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    if (error.code === "weak_password") return { fieldErrors: { password: "Choose a stronger password." } };
    if (error.code === "over_email_send_rate_limit") return { error: "Too many sign-up emails. Please wait a minute and try again." };
    return { error: "We couldn't create your account. Please try again." };
  }
  // Same response whether or not the email already exists, so accounts can't be enumerated.
  redirect(`/verify?email=${encodeURIComponent(parsed.data.email)}`);
}

export async function resendConfirmation(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address" };
  const supabase = await createClient();
  await supabase.auth.resend({ type: "signup", email: parsed.data, options: { emailRedirectTo: `${SITE_URL}/auth/callback?next=/app/setup` } });
  return { ok: true };
}

export async function requestPasswordReset(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { fieldErrors: { email: "Enter a valid email address" } };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${SITE_URL}/auth/callback?next=/reset-password` });
  return { ok: true };
}

export async function updatePassword(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z
    .object({ password, confirm: z.string() })
    .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Your reset link has expired. Request a new one." };
  redirect("/app");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
