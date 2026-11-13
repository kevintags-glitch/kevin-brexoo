import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * A salted hash of the visitor's IP and user agent, used only as a rate-limit key. The raw IP is
 * never stored.
 */
export async function visitorFingerprint() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const ua = h.get("user-agent") ?? "";
  return createHash("sha256")
    .update(`${process.env.RATE_LIMIT_SALT ?? "brexoo"}|${ip}|${ua}`)
    .digest("hex")
    .slice(0, 40);
}
