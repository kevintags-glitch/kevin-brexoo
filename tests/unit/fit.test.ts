import { describe, expect, it } from "vitest";
import { computeConfidence, computeFit } from "@/features/crm/fit";

const base = {
  orgServices: [{ code: "home_builder", name: "Home builders" }],
  serviceAreas: [{ label: "Newcastle NSW", postcode: "2300" }],
  idealMinBudget: "$50k–$150k",
  requiredQuestions: [{ key: "land_owned", label: "Do you own the land?" }],
};

describe("computeFit", () => {
  it("scores a complete, matching enquiry as a strong fit", () => {
    const r = computeFit({
      ...base,
      project: { category_code: "home_builder", location_text: "Merewether, Newcastle NSW", start_timing: "1–3 months", budget_label: "$500k+" },
      answers: { land_owned: "Yes" },
    });
    expect(r.label).toBe("Strong fit");
    expect(r.score).toBe(100);
    expect(r.missing).toEqual([]);
  });

  it("never infers a budget: unstated budget is unknown and excluded from the score", () => {
    const r = computeFit({ ...base, project: { category_code: "home_builder", location_text: "Newcastle NSW" }, answers: { land_owned: "Yes" } });
    expect(r.factors.find((f) => f.key === "budget")?.status).toBe("unknown");
    expect(r.factors.find((f) => f.key === "budget")?.detail).toBe("Budget not stated");
  });

  it("flags a stated budget below the business minimum", () => {
    const r = computeFit({ ...base, project: { category_code: "home_builder", location_text: "Newcastle NSW", budget_label: "Under $10k" }, answers: {} });
    expect(r.factors.find((f) => f.key === "budget")?.status).toBe("mismatch");
  });

  it("treats 'Not sure' answers as missing, not answered", () => {
    const r = computeFit({ ...base, project: { category_code: "home_builder", location_text: "Newcastle" }, answers: { land_owned: "Not sure" } });
    expect(r.missing).toContain("Do you own the land?");
  });

  it("says when there isn't enough information instead of guessing", () => {
    const r = computeFit({ ...base, requiredQuestions: [], project: {}, answers: {} });
    expect(r.score).toBeNull();
    expect(r.label).toBe("Not enough information");
    expect(r.missing).toEqual(expect.arrayContaining(["Service type", "Project location", "Start timing"]));
  });

  it("matches service areas by postcode", () => {
    const r = computeFit({ ...base, project: { category_code: "home_builder", location_text: "Somewhere", postcode: "2300" }, answers: { land_owned: "Yes" } });
    expect(r.factors.find((f) => f.key === "location")?.status).toBe("match");
  });

  it("marks an unlisted location as 'check', not as a mismatch", () => {
    const r = computeFit({ ...base, project: { category_code: "home_builder", location_text: "Sydney" }, answers: {} });
    expect(r.factors.find((f) => f.key === "location")?.status).toBe("partial");
  });
});

describe("computeConfidence", () => {
  const now = new Date("2026-11-13T00:00:00Z");
  it("is high for a fresh first-party enquiry with two contact methods", () => {
    expect(computeConfidence({ source: "landing_page", receivedAt: "2026-11-12T00:00:00Z", hasEmail: true, hasPhone: true, now }).level).toBe("High");
  });
  it("drops as evidence ages", () => {
    const c = computeConfidence({ source: "manual", receivedAt: "2026-08-01T00:00:00Z", hasEmail: true, hasPhone: false, now });
    expect(c.level).toBe("Low");
    expect(c.reasons.join(" ")).toMatch(/may be stale/);
  });
});

describe("fit coverage", () => {
  it("doesn't call a record a strong fit when most evidence is unknown", () => {
    const r = computeFit({ ...base, project: { category_code: "home_builder", location_text: "Maitland" }, answers: {} });
    expect(r.score).not.toBeNull();
    expect(r.label).not.toBe("Strong fit");
  });
});
