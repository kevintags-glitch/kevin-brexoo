import { expect, test, type Page } from "@playwright/test";

/**
 * The blueprint's "Build this first" journey (§ Final recommendation):
 * sign up → configure business and services → approve landing page → receive enquiry →
 * manage CRM record → assign follow-up → book appointment → record outcome.
 */

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const stamp = Date.now().toString(36);
const email = `owner-${stamp}@example.com`;
const password = "correct-horse-battery";
const business = `Coastline Homes ${stamp}`;
const slug = `coastline-${stamp}`;

async function confirmationLink(to: string) {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`);
    const list = (await res.json()) as { messages?: { ID: string }[] };
    const id = list.messages?.[0]?.ID;
    if (id) {
      const msg = (await (await fetch(`${MAILPIT}/api/v1/message/${id}`)).json()) as { HTML?: string; Text?: string };
      const body = (msg.HTML ?? "") + (msg.Text ?? "");
      const m = body.match(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify[^\s"'<>]+/);
      if (m) return m[0].replaceAll("&amp;", "&");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("No confirmation email arrived");
}

async function saveStep(page: Page) {
  await page.getByRole("button", { name: "Save and continue" }).click();
}

test.describe.serial("builder journey", () => {
  let page: Page;
  let reference = "";

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test("sign up and verify email", async () => {
    await page.goto("/signup");
    await page.getByLabel("Your name").fill("Jordan Avery");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

    await page.goto(await confirmationLink(email));
    await expect(page).toHaveURL(/\/app\/setup/);
  });

  test("create the organisation", async () => {
    await page.getByLabel("Business name").fill(business);
    await page.getByLabel("Page address").fill(slug);
    await page.getByLabel("Time zone").selectOption("Australia/Sydney");
    await page.getByRole("button", { name: "Create organisation" }).click();
    await expect(page).toHaveURL(/\/app\/onboarding/);
    await expect(page.getByRole("heading", { name: "Your business" })).toBeVisible();
  });

  test("complete onboarding and get approved", async () => {
    // A submission with essentials missing is sent back, with the reason.
    await page.goto("/app/onboarding?step=review");
    await page.getByRole("button", { name: "Submit for review" }).click();
    await expect(page.getByText("Needs changes", { exact: true }).first()).toBeVisible();

    await page.goto("/app/onboarding?step=business");
    await page.getByLabel("Phone").fill("0400 123 456");
    await page.getByLabel("Contact person").fill("Jordan Avery");
    await saveStep(page);

    await expect(page.getByRole("heading", { name: "Services and coverage" })).toBeVisible();
    await page.getByText("Home builders", { exact: true }).click();
    await page.getByText("Renovation contractors", { exact: true }).click();
    await page.getByLabel("Area 1", { exact: true }).fill("Newcastle NSW");
    await page.getByLabel("Postcode for area 1").fill("2300");
    await saveStep(page);

    await expect(page.getByRole("heading", { name: "Ideal work" })).toBeVisible();
    await page.getByLabel("Minimum job size").selectOption("$50k–$150k");
    await saveStep(page);

    await expect(page.getByRole("heading", { name: "Qualification questions" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Question" }).first()).toHaveValue("Do you own the land?");
    await saveStep(page);

    await expect(page.getByRole("heading", { name: "Brand" })).toBeVisible();
    await page.getByLabel("Company description").fill("Family-run builder delivering custom homes and renovations across Newcastle and Lake Macquarie since 2009.");
    await saveStep(page);

    await expect(page.getByRole("heading", { name: "Operations" })).toBeVisible();
    await page.getByLabel("Reply within (business hours)").fill("4");
    await saveStep(page);

    await expect(page.getByRole("heading", { name: "Review and submit" })).toBeVisible();
    await page.getByRole("button", { name: "Submit for review" }).click();
    await expect(page.getByText("Your setup is approved.")).toBeVisible();
  });

  test("draft, approve and publish the landing page", async () => {
    await page.goto("/app/landing-pages");
    await page.getByRole("button", { name: "Create my page" }).click();
    await expect(page).toHaveURL(/\/app\/landing-pages\/[0-9a-f-]+/);

    // Publishing needs approval first: only Submit is offered on a draft.
    await expect(page.getByRole("button", { name: "Publish" })).toHaveCount(0);
    await page.getByLabel("Headline").fill("New homes and renovations across Newcastle");
    await page.getByRole("button", { name: "Submit for approval" }).click();
    await expect(page.getByText("Awaiting approval")).toBeVisible();
    await page.getByRole("button", { name: "Approve version" }).click();
    await expect(page.getByText("Approved", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("Live", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("v1", { exact: true })).toBeVisible();

    await page.goto("/app/landing-pages");
    await expect(page.getByText("Live", { exact: true })).toBeVisible();
  });

  test("a visitor sends an enquiry from the public page", async ({ browser }) => {
    const visitor = await (await browser.newContext()).newPage();
    await visitor.goto(`/p/${slug}`);
    await expect(visitor.getByRole("heading", { level: 1 })).toHaveText("New homes and renovations across Newcastle");
    await visitor.waitForTimeout(2600); // real people take a moment; instant submits are treated as bots

    const form = visitor.locator("#enquire");
    await form.getByText("Home builders", { exact: true }).click();
    await form.getByLabel("Describe the project").fill("Double-storey new build on our block, four bedrooms.");
    await form.getByRole("button", { name: "Continue" }).click();

    // Only questions for the chosen service, three at a time.
    await expect(form.getByText("What are you renovating?")).toHaveCount(0);
    await form.getByRole("button", { name: "Continue" }).click();
    await expect(form.getByText("Choose an answer, or “Not sure”")).toBeVisible(); // land ownership is required
    await form.getByRole("group", { name: "Do you own the land?" }).getByText("Yes", { exact: true }).click();
    await form.getByRole("button", { name: "Continue" }).click();
    await expect(form.getByRole("heading", { name: "A couple more" })).toBeVisible();
    await form.getByRole("group", { name: /When would you like to start/ }).getByText("1–3 months").click();
    await form.getByRole("button", { name: "Continue" }).click();

    await form.getByLabel("Suburb or address").fill("Merewether, Newcastle NSW");
    await form.getByLabel("Postcode").fill("2291");
    await form.getByRole("button", { name: "Continue" }).click();

    await form.getByLabel("Your name").fill("Sarah Mitchell");
    await form.getByRole("textbox", { name: "Email" }).fill(`sarah-${stamp}@example.com`);
    await form.getByRole("checkbox").check();
    await form.getByRole("button", { name: "Request a quote" }).click();

    await expect(visitor.getByText("Thanks, your enquiry is in.")).toBeVisible();
    reference = (await visitor.locator("strong.tabular").textContent())!.trim();
    expect(reference).toMatch(/^[0-9A-F]{8}$/);
    await visitor.close();
  });

  test("the enquiry is managed through to a won outcome", async () => {
    await page.goto("/app/enquiries");
    await expect(page.getByText("Sarah Mitchell")).toBeVisible();
    await page.getByText("Sarah Mitchell").click();
    await expect(page.getByRole("heading", { name: "Sarah Mitchell" })).toBeVisible();
    await expect(page.getByText(`Reference ${reference}`)).toBeVisible();

    // Explainable fit: service and location match, missing items listed.
    await expect(page.getByText("Strong fit")).toBeVisible();
    await expect(page.getByText("Inside Newcastle NSW")).toBeVisible();

    // Follow-up task was created automatically.
    await expect(page.getByText("Respond to Sarah Mitchell's enquiry", { exact: true })).toBeVisible();

    // Xoo AI summary is grounded in the record.
    await page.getByRole("button", { name: "Summarise" }).click();
    await expect(page.getByText(/In their words: “Double-storey new build/)).toBeVisible();
    await page.getByRole("button", { name: "Draft follow-up" }).click();
    await expect(page.getByText(/Hi Sarah,/)).toBeVisible();

    // Log a call, qualify, book a site visit, close as won.
    await page.getByRole("textbox", { name: "Note", exact: true }).fill("Discussed block access and timing.");
    await page.getByRole("combobox", { name: "Log as", exact: true }).selectOption("connected");
    await page.getByRole("button", { name: "Log", exact: true }).click();
    await expect(page.getByText("Spoke with the customer — Discussed block access and timing.").first()).toBeVisible();

    await page.getByRole("button", { name: "Qualify", exact: true }).click();
    await expect(page.getByText("Saved to the record.")).toBeVisible();

    await page.getByRole("button", { name: "Book appointment", exact: true }).click();
    const tomorrow = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
    await page.getByLabel("Type", { exact: true }).selectOption("site_visit");
    await page.getByLabel("Date", { exact: true }).fill(tomorrow);
    await page.getByLabel("Time", { exact: true }).fill("10:30");
    await page.getByRole("button", { name: "Book", exact: true }).click();
    await expect(page.getByText(/Site visit · /).first()).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Stage", exact: true })).toHaveValue("appointment_booked");

    await page.getByLabel("Value", { exact: true }).fill("612000");
    await page.getByLabel("Value", { exact: true }).press("Enter");
    await page.getByRole("combobox", { name: "Stage", exact: true }).selectOption("won");
    await expect(page.getByRole("combobox", { name: "Stage", exact: true })).toHaveValue("won");

    // Full activity history
    const timeline = page.locator("ol").filter({ hasText: "received from the landing page" });
    await expect(timeline.getByText(/Enquiry .* received from the landing page/)).toBeVisible();
    await expect(timeline.getByText("Qualified", { exact: true })).toBeVisible();
    await expect(timeline.getByText(/Site visit booked for/)).toBeVisible();
    await expect(timeline.getByText("Moved from Estimate / proposal to Won").or(timeline.getByText("Moved from Appointment booked to Won"))).toBeVisible();
  });

  test("reports and audit reflect the outcome", async () => {
    await page.goto("/app/reports");
    await expect(page.getByText("100%").first()).toBeVisible();
    // Owners can export the enquiry list; the export is written to the audit log.
    const csv = await page.request.get("/app/enquiries/export");
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    expect(await csv.text()).toContain(reference);

    await page.goto("/app/settings/audit");
    await expect(page.getByText("exported enquiries")).toBeVisible();
    await expect(page.getByText("published a page")).toBeVisible();
    await expect(page.getByText("approved a page version")).toBeVisible();
  });
});
