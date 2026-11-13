import { describe, expect, it } from "vitest";
import { AU_STATES, NZ_REGIONS, US_STATES, areaLabel, areaSlug, findRegion, validPostcode } from "@/config/locations";
import { computeFit } from "@/features/crm/fit";

describe("location lists", () => {
  it("covers every US state plus DC, every AU state and territory, and every NZ region", () => {
    expect(US_STATES).toHaveLength(51);
    expect(AU_STATES).toHaveLength(8);
    expect(NZ_REGIONS).toHaveLength(17);
    expect(new Set(US_STATES.map((s) => s.code)).size).toBe(51);
  });
  it("finds regions by code, name or slug", () => {
    expect(findRegion("US", "tx")?.name).toBe("Texas");
    expect(findRegion("AU", "New South Wales")?.code).toBe("NSW");
    expect(findRegion("NZ", "hawke-s-bay")?.name).toBe("Hawke's Bay");
  });
});

describe("postcodes", () => {
  it("validates per country", () => {
    expect(validPostcode("US", "78701")).toBe(true);
    expect(validPostcode("US", "78701-1234")).toBe(true);
    expect(validPostcode("US", "2291")).toBe(false);
    expect(validPostcode("AU", "2291")).toBe(true);
    expect(validPostcode("NZ", "8011")).toBe(true);
    expect(validPostcode("NZ", "80111")).toBe(false);
    expect(validPostcode("AU", "")).toBe(true);
  });
});

describe("labels and slugs", () => {
  it("formats the way locals write addresses", () => {
    expect(areaLabel({ country: "AU", state: "NSW", city: "Newcastle", suburb: "Merewether", postcode: "2291" })).toBe("Merewether, Newcastle NSW 2291");
    expect(areaLabel({ country: "US", state: "TX", county: "Travis County", city: "Austin", postcode: "78701" })).toBe("Austin, TX 78701 (Travis County)");
    expect(areaLabel({ country: "NZ", state: "CAN", city: "Christchurch", suburb: "Riccarton" })).toBe("Riccarton, Christchurch CAN");
  });
  it("builds URL paths from state, city and suburb", () => {
    expect(areaSlug({ country: "AU", state: "NSW", city: "Newcastle", suburb: "Merewether" })).toBe("new-south-wales/newcastle/merewether");
    expect(areaSlug({ country: "US", state: "TX", city: "Austin" })).toBe("texas/austin");
    expect(areaSlug({ country: "NZ", state: "AUK", city: "Auckland", suburb: "Ponsonby" })).toBe("auckland/auckland/ponsonby");
  });
});

describe("area matching in fit", () => {
  const base = { orgServices: [{ code: "home_builder", name: "Home builders" }], requiredQuestions: [], answers: {} };
  it("matches by suburb, city or postcode", () => {
    const areas = [{ label: "Merewether, Newcastle NSW 2291", city: "Newcastle", suburb: "Merewether", postcode: "2291" }];
    const bySuburb = computeFit({ ...base, serviceAreas: areas, project: { category_code: "home_builder", location_text: "12 Smith St, Merewether" } });
    expect(bySuburb.factors.find((f) => f.key === "location")?.status).toBe("match");
    const byPostcode = computeFit({ ...base, serviceAreas: areas, project: { category_code: "home_builder", location_text: "Somewhere", postcode: "2291" } });
    expect(byPostcode.factors.find((f) => f.key === "location")?.status).toBe("match");
    const outside = computeFit({ ...base, serviceAreas: areas, project: { category_code: "home_builder", location_text: "Hamilton, Newcastle" } });
    expect(outside.factors.find((f) => f.key === "location")?.status).toBe("partial");
  });
  it("still matches older label-only areas", () => {
    const r = computeFit({ ...base, serviceAreas: [{ label: "Newcastle NSW" }], project: { category_code: "home_builder", location_text: "Newcastle NSW 2300" } });
    expect(r.factors.find((f) => f.key === "location")?.status).toBe("match");
  });
});
