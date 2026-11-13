import { describe, expect, it } from "vitest";
import { computeIntent } from "@/features/crm/intent";
import { supportAnswer } from "@/features/support/answer";

const now = Date.parse("2026-11-13T00:00:00Z");
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();

describe("computeIntent", () => {
  it("rates a ready, recent, specific lead as high and always labels it inferred", () => {
    const r = computeIntent({ answers: { site_visit: "Yes", land_owned: "Yes", decision_role: "Me" }, startTiming: "Within 1 month", budgetLabel: "$150k–$500k", receivedAt: daysAgo(1), now });
    expect(r.level).toBe("high");
    expect(r.label).toMatch(/inferred/);
    expect(r.evidence.map((e) => e.label)).toContain("Wants to start within a month");
  });

  it("says there isn't enough evidence instead of guessing", () => {
    const r = computeIntent({ answers: {}, receivedAt: daysAgo(10), now });
    expect(r.level).toBe("unknown");
  });

  it("counts negative evidence and ignores 'Not decided' budgets", () => {
    const r = computeIntent({ answers: { land_owned: "Not yet" }, startTiming: "6+ months", budgetLabel: "Not decided", receivedAt: daysAgo(60), now });
    expect(r.level).toBe("low");
    expect(r.evidence.every((e) => e.effect === -1)).toBe(true);
  });

  it("an appointment outweighs an old enquiry date", () => {
    const r = computeIntent({ appointmentCount: 1, startTiming: "1–3 months", receivedAt: daysAgo(50), now });
    expect(r.evidence.find((e) => e.label.startsWith("No booking"))).toBeUndefined();
    expect(["medium", "high"]).toContain(r.level);
  });
});

describe("supportAnswer", () => {
  it("answers pricing with a link to the pricing page", () => {
    const r = supportAnswer("How much does it cost?");
    expect(r.known).toBe(true);
    expect(r.links[0]?.href).toBe("/pricing");
  });
  it("answers markets", () => {
    expect(supportAnswer("Is it available in New Zealand?").text).toMatch(/New Zealand/);
  });
  it("hands off when it doesn't know", () => {
    const r = supportAnswer("What's the weather tomorrow?");
    expect(r.known).toBe(false);
    expect(r.links[0]?.href).toBe("/demo");
  });
});
