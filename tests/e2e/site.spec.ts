import { expect, test } from "@playwright/test";

/**
 * Every link on the public website works: crawl from the home page, follow each internal link,
 * and check that the page loads and any #anchor exists on it.
 */
test("every website link resolves, including in-page anchors", async ({ page, request }) => {
  test.setTimeout(300_000);
  const seen = new Set<string>();
  const queue = ["/"];
  const broken: string[] = [];
  while (queue.length) {
    const path = queue.shift()!;
    if (seen.has(path)) continue;
    seen.add(path);
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
    for (const raw of hrefs) {
      if (!raw || raw.startsWith("mailto:") || raw.startsWith("tel:") || /^https?:\/\//.test(raw)) continue;
      const [rawPath, hash] = raw.split("#");
      const target = rawPath || path;
      const pathOnly = target.split("?")[0]!;
      // Only crawl the marketing site; app routes redirect to log in and are covered elsewhere.
      if (pathOnly.startsWith("/app") || pathOnly.startsWith("/p/")) continue;
      if (hash) {
        const res = await request.get(target);
        const html = await res.text();
        if (!res.ok() || !html.includes(`id="${hash}"`)) broken.push(`${path} → ${raw} (missing #${hash})`);
      }
      if (!seen.has(pathOnly) && !queue.includes(pathOnly)) {
        const res = await request.get(pathOnly);
        if (!res.ok()) broken.push(`${path} → ${raw} (${res.status()})`);
        else if (!/\.(png|jpe?g|svg|mp4|webm|ico)$/.test(pathOnly)) queue.push(pathOnly);
      }
    }
  }
  expect(broken, broken.join("\n")).toEqual([]);
  expect(seen.size).toBeGreaterThan(12);
});

test("each website page has its own title and headline", async ({ page }) => {
  const titles = new Map<string, string>();
  for (const path of ["/", "/how-it-works", "/industries", "/builders", "/trades", "/pricing", "/ai", "/managed-services", "/resources", "/demo"]) {
    await page.goto(path);
    const t = await page.title();
    expect(titles.has(t), `${path} reuses the title "${t}"`).toBe(false);
    titles.set(t, path);
    await expect(page.locator("h1")).toHaveCount(1);
  }
});

test("the home page plays the logo film", async ({ page }) => {
  await page.goto("/");
  const video = page.locator("video");
  await expect(video).toHaveAttribute("poster", /brexoo-logo-intro-poster/);
  const duration = await video.evaluate(async (v: HTMLVideoElement) => {
    if (v.readyState < 1) await new Promise((r) => v.addEventListener("loadedmetadata", r, { once: true }));
    return v.duration;
  });
  expect(duration).toBeGreaterThanOrEqual(10);
  expect(duration).toBeLessThanOrEqual(15);
});

test("Brex AI support chat answers from approved content and links onward", async ({ page }) => {
  await page.goto("/pricing");
  await page.getByRole("button", { name: "Chat with Brex AI" }).click();
  const chat = page.getByRole("dialog", { name: "Brex AI support chat" });
  await expect(chat).toBeVisible();
  await chat.getByLabel("Your question").fill("Do you work in New Zealand?");
  await chat.getByRole("button", { name: "Send" }).click();
  await expect(chat.getByText(/United States, Australia and New Zealand/)).toBeVisible();
  await chat.getByLabel("Your question").fill("What's the capital of France?");
  await chat.getByRole("button", { name: "Send" }).click();
  await expect(chat.getByText(/rather not guess/)).toBeVisible();
  await chat.getByRole("link", { name: "Talk to our team" }).first().click();
  await expect(page).toHaveURL(/\/demo$/);
  await page.keyboard.press("Escape");
});
