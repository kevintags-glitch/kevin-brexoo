import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/** Constant-time check of an `Authorization: Bearer <token>` header against a configured secret. */
export function bearerMatches(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const a = createHash("sha256").update(header.slice(7)).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}

/** SHA-256 hex of an inbound key; only the hash is stored. */
export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}
