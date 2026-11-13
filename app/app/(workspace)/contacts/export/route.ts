import { NextResponse, type NextRequest } from "next/server";
import { csvCell } from "@/features/crm/lists";
import { requireOrg } from "@/lib/auth/session";

/** CSV export of contacts (owner-only, audited). Do-not-contact status is included so it travels with the data. */
export async function GET(request: NextRequest) {
  const { supabase, org, isOwner } = await requireOrg();
  if (!isOwner) return NextResponse.json({ error: "Only an owner can export data." }, { status: 403 });
  const sp = request.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 80).replace(/[%,()]/g, " ");
  let query = supabase.from("contacts").select("full_name, email, phone, preferred_contact, source, do_not_contact, opted_out_at, created_at").eq("organization_id", org.id).is("merged_into", null).order("created_at", { ascending: false }).limit(10000);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  if (sp.get("status") === "dnc") query = query.eq("do_not_contact", true);
  if (sp.get("status") === "contactable") query = query.eq("do_not_contact", false);
  const source = sp.get("source");
  if (source && ["landing_page", "visitor_chat", "manual", "import"].includes(source)) query = query.eq("source", source as "landing_page");
  const { data } = await query;
  const rows = data ?? [];
  const { error } = await supabase.rpc("record_export", { p_entity: "contacts", p_count: rows.length, p_filters: Object.fromEntries(sp) });
  if (error) return NextResponse.json({ error: "Export not permitted." }, { status: 403 });
  const header = ["Name", "Email", "Phone", "Preferred contact", "Source", "Do not contact", "Opted out (UTC)", "Added (UTC)"];
  const body =
    "﻿" +
    [header, ...rows.map((c) => [c.full_name, c.email, c.phone, c.preferred_contact, c.source, c.do_not_contact ? "yes" : "no", c.opted_out_at, c.created_at])]
      .map((r) => r.map(csvCell).join(","))
      .join("\r\n");
  return new NextResponse(body, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="brexoo-contacts-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
