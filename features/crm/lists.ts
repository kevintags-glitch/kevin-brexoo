import "server-only";
import type { OrgContext } from "@/lib/auth/session";
import { fitFor, getFitContext } from "./queries";

export type EnquiryFilters = { q?: string; status?: string; service?: string; owner?: string; fit?: string };

export const ENQUIRY_STATUSES = ["unreviewed", "qualifying", "qualified", "disqualified"] as const;
export const FIT_LABELS = ["Strong fit", "Possible fit", "Weak fit", "Not enough information"] as const;

/**
 * Enquiries matching the filters, newest first, with fit computed. Fit is derived (not stored), so
 * the fit filter runs after the query; the cap keeps this cheap at small-business volumes.
 */
export async function listEnquiries(ctx: OrgContext, f: EnquiryFilters, cap = 1000) {
  const { supabase, org, user } = ctx;
  let query = supabase
    .from("enquiries")
    .select(
      "id, reference, status, source, received_at, answers, duplicate_count, contact:contacts!inner(id, full_name, email, phone, do_not_contact), project:projects(category_code, location_text, postcode, start_timing, budget_label, details, title), opportunities!opportunities_enquiry_id_organization_id_fkey!inner(id, stage, owner_id, owner:profiles!opportunities_owner_id_fkey(full_name, email))",
    )
    .eq("organization_id", org.id)
    .order("received_at", { ascending: false })
    .limit(cap);
  if (f.status && (ENQUIRY_STATUSES as readonly string[]).includes(f.status)) query = query.eq("status", f.status as (typeof ENQUIRY_STATUSES)[number]);
  if (f.owner === "me") query = query.eq("opportunities.owner_id", user.id);
  else if (f.owner === "unassigned") query = query.is("opportunities.owner_id", null);
  else if (f.owner && /^[0-9a-f-]{36}$/.test(f.owner)) query = query.eq("opportunities.owner_id", f.owner);
  const q = (f.q ?? "").trim().slice(0, 80).replace(/[%,()]/g, " ");
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`, { referencedTable: "contacts" });

  const [{ data }, fc] = await Promise.all([query, getFitContext(ctx)]);
  let rows = (data ?? []).map((r) => ({ ...r, fit: fitFor(fc, r.project, r.answers) }));
  if (f.service) rows = rows.filter((r) => r.project?.category_code === f.service);
  if (f.fit) rows = rows.filter((r) => r.fit.label === f.fit);
  return { rows, fc };
}

/** Spreadsheet-safe CSV cell: quotes, and neutralises formula prefixes (CSV injection). */
export function csvCell(v: unknown) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replaceAll('"', '""')}"`;
}
