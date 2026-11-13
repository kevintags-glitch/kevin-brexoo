import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BRAND_ICON_LABEL, BRAND_ICON_NAMES } from "@/components/marketing/brand-icons";

describe("brand icons", () => {
  it("has at least 50 logo-style icons, each labelled", () => {
    expect(BRAND_ICON_NAMES.length).toBeGreaterThanOrEqual(50);
    for (const n of BRAND_ICON_NAMES) expect(BRAND_ICON_LABEL[n], n).toBeTruthy();
    expect(new Set(Object.values(BRAND_ICON_LABEL)).size).toBe(BRAND_ICON_NAMES.length);
  });
});

describe("typography system", () => {
  const css = readFileSync("app/globals.css", "utf8");
  it("uses Inter only", () => {
    expect(css).toMatch(/--font-sans: "Inter Variable"/);
    expect(css).toMatch(/--font-display: "Inter Variable"/);
    expect(css).not.toMatch(/Bricolage|Hanken|Instrument Serif/);
  });
  it("defines the official scale", () => {
    const rule = (name: string) => css.slice(css.indexOf(`@utility ${name} {`), css.indexOf("}", css.indexOf(`@utility ${name} {`)) + 1);
    expect(rule("type-hero")).toMatch(/font-size: 38px[\s\S]*font-weight: 400/);
    expect(css).toMatch(/@utility type-hero[\s\S]*?font-size: 56px/);
    expect(rule("type-section")).toMatch(/font-weight: 400/);
    expect(css).toMatch(/@utility type-section[\s\S]*?font-size: 36px/);
    expect(rule("type-subhead")).toMatch(/font-size: 24px[\s\S]*font-weight: 400/);
    expect(rule("type-card")).toMatch(/font-size: 18px[\s\S]*font-weight: 500/);
    expect(rule("type-body")).toMatch(/font-size: 15px[\s\S]*font-weight: 400/);
    expect(rule("type-nav")).toMatch(/font-size: 14px[\s\S]*font-weight: 500/);
    expect(rule("type-product")).toMatch(/font-size: 14px[\s\S]*font-weight: 400/);
    expect(rule("type-sidebar")).toMatch(/font-size: 13px[\s\S]*font-weight: 400/);
    expect(rule("type-button")).toMatch(/font-size: 14px[\s\S]*font-weight: 500/);
    expect(rule("type-label")).toMatch(/font-size: 12px[\s\S]*font-weight: 500/);
  });
});
