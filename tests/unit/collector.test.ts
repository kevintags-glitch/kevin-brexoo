import { describe, expect, it } from "vitest";
import { collectedProjectSchema, inboundEnquirySchema, ingestSchema } from "@/features/collector/schema";
import { bearerMatches, hashKey } from "@/lib/auth/bearer";

describe("collector ingest contract", () => {
  it("accepts a normalised planning record and rejects bad fields", () => {
    const ok = collectedProjectSchema.safeParse({
      external_id: "PAN-1001", title: "New two-storey dwelling", category_code: "home_builder", country: "AU", region: "NSW",
      suburb: "Merewether", postcode: "2291", estimated_value_minor: 85000000, currency: "AUD", observed_at: "2026-11-10",
      source_url: "https://www.planningportal.nsw.gov.au/",
    });
    expect(ok.success).toBe(true);
    expect(collectedProjectSchema.safeParse({ external_id: "", title: "x" }).success).toBe(false);
    expect(collectedProjectSchema.safeParse({ external_id: "A", title: "Job", observed_at: "10/11/2026" }).success).toBe(false);
    expect(collectedProjectSchema.safeParse({ external_id: "A", title: "Job", currency: "aud" }).success).toBe(false);
  });

  it("caps batches at 500 records and requires a valid source key", () => {
    const rec = { external_id: "1", title: "Job" };
    expect(ingestSchema.safeParse({ source: "nsw-planning-da", records: Array(500).fill(rec) }).success).toBe(true);
    expect(ingestSchema.safeParse({ source: "nsw-planning-da", records: Array(501).fill(rec) }).success).toBe(false);
    expect(ingestSchema.safeParse({ source: "NSW Planning", records: [] }).success).toBe(false);
    // Both UTC forms the Python collector may send are accepted.
    expect(ingestSchema.safeParse({ source: "nsw-planning-da", records: [], run: { started_at: "2026-11-14T02:00:00Z" } }).success).toBe(true);
    expect(ingestSchema.safeParse({ source: "nsw-planning-da", records: [], run: { started_at: "2026-11-14T02:00:00+00:00" } }).success).toBe(true);
  });
});

describe("inbound enquiries from Make.com", () => {
  it("maps common lead-form field names onto Brexoo's", () => {
    const r = inboundEnquirySchema.parse({
      first_name: "Mia", last_name: "Nguyen", email: "mia@example.com", phone_number: "0400 111 222", message: "Granny flat",
      suburb: "Merewether", city: "Newcastle", zip: "2291", consent: "yes",
    });
    expect(r).toMatchObject({ name: "Mia Nguyen", phone: "0400 111 222", description: "Granny flat", location: "Merewether, Newcastle", postcode: "2291", consent: true });
  });

  it("treats missing or false consent as no consent", () => {
    expect(inboundEnquirySchema.parse({ name: "A", email: "a@b.co", message: "Deck" }).consent).toBe(false);
    expect(inboundEnquirySchema.parse({ name: "A", email: "a@b.co", message: "Deck", consent: "false" }).consent).toBe(false);
    expect(inboundEnquirySchema.parse({ name: "A", email: "a@b.co", message: "Deck", consent: true }).consent).toBe(true);
  });
});

describe("collector authentication", () => {
  it("only accepts the exact bearer token, and never when none is configured", () => {
    expect(bearerMatches("Bearer s3cret", "s3cret")).toBe(true);
    expect(bearerMatches("Bearer s3cret ", "s3cret")).toBe(false);
    expect(bearerMatches("s3cret", "s3cret")).toBe(false);
    expect(bearerMatches(null, "s3cret")).toBe(false);
    expect(bearerMatches("Bearer ", undefined)).toBe(false);
  });

  it("stores inbound keys only as SHA-256 hashes", () => {
    expect(hashKey("bxk_example")).toMatch(/^[0-9a-f]{64}$/);
    expect(hashKey("bxk_example")).not.toContain("bxk_");
  });
});
