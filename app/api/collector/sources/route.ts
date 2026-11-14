import { NextResponse, type NextRequest } from "next/server";
import { bearerMatches } from "@/lib/auth/bearer";
import { createServiceClient } from "@/lib/supabase/admin";

/** The collector asks which sources are enabled and where each left off, so no state lives on the runner. */
export async function GET(request: NextRequest) {
  if (!bearerMatches(request.headers.get("authorization"), process.env.COLLECTOR_TOKEN)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = createServiceClient();
  if (!admin) return NextResponse.json({ error: "SUPABASE_SECRET_KEY is not set" }, { status: 503 });
  const { data, error } = await admin
    .from("platform_sources")
    .select("key, name, kind, country, region, enabled, disabled_reason, cursor, last_run_at")
    .order("key");
  if (error) return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  return NextResponse.json({ sources: data });
}
