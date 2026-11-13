import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { SITE_URL } from "@/lib/env";

type Row = Database["public"]["Tables"]["notification_outbox"]["Row"];
type Result = { status: "sent" | "failed" | "skipped"; error?: string };

/**
 * Transactional email adapter. Resend is used when RESEND_API_KEY is set; otherwise the
 * notification is marked skipped (it stays visible in the outbox and the enquiry is unaffected).
 * Swap this function to change provider without touching product code (§16.3).
 */
export async function deliverNotification(admin: SupabaseClient<Database>, n: Row): Promise<Result> {
  if (n.kind !== "enquiry.received" || !n.organization_id) return { status: "skipped", error: "No delivery rule for this kind" };
  const p = n.payload as { reference?: string; contact_name?: string; category?: string; opportunity_id?: string; owner_id?: string };

  const { data: org } = await admin.from("organizations").select("name, settings").eq("id", n.organization_id).single();
  const ops = ((org?.settings ?? {}) as { operations?: { notify_emails?: string[] } }).operations;
  let to = ops?.notify_emails ?? [];
  if (!to.length && p.owner_id) {
    const { data: owner } = await admin.from("profiles").select("email").eq("id", p.owner_id).single();
    if (owner?.email) to = [String(owner.email)];
  }
  if (!to.length) return { status: "skipped", error: "No recipients configured" };

  const key = process.env.RESEND_API_KEY;
  if (!key) return { status: "skipped", error: "Email provider not configured" };

  // Keep personal details out of the email body: link to the record instead.
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": n.id },
    body: JSON.stringify({
      from: process.env.NOTIFICATIONS_FROM ?? "Brexoo <notifications@example.com>",
      to,
      subject: `New enquiry ${p.reference ?? ""}${p.category ? ` · ${p.category}` : ""}`.trim(),
      text: `${org?.name ?? "Your business"} has a new enquiry${p.contact_name ? ` from ${p.contact_name}` : ""}.\n\nOpen it in Brexoo: ${SITE_URL}/app/opportunities/${p.opportunity_id ?? ""}\n`,
    }),
  }).catch((e: unknown) => ({ ok: false, status: 0, statusText: String(e) }) as Response);
  if (!res.ok) return { status: "failed", error: `Email provider ${res.status} ${res.statusText}` };
  return { status: "sent" };
}
