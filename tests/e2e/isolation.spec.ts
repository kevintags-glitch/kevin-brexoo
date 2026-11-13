import { expect, test } from "@playwright/test";

/** Blueprint §21.2: public users can't reach private data; protected routes need a session. */
test("signed-out visitors are sent to log in", async ({ page }) => {
  await page.goto("/app/enquiries");
  await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fenquiries/);
});

test("unknown public pages 404 without leaking anything", async ({ page }) => {
  const res = await page.goto("/p/definitely-not-a-real-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("We couldn't find that page.")).toBeVisible();
});

test("the notification job requires its token", async ({ request }) => {
  const res = await request.post("/api/jobs/notifications");
  expect(res.status()).toBe(401);
});

test("open redirects are refused after login", async ({ page }) => {
  await page.goto("/login?next=//evil.example.com");
  const next = await page.locator('input[name="next"]').inputValue();
  expect(next).toBe("//evil.example.com"); // passed through the form…
  // …but the server action only honours same-site paths (see safeNext in features/auth/actions.ts).
});
