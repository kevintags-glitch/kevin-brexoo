import { expect, test } from "@playwright/test";

/**
 * Project Data Collector, end to end: the collector API ingests a project, Brexoo hands a private
 * copy to the matching business, and an inbound lead from Make.com lands in Leads.
 */
const TOKEN = process.env.COLLECTOR_TOKEN ?? "local-collector-token";
const stamp = Date.now().toString(36);
const title = `New dwelling e2e ${stamp}`;

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("demo+builders@example.com");
  await page.getByLabel("Password", { exact: true }).fill("brexoo-demo");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/app/);
}

test.describe.configure({ mode: "serial" });

test("the collector API refuses requests without the collector token", async ({ request }) => {
  expect((await request.get("/api/collector/sources")).status()).toBe(401);
  expect((await request.post("/api/collector/ingest", { headers: { Authorization: "Bearer wrong" }, data: { source: "nsw-planning-da", records: [] } })).status()).toBe(401);
});

test("an ingested planning application reaches the matching builder, labelled with its source", async ({ page, request }) => {
  const sources = await request.get("/api/collector/sources", { headers: { Authorization: `Bearer ${TOKEN}` } });
  expect(sources.status()).toBe(200);
  expect((await sources.json()).sources.map((s: { key: string }) => s.key)).toContain("nsw-planning-da");

  const res = await request.post("/api/collector/ingest", {
    headers: { Authorization: `Bearer ${TOKEN}` },
    data: {
      source: "nsw-planning-da",
      records: [{ external_id: `E2E-${stamp}`, title, category_code: "home_builder", country: "AU", region: "NSW", city: "Newcastle", suburb: "Merewether",
                  postcode: "2291", stage: "Lodged", estimated_value_minor: 70_000_000, currency: "AUD", observed_at: "2026-11-12" }],
      run: { started_at: "2026-11-14T00:00:00+00:00", fetched: 1 },
    },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.inserted).toBe(1);
  expect(body.distributed).toBeGreaterThanOrEqual(1);

  await login(page);
  await page.goto(`/app/discover?status=all&q=${encodeURIComponent(title)}`);
  const card = page.getByRole("listitem").filter({ hasText: title });
  await expect(card).toBeVisible();
  await expect(card.getByText(/Brexoo · NSW Planning Portal applications/)).toBeVisible();
  await expect(card.getByText("Contact not permitted by source")).toBeVisible();

  await page.getByText("Brexoo sources", { exact: true }).click();
  await expect(page.getByRole("switch", { name: /NSW Planning Portal applications: on/ })).toBeChecked();
  await expect(page.getByRole("switch", { name: /NZ Government Electronic Tenders \(GETS\): off/ })).toBeDisabled();
});

test("a lead posted to an inbound link appears in Leads", async ({ page, request }) => {
  await login(page);
  await page.goto("/app/settings/integrations");
  await page.getByLabel("Leads come from").selectOption("Facebook Lead Ads");
  await page.getByRole("button", { name: "Create inbound link" }).click();
  const url = (await page.locator("code").filter({ hasText: "/api/inbound/enquiries/" }).first().innerText()).trim();
  const path = new URL(url).pathname;

  const name = `Inbound Lead ${stamp}`;
  const res = await request.post(path, {
    data: { name, email: `inbound-${stamp}@example.com`, message: "Granny flat at the back of our block", suburb: "Merewether", postcode: "2291", consent: true, channel: "Facebook Lead Ads" },
  });
  expect(res.status()).toBe(201);
  expect((await res.json()).reference).toMatch(/^[0-9A-F]{8}$/);
  expect((await request.post(path, { data: { name, email: "x@example.com", message: "Deck" } })).status()).toBe(400);

  await page.goto(`/app/enquiries?q=${encodeURIComponent(name)}`);
  await expect(page.getByText(name).first()).toBeVisible();

  // Revoking the link stops it working.
  await page.goto("/app/settings/integrations");
  await page.getByRole("listitem").filter({ hasText: "Facebook Lead Ads" }).filter({ hasText: "last lead" }).first().getByRole("button", { name: "Revoke" }).click();
  await expect.poll(async () => (await request.post(path, { data: { name, email: `again-${stamp}@example.com`, message: "Another", consent: true } })).status()).toBe(401);
});
