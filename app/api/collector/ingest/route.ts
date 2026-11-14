import { NextResponse, type NextRequest } from "next/server";
import { bearerMatches } from "@/lib/auth/bearer";
import { createServiceClient } from "@/lib/supabase/admin";
import { ingestSchema } from "@/features/collector/schema";

/**
 * Project Data Collector ingest. The scheduled Python collector posts batches of normalised records
 * (`Authorization: Bearer $COLLECTOR_TOKEN`). The database upserts them into the platform pool,
 * logs the run and distributes private copies to every matching business.
 */
export async function POST(request: NextRequest) {
  if (!bearerMatches(request.headers.get("authorization"), process.env.COLLECTOR_TOKEN)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = createServiceClient();
  if (!admin) return NextResponse.json({ error: "SUPABASE_SECRET_KEY is not set" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", issues: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 400 });
  }
  const { source, records, run } = parsed.data;
  const { data, error } = await admin.rpc("ingest_collected_projects", {
    p_source_key: source,
    p_records: records as never,
    p_run: (run ?? {}) as never,
  });
  if (error) {
    const unknown = /Unknown source/.test(error.message);
    return NextResponse.json({ error: unknown ? "unknown_source" : "ingest_failed" }, { status: unknown ? 404 : 500 });
  }
  return NextResponse.json(data);
}
