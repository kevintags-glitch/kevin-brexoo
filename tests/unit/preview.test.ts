import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createAnonClient: () => ({ rpc: () => Promise.reject(new Error("no database in preview")) }) }));
vi.mock("@/lib/fingerprint", () => ({ visitorFingerprint: async () => "test" }));

describe("website-only preview", () => {
  it("demo requests explain the preview instead of failing when no database is connected", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    const { requestDemo } = await import("@/features/marketing/actions");
    const form = new FormData();
    form.set("name", "Sam");
    form.set("email", "sam@example.com");
    form.set("consent", "on");
    const res = await requestDemo({}, form);
    expect(res.error).toMatch(/preview/);
  });
});
