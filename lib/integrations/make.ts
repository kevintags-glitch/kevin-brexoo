import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { SITE_URL } from "@/lib/env";

/** Only Make.com webhook URLs are accepted, so business data is never posted to an arbitrary host. */
export const MAKE_URL = /^https:\/\/hook\.[a-z0-9-]+\.make\.com\/[A-Za-z0-9_-]{8,128}$/;

export const MAKE_EVENTS = [
  { id: "enquiry.received", label: "New enquiry received" },
  { id: "appointment.booked", label: "Appointment booked" },
  { id: "opportunity.won", label: "Opportunity won" },
] as const;

export type MakeResult = { ok: boolean; status: string };

/**
 * Posts one signed event. The body is signed with HMAC-SHA256 using the integration's secret and
 * sent as `X-Brexoo-Signature: sha256=<hex>`, so a Make scenario can verify it came from Brexoo.
 * Redirects are refused and the request times out after 10 seconds.
 */
export async function postToMake(url: string, secret: string, event: string, data: Record<string, unknown>, deliveryId: string = randomUUID()): Promise<MakeResult> {
  if (!MAKE_URL.test(url)) return { ok: false, status: "Blocked: not a Make.com webhook URL" };
  const opp = typeof data.opportunity_id === "string" ? data.opportunity_id : null;
  const body = JSON.stringify({ id: deliveryId, event, occurred_at: new Date().toISOString(), link: opp ? `${SITE_URL}/app/opportunities/${opp}` : null, data });
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  try {
    const res = await fetch(url, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
      headers: { "Content-Type": "application/json", "X-Brexoo-Event": event, "X-Brexoo-Delivery": deliveryId, "X-Brexoo-Signature": `sha256=${signature}` },
      body,
    });
    return { ok: res.ok, status: `${res.status} ${res.statusText}`.trim() };
  } catch (e) {
    return { ok: false, status: e instanceof Error ? e.name === "TimeoutError" ? "Timed out" : e.message.slice(0, 120) : "Request failed" };
  }
}
