import { describe, expect, it } from "vitest";
import { getTemplate } from "@/config/industry-templates";
import { findRegion, validPostcode } from "@/config/locations";
import { SAMPLE_BUSINESSES, sampleEmail, sampleForServices } from "@/config/samples";

describe("shared sample businesses", () => {
  it("covers all eight launch industries across the three markets", () => {
    expect(SAMPLE_BUSINESSES.map((b) => b.key).sort()).toEqual(["builders", "cleaning", "electricians", "hvac", "landscaping", "plumbers", "renovation", "roofing"]);
    expect(new Set(SAMPLE_BUSINESSES.map((b) => b.country))).toEqual(new Set(["US", "AU", "NZ"]));
  });

  for (const b of SAMPLE_BUSINESSES) {
    it(`${b.name} is internally consistent`, () => {
      expect(findRegion(b.country, b.state), "state").toBeTruthy();
      for (const code of b.services) expect(getTemplate(code), code).toBeTruthy();
      for (const a of b.areas) expect(validPostcode(b.country, a.postcode), a.postcode).toBe(true);
      for (const l of b.leads) {
        expect(b.services, `${l.ref} service`).toContain(l.service);
        expect(validPostcode(b.country, l.postcode), `${l.ref} postcode`).toBe(true);
        if (l.stage === "lost") expect(l.lossReason, `${l.ref} loss reason`).toBeTruthy();
      }
      expect(b.leads.some((l) => l.appointment), "has a booked visit").toBe(true);
      expect(b.leads.some((l) => l.stage === "won"), "has a won client").toBe(true);
      expect(b.leads.some((l) => l.stage === "new"), "has a new lead").toBe(true);
      expect(new Set(b.leads.map((l) => l.ref)).size).toBe(b.leads.length);
    });
  }

  it("uses example.com addresses only", () => {
    expect(sampleEmail("Sarah Mitchell")).toBe("sarah.mitchell@example.com");
    expect(sampleEmail("James O'Connor")).toBe("james.o.connor@example.com");
  });

  it("picks the sample that matches a business's services", () => {
    expect(sampleForServices(["plumber"]).key).toBe("plumbers");
    expect(sampleForServices(["lawn_care"]).key).toBe("landscaping");
    expect(sampleForServices(["painting"]).key).toBe("roofing");
    expect(sampleForServices(["pest_control"]).key).toBe("builders");
  });
});
