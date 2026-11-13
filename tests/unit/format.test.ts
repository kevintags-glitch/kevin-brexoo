import { describe, expect, it } from "vitest";
import { formatMoney, formatRelative, parseMoneyToMinor, plural, slugify, utcToZonedInputs, zonedTimeToUtc } from "@/lib/format";

describe("time zones (stored UTC, shown in the business's zone)", () => {
  it("converts Sydney wall time to UTC in summer (AEDT, +11)", () => {
    expect(zonedTimeToUtc("2026-12-01", "09:30", "Australia/Sydney")).toBe("2026-11-30T22:30:00.000Z");
  });
  it("converts Sydney wall time to UTC in winter (AEST, +10)", () => {
    expect(zonedTimeToUtc("2026-07-01", "09:30", "Australia/Sydney")).toBe("2026-06-30T23:30:00.000Z");
  });
  it("handles the day daylight saving starts", () => {
    // DST starts 4 Oct 2026 at 02:00 → 03:00 in Sydney. 10:00 that day is +11.
    expect(zonedTimeToUtc("2026-10-04", "10:00", "Australia/Sydney")).toBe("2026-10-03T23:00:00.000Z");
  });
  it("round-trips through the form inputs", () => {
    const iso = zonedTimeToUtc("2026-11-20", "14:15", "Australia/Perth");
    expect(utcToZonedInputs(iso, "Australia/Perth")).toEqual({ date: "2026-11-20", time: "14:15" });
  });
});

describe("money (integer minor units)", () => {
  it("parses user input to cents", () => {
    expect(parseMoneyToMinor("45,000")).toBe(4_500_000);
    expect(parseMoneyToMinor("12.5")).toBe(1250);
    expect(parseMoneyToMinor("")).toBeNull();
  });
  it("formats with the currency symbol", () => {
    expect(formatMoney(29900, "USD")).toBe("$299");
    expect(formatMoney(null)).toBe("—");
  });
});

describe("display helpers", () => {
  it("switches relative dates to absolute after a week", () => {
    const now = new Date("2026-11-13T10:00:00Z");
    expect(formatRelative("2026-11-13T09:00:00Z", "UTC", now)).toBe("1 hour ago");
    expect(formatRelative("2026-10-01T09:00:00Z", "UTC", now)).toMatch(/1 Oct 2026/);
  });
  it("pluralises", () => {
    expect(plural(1, "task")).toBe("1 task");
    expect(plural(3, "task")).toBe("3 tasks");
  });
  it("slugifies business names for page addresses", () => {
    expect(slugify("Coastline Homes & Renovations Pty Ltd")).toBe("coastline-homes-renovations-pty-ltd");
    expect(slugify("Ünïcode Bätch")).toBe("unicode-batch");
  });
});

import { parseCsv, validateCsv } from "@/features/discovery/csv";
import { budgetBucket, freshness } from "@/features/discovery/match";

describe("discovery import", () => {
  it("parses quoted CSV fields with commas, quotes and newlines", () => {
    expect(parseCsv('a,b\n"x, y","say ""hi""\nthere"\n')).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"\nthere'],
    ]);
  });
  it("validates rows and reports line-numbered errors", () => {
    const { records, errors } = validateCsv(
      "external_id,title,category,estimated_value,contact_email,contact_permission\nA,Duplex build,Home builders,650000,pat@example.com,permitted\nB,X,plumber,,bad-email,\nA,Dup,plumber,,,\n",
    );
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ category: "home_builder", estimated_value: 65_000_000, contact_permission: "permitted" });
    expect(errors[0]).toMatch(/Line 3/);
    expect(errors[1]).toMatch(/duplicate external_id A/);
  });
  it("requires the identifying columns", () => {
    expect(validateCsv("name\nx").errors[0]).toMatch(/external_id, title/);
  });
  it("buckets stated values and labels freshness honestly", () => {
    expect(budgetBucket(null)).toBeNull();
    expect(budgetBucket(65_000_000)).toBe("$500k+");
    const now = new Date("2026-11-13T00:00:00Z").getTime();
    expect(freshness("2026-11-10", now).tone).toBe("green");
    expect(freshness("2026-06-01", now).label).toMatch(/may be stale/);
    expect(freshness(null, now).label).toBe("Observed date unknown");
  });
});
