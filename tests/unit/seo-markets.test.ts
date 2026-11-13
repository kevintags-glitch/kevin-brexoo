import { describe, expect, it } from "vitest";
import { findRegion, validPostcode } from "@/config/locations";
import { SEO_CITIES, cityRegion, countrySlug, findCity } from "@/config/seo-markets";
import { TRADES } from "@/config/trades";
import { getTemplate } from "@/config/industry-templates";

describe("SEO markets", () => {
  it("targets cities in all three markets", () => {
    expect(SEO_CITIES.filter((c) => c.country === "US").length).toBeGreaterThanOrEqual(12);
    expect(SEO_CITIES.filter((c) => c.country === "AU").length).toBeGreaterThanOrEqual(8);
    expect(SEO_CITIES.filter((c) => c.country === "NZ").length).toBeGreaterThanOrEqual(5);
  });
  for (const city of SEO_CITIES) {
    it(`${city.name} has valid state, postcodes and counties`, () => {
      expect(findRegion(city.country, city.state)).toBeTruthy();
      expect(city.areas.length).toBeGreaterThanOrEqual(4);
      for (const a of city.areas) expect(validPostcode(city.country, a.postcode), `${a.name} ${a.postcode}`).toBe(true);
      if (city.country === "US") expect(city.counties?.length).toBeGreaterThan(0);
      expect(findCity(countrySlug(city.country), cityRegion(city).slug, city.slug)).toBe(city);
    });
  }
  it("every trade maps to real templates", () => {
    expect(TRADES).toHaveLength(8);
    for (const t of TRADES) for (const code of t.templates) expect(getTemplate(code), code).toBeTruthy();
  });
});
