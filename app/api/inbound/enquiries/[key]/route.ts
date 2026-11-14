import { NextResponse, type NextRequest } from "next/server";
import { hashKey } from "@/lib/auth/bearer";
import { createServiceClient } from "@/lib/supabase/admin";
import { INBOUND_ERRORS, inboundEnquirySchema } from "@/features/collector/schema";

/**
 * Inbound homeowner enquiries for one business, usually posted by a Make.com scenario (Facebook
 * Lead Ads, Google Forms, Hipages and the like). The secret key in the URL identifies the business;
 * only its hash is stored. Accepts JSON or form-encoded bodies.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!/^bxk_[A-Za-z0-9_-]{20,80}$/.test(key)) {
    return NextResponse.json({ ok: false, error: "key_invalid", message: INBOUND_ERRORS.key_invalid!.message }, { status: 401 });
  }
  const admin = createServiceClient();
  if (!admin) return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });

  const type = request.headers.get("content-type") ?? "";
  const raw = type.includes("application/json")
    ? await request.json().catch(() => null)
    : Object.fromEntries((await request.formData().catch(() => new FormData())).entries());
  const parsed = inboundEnquirySchema.safeParse(raw ?? {});
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_body", message: parsed.error.issues[0]?.message ?? "Check the fields" }, { status: 400 });
  }

  const { data, error } = await admin.rpc("submit_inbound_enquiry", { p_key_hash: hashKey(key), p: parsed.data as never });
  if (error) return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  const result = data as { ok: boolean; error?: string; reference?: string; duplicate?: boolean };
  if (!result.ok) {
    const e = INBOUND_ERRORS[result.error ?? ""] ?? { status: 400, message: "The enquiry couldn't be accepted." };
    return NextResponse.json({ ok: false, error: result.error, message: e.message }, { status: e.status });
  }
  return NextResponse.json({ ok: true, reference: result.reference, duplicate: result.duplicate ?? false }, { status: result.duplicate ? 200 : 201 });
}
