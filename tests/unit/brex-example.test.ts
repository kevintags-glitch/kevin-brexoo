import { describe, expect, it } from "vitest";
import { brexExample } from "@/features/marketing/brex-example";

describe("home page Brex AI example", () => {
  const ex = brexExample("builders", "B-01", Date.parse("2026-11-14T00:00:00Z"));

  it("is built from the product's own fit and intent logic for the sample lead", () => {
    expect(ex.lead.name).toBe("Sarah Mitchell");
    expect(ex.fit.label).toBe("Strong fit");
    expect(ex.fit.factors.find((f) => f.key === "location")?.status).toBe("match");
    expect(ex.intent.label).toMatch(/inferred/);
    expect(ex.intent.evidence.map((e) => e.label)).toContain("Asked for a site visit or consultation");
  });

  it("lists unknowns instead of guessing and recommends a concrete next step", () => {
    expect(ex.fit.factors.find((f) => f.key === "budget")?.status).toBe("unknown");
    expect(ex.next.text).toMatch(/^Next best action: Call Sarah/);
    expect(ex.draft?.body).toMatch(/Offer a call back or site visit time/);
    expect(ex.summary.some((s) => s.text.includes("Merewether"))).toBe(true);
  });
});
