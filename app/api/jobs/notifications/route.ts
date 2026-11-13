import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { deliverNotification } from "@/lib/notifications";

/**
 * Notification outbox worker (blueprint §16.2). Call on a schedule (e.g. every minute from a cron
 * or a job runner) with `Authorization: Bearer $JOBS_TOKEN`. Claims a batch, delivers each one and
 * records the result; failures back off and retry. Enquiries are already saved before this runs.
 */
export async function POST(request: NextRequest) {
  const token = process.env.JOBS_TOKEN;
  if (!token || request.headers.get("authorization") !== `Bearer ${token}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = createServiceClient();
  if (!admin) return NextResponse.json({ error: "SUPABASE_SECRET_KEY is not set" }, { status: 503 });

  const { data: batch, error } = await admin.rpc("claim_notifications", { p_limit: 20 });
  if (error) return NextResponse.json({ error: "claim failed" }, { status: 500 });

  const results = { sent: 0, failed: 0, skipped: 0 };
  for (const n of batch ?? []) {
    const r = await deliverNotification(admin, n);
    await admin.rpc("finish_notification", { p_id: n.id, p_ok: r.status === "sent", p_error: r.error ?? undefined, p_skipped: r.status === "skipped" });
    results[r.status]++;
  }
  return NextResponse.json({ claimed: batch?.length ?? 0, ...results });
}
