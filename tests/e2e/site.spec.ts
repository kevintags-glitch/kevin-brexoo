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

test("the first screen is the stairs film, followed by the CRM presentation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const hero = page.locator("section").first();
  await expect(hero.locator("h1")).toHaveClass(/sr-only/);
  await expect(hero.locator("h1")).toHaveText(/Brexoo/);
  // The film carries the words; the page adds none of its own on the first screen.
  const video = hero.locator("video");
  await expect(video).toBeVisible();
  await expect(video).toHaveAttribute("poster", "/media/brexoo-stairs-poster.jpg");
  expect(await video.evaluate((v: HTMLVideoElement) => v.muted && v.loop && v.playsInline && v.autoplay)).toBe(true);
  // It plays by itself, with no click, and fills the first screen.
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0.2), { timeout: 10_000 }).toBe(true);
  const box = (await hero.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(900 - 1);
  // The first screen is the film alone: the menu bar is out of view until the visitor scrolls.
  const header = page.locator("header");
  await expect(header).toHaveAttribute("data-hidden", "true");
  expect((await header.boundingBox())!.y + (await header.boundingBox())!.height).toBeLessThanOrEqual(1);
  for (const src of ["/media/brexoo-stairs.mp4", "/media/brexoo-stairs.webm", "/media/brexoo-stairs-poster.jpg", "/media/brexoo-stairs-tall.mp4", "/media/brexoo-stairs-tall.webm", "/media/brexoo-stairs-tall-poster.jpg"]) {
    expect((await page.request.get(src)).status()).toBe(200);
  }
  await expect(hero.getByRole("button", { name: /animation/ })).toBeVisible();

  // Second screen: real workspace screens in a tabbed presentation.
  const ws = page.locator("#workspace");
  await ws.scrollIntoViewIfNeeded();
  await expect(header).not.toHaveAttribute("data-hidden", "true");
  await expect(header.getByRole("link", { name: "Brexoo home" })).toBeInViewport();
  const tabs = ws.getByRole("tab");
  await expect(tabs).toHaveCount(8);
  await ws.getByRole("tab", { name: "Pipeline" }).click();
  await expect(ws.getByRole("tab", { name: "Pipeline" })).toHaveAttribute("aria-selected", "true");
  await expect(ws.getByRole("img", { name: /Pipeline screen/ })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(ws.getByRole("tab", { name: "Calendar" })).toHaveAttribute("aria-selected", "true");
  for (const name of ["overview", "enquiries", "lead", "pipeline", "appointments", "discover", "clients", "reports"]) {
    expect((await page.request.get(`/media/screens/${name}.webp`)).status()).toBe(200);
  }
});

test("the home page never mentions AI", async ({ page }) => {
  await page.goto("/");
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(/\bAI\b/);
});

test("Inter is the only typeface and the type scale is applied", async ({ page }) => {
  for (const [w, h1] of [[1440, "56px"], [390, "38px"]] as const) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto("/pricing");
    const css = await page.locator("h1").evaluate((el) => ({ size: getComputedStyle(el).fontSize, weight: getComputedStyle(el).fontWeight, family: getComputedStyle(el).fontFamily }));
    expect(css.size).toBe(h1);
    expect(css.weight).toBe("400");
    expect(css.family).toMatch(/^"Inter Variable"/);
  }
  const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(body).toMatch(/^"Inter Variable"/);
});

test("support chat answers from approved content and links onward", async ({ page }) => {
  await page.goto("/pricing");
  await page.getByRole("button", { name: "Chat with Brexoo" }).click();
  const chat = page.getByRole("dialog", { name: "Brexoo help chat" });
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
