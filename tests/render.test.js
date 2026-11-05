/**
 * Portfolio rendering tests — real Chromium via Playwright.
 * Catches layout bugs jsdom cannot see (overflow, clipping, responsive breakpoints).
 *
 * Setup (once):  npm install playwright && npx playwright install chromium
 * Run:           node tests/render.test.js
 */
const { chromium } = require("playwright");
const path = require("path");

const FILE = "file://" + path.join(__dirname, "..", "cv-classic.html");
const WIDTHS = [320, 375, 414, 540, 700, 768, 860, 940, 1024, 1120, 1180, 1280, 1440, 1920, 2560];
const BURGER_BELOW = 1180;

(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] });
  const R = []; let fails = 0;
  const t = (n, c) => { R.push((c ? "PASS" : "FAIL") + "  " + n); if (!c) fails++; };

  /* ---- responsive sweep ---- */
  for (const w of WIDTHS) {
    const page = await b.newPage({ viewport: { width: w, height: 900 } });
    const errs = [];
    page.on("pageerror", e => errs.push(e.message));
    page.on("console", m => { if (m.type() === "error" && !/net::|407|ERR_FILE_NOT_FOUND/.test(m.text())) errs.push(m.text()); });
    await page.goto(FILE, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);

    const m = await page.evaluate(() => {
      window.scrollTo(600, 0); const sx = window.scrollX; window.scrollTo(0, 0);
      const de = document.documentElement;
      const bad = [...document.querySelectorAll("body *")].filter(el => {
        if (el.closest(".marquee")) return false;           // marquee is intentionally wider, clipped by parent
        const r = el.getBoundingClientRect();
        return r.width > 0 && (r.right > de.clientWidth + 1.5 || r.left < -1.5);
      }).slice(0, 3).map(el => el.tagName + "." + (el.className || "").toString().split(" ")[0]);
      const pic = document.getElementById("ppic");
      const pr = pic && pic.getBoundingClientRect();
      return {
        sx, bad,
        navD: getComputedStyle(document.getElementById("navlinks")).display,
        burgerD: getComputedStyle(document.getElementById("menuBtn")).display,
        photoOK: !!pr && pr.width > 40 && pr.right <= de.clientWidth + 1
      };
    });

    t(`w=${w}: no sideways scrolling`, m.sx === 0);
    t(`w=${w}: nothing clipped ${m.bad.length ? JSON.stringify(m.bad) : ""}`, m.bad.length === 0);
    t(`w=${w}: portrait fits`, m.photoOK);
    const burger = w <= BURGER_BELOW;
    t(`w=${w}: ${burger ? "hamburger" : "desktop nav"} shown`,
      burger ? m.burgerD !== "none" : (m.navD === "flex" && m.burgerD === "none"));
    t(`w=${w}: no JS errors ${errs.length ? JSON.stringify(errs.slice(0,1)) : ""}`, errs.length === 0);
    await page.close();
  }

  /* ---- interactions: mobile ---- */
  let p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto(FILE, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(300);
  t("mobile: menu hidden initially", !(await p.locator("#navlinks").isVisible()));
  await p.click("#menuBtn"); await p.waitForTimeout(200);
  t("mobile: menu opens", await p.locator("#navlinks").isVisible());
  await p.locator('#navlinks a[href="#research"]').click(); await p.waitForTimeout(2000);
  t("mobile: menu closes after tap", !(await p.locator("#navlinks").isVisible()));
  t("mobile: navigates to Research (below sticky nav)",
    await p.evaluate(() => { const r = document.getElementById("research").getBoundingClientRect().top; return r >= -5 && r < 130; }));
  await p.close();

  /* ---- interactions: desktop ---- */
  p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(FILE, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(400);
  await p.locator(".credpill").click(); await p.waitForTimeout(2000);
  t("hero credential pill jumps to Research",
    await p.evaluate(() => { const r = document.getElementById("research").getBoundingClientRect().top; return r >= -5 && r < 130; }));
  await p.locator(".logo").click(); await p.waitForTimeout(2000);
  t("logo returns to top", await p.evaluate(() => window.scrollY < 50));
  await p.locator(".pbtn", { hasText: "DevOps" }).first().click(); await p.waitForTimeout(200);
  t("persona filter highlights + dims",
    (await p.locator("#skills .chip.hi").count()) > 0 && (await p.locator("#skills .chip.dim").count()) > 0);
  await p.click("#langToggle"); await p.waitForTimeout(300);
  t("language switches to EN", (await p.locator(".hero h1").innerText()).includes("Hi, I'm"));
  await p.click("#langToggle"); await p.waitForTimeout(300);
  await p.click("#themeToggle"); await p.waitForTimeout(300);
  t("light theme applies", await p.evaluate(() => document.documentElement.dataset.theme === "light"));
  await p.click("#themeToggle"); await p.waitForTimeout(300);
  await p.click("#pToggleBtn"); await p.waitForTimeout(600);
  t("BR Assist case study expands", await p.evaluate(() => document.getElementById("pDetails").getBoundingClientRect().height > 300));
  await p.close();

  await b.close();
  const failedLines = R.filter(r => r.startsWith("FAIL"));
  console.log(failedLines.length ? failedLines.join("\n") : "(no failures)");
  console.log(`\n${R.length - fails}/${R.length} passed across ${WIDTHS.length} viewports + interactions`);
  process.exit(fails ? 1 : 0);
})();
