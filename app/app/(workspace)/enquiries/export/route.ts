import { NextResponse, type NextRequest } from "next/server";
import { csvCell, listEnquiries } from "@/features/crm/lists";
import { STAGE_BY_ID } from "@/features/crm/stages";
import { requireOrg } from "@/lib/auth/session";

/** CSV export of the current filtered view. Owner-only and written to the audit log. */
export async function GET(request: NextRequest) {
  const ctx = await requireOrg();
  if (!ctx.isOwner) return NextResponse.json({ error: "Only an owner can export data." }, { status: 403 });
  const sp = request.nextUrl.searchParams;
  const filters = { q: sp.get("q") ?? "", status: sp.get("status") ?? "", service: sp.get("service") ?? "", owner: sp.get("owner") ?? "", fit: sp.get("fit") ?? "" };
  const { rows, fc } = await listEnquiries(ctx, filters, 5000);
  const { error } = await ctx.supabase.rpc("record_export", { p_entity: "enquiries", p_count: rows.length, p_filters: filters });
  if (error) return NextResponse.json({ error: "Export not permitted." }, { status: 403 });

  const header = ["Reference", "Received (UTC)", "Name", "Email", "Phone", "Do not contact", "Service", "Location", "Postcode", "Status", "Stage", "Owner", "Fit", "Fit score", "Missing"];
  const lines = rows.map((r) => {
    const opp = r.opportunities?.[0];
    return [
      r.reference,
      r.received_at,
      r.contact.full_name,
      r.contact.email,
      r.contact.phone,
      r.contact.do_not_contact ? "yes" : "no",
      fc.orgServices.find((s) => s.code === r.project?.category_code)?.name ?? "",
      r.project?.location_text,
      r.project?.postcode,
      r.status,
      opp ? STAGE_BY_ID[opp.stage].label : "",
      opp?.owner?.full_name || opp?.owner?.email || "",
      r.fit.label,
      r.fit.score ?? "",
      r.fit.missing.join("; "),
    ]
      .map(csvCell)
      .join(",");
  });
  const body = "﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="brexoo-enquiries-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
