import { describe, expect, it } from "vitest";
import { BRAND_FACTS } from "@/config/facts";
import { CURRENCIES, PLANS, priceFor } from "@/config/plans";
import { currencyForCountry, formatPrice, resolveCurrency, TAX_NOTE } from "@/lib/currency";

describe("local currency pricing", () => {
  it("maps each launch country to its own currency, and everywhere else to USD", () => {
    expect(currencyForCountry("US")).toBe("USD");
    expect(currencyForCountry("au")).toBe("AUD");
    expect(currencyForCountry("NZ")).toBe("NZD");
    expect(currencyForCountry("GB")).toBe("USD");
    expect(currencyForCountry(null)).toBe("USD");
  });

  it("prefers an explicit choice, then the saved cookie, then the visitor's country", () => {
    expect(resolveCurrency({ query: "nzd", cookie: "AUD", country: "US" })).toBe("NZD");
    expect(resolveCurrency({ query: ["AUD"], country: "US" })).toBe("AUD");
    expect(resolveCurrency({ query: "EUR", cookie: "AUD", country: "US" })).toBe("AUD");
    expect(resolveCurrency({ cookie: "junk", country: "NZ" })).toBe("NZD");
    expect(resolveCurrency({})).toBe("USD");
  });

  it("has a price for every plan in every currency, and USD matches the plan's base price", () => {
    for (const p of PLANS) {
      for (const c of CURRENCIES) {
        const price = priceFor(p, c);
        expect(price.monthly).toBeGreaterThan(0);
        expect(price.setup).toBeGreaterThan(0);
      }
      expect(priceFor(p, "USD")).toEqual({ monthly: p.monthlyPriceMinor, setup: p.setupFeeMinor });
      // Local prices are higher in AUD and NZD, never a straight relabel of the USD number.
      expect(priceFor(p, "AUD").monthly).toBeGreaterThan(p.monthlyPriceMinor);
      expect(priceFor(p, "NZD").monthly).toBeGreaterThan(priceFor(p, "AUD").monthly);
    }
  });

  it("labels every currency unambiguously", () => {
    expect(formatPrice(29900, "USD")).toBe("US$299");
    expect(formatPrice(44900, "AUD")).toBe("A$449");
    expect(formatPrice(104900, "AUD")).toBe("A$1,049");
    expect(formatPrice(49900, "NZD")).toBe("NZ$499");
    expect(TAX_NOTE.AUD).toMatch(/GST/);
    expect(TAX_NOTE.USD).toMatch(/tax/);
  });
});

describe("website facts", () => {
  it("are computed from the product and never zero", () => {
    expect(BRAND_FACTS).toEqual({ markets: 3, serviceTemplates: 15, pipelineStages: 9, recordsWithSourcePct: 100 });
  });
});
