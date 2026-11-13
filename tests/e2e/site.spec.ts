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

test("the first screen is wordless: the logo mark and a live CRM demo", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const hero = page.locator("section").first();
  await expect(hero.locator("h1")).toHaveClass(/sr-only/);
  await expect(hero.locator("h1")).toHaveText(/Brexoo/);
  // Visible text in the hero comes only from the decorative product demo (aria-hidden).
  await expect(hero.locator('[aria-hidden="true"]').getByText("Sarah Mitchell").first()).toBeVisible({ timeout: 8000 });
  const visible = await hero.evaluate((el) => {
    let text = "";
    const walk = (n: Node) => {
      if (n.nodeType === 3) {
        const p = n.parentElement!;
        if (!p.closest(".sr-only") && !p.closest('[aria-hidden="true"]') && getComputedStyle(p).visibility !== "hidden") text += n.textContent;
      }
      n.childNodes.forEach(walk);
    };
    walk(el);
    return text.trim();
  });
  expect(visible).toBe("");
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
