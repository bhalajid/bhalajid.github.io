/**
 * Portfolio DOM + content tests (jsdom — no browser needed)
 * Run:  node tests/dom.test.js
 */
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(FILE, "utf8");
const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", e => { if (!/Could not load|canvas|not implemented/i.test(e.message)) errors.push(e.message); });

const dom = new JSDOM(html, {
  runScripts: "dangerously", url: "https://bhalajid.github.io/", pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = () => ({
      clearRect(){},beginPath(){},arc(){},fill(){},moveTo(){},lineTo(){},stroke(){},
      set fillStyle(v){}, set strokeStyle(v){}
    });
    w.requestAnimationFrame = fn => 0;
    w.IntersectionObserver = class { constructor(){} observe(){} disconnect(){} };
    w.matchMedia = w.matchMedia || (q => ({ matches:false, addListener(){}, removeListener(){} }));
    w.scrollTo = () => {};
    w.addEventListener("error", e => errors.push("pageError: " + e.message));
  }
});

const w = dom.window, d = w.document;
const R = [];
const t = (name, cond) => { R.push((cond ? "PASS" : "FAIL") + "  " + name); if (!cond) errors.push("FAILED: " + name); };
const PERSONAS = ["devops","sre","cloud","ai","platform","euc"];

/* ---- 1. Title safety (German §132a — must never claim a doctorate) ---- */
const text = d.body.textContent;
t("SAFETY: no 'PhD' anywhere", !/\bPhD\b/i.test(text));
t("SAFETY: no 'Dr.' title", !/\bDr\.\s*Balaji/i.test(text));
t("SAFETY: no 'Doktortitel'/'Promotion'", !/Doktortitel|Doktorgrad|\bPromotion\b/i.test(text));
t("SAFETY: exact award wording used", text.includes("Doctoral Graduateship / Fellow Membership"));
t("SAFETY: disclaimer present", /kein deutscher Hochschulgrad/.test(text));

/* ---- 2. Structure ---- */
t("nav: 9 links", d.querySelectorAll("#navlinks a").length === 9);
t("nav: no duplicate labels", (() => { const l=[...d.querySelectorAll("#navlinks a")].map(a=>a.textContent.trim()); return new Set(l).size===l.length; })());
t("nav: every anchor resolves", [...d.querySelectorAll("#navlinks a")].every(a => d.getElementById(a.getAttribute("href").slice(1))));
t("nav: every section reachable", [...d.querySelectorAll("section[id]")].every(s => [...d.querySelectorAll("#navlinks a")].some(a => a.getAttribute("href") === "#" + s.id)));
t("7 achievement boxes", d.querySelectorAll(".bento").length === 7);
t("3 case studies", d.querySelectorAll(".case").length === 3);
t("2 projects (Quenora + BR Assist)", d.querySelectorAll(".projectcard").length === 2);
t("7 skill cards", d.querySelectorAll("#skills .skillcard").length === 7);
t("5 experience entries", d.querySelectorAll(".job").length === 5);
t("8 certifications", d.querySelectorAll(".cert").length === 8);
t("research section present", !!d.getElementById("research"));
t("about: languages + ask-me", d.querySelectorAll("#aboutme .skillcard").length === 2);
t("hero facts strip: 5 items", d.querySelectorAll(".herofacts>span").length === 5);

/* ---- 3. Bilingual completeness ---- */
const empty = () => [...d.querySelectorAll("[data-i18n]")].filter(e => !e.textContent.trim()).map(e => e.getAttribute("data-i18n"));
t("DE: no empty strings", empty().length === 0);
w.toggleLang();
t("EN: no empty strings", empty().length === 0);
w.toggleLang();
const T = w.eval("T");
const used = new Set([...d.querySelectorAll("[data-i18n]")].map(e => e.getAttribute("data-i18n")));
t("no missing translation keys", [...used].every(k => k in T));
t("no orphan translation keys", Object.keys(T).filter(k => !used.has(k) && !["p_more","p_less"].includes(k)).length === 0);
t("all keys are DE/EN pairs", Object.keys(T).every(k => Array.isArray(T[k]) && T[k].length === 2 && T[k][0] && T[k][1]));

/* ---- 4. Skills + persona filter ---- */
const SKILLS = w.eval("SKILLS");
t("every skill has valid tags", SKILLS.every(s => Array.isArray(s.tags) && s.tags.length && s.tags.every(x => PERSONAS.includes(x))));
t("every skill category exists", SKILLS.every(s => s.cat in w.eval("CATS")));
const btns = [...d.querySelectorAll(".pbtn")];
let ok = true;
for (const p of PERSONAS) {
  btns[Object.keys(w.eval("PERSONAS")).indexOf(p)].click();
  const hi = d.querySelectorAll("#skills .chip.hi").length;
  const dim = d.querySelectorAll("#skills .chip.dim").length;
  const all = d.querySelectorAll("#skills .chip").length;
  if (!(hi > 0 && hi + dim === all)) ok = false;
}
t("persona filter works for all 6 roles", ok);
btns[0].click();
t("'All' shows neutral chips", d.querySelectorAll("#skills .chip.hi, #skills .chip.dim").length === 0);

/* ---- 5. Interactive ---- */
w.toggleTheme(); t("theme toggles", ["light","dark"].includes(d.documentElement.dataset.theme)); w.toggleTheme();
w.toggleMenu(); t("mobile menu opens", d.getElementById("navlinks").classList.contains("open"));
d.querySelector("#navlinks a").click(); t("menu closes after link", !d.getElementById("navlinks").classList.contains("open"));
w.toggleProject(); t("BR Assist expands", d.getElementById("pDetails").classList.contains("open")); w.toggleProject();
t("photo fallback defined before load", typeof w.picErr === "function");
t("logo is a home link", d.querySelector("a.logo") && d.querySelector("a.logo").getAttribute("href") === "#");

/* ---- 6. Links + meta ---- */
const hrefs = [...d.querySelectorAll("a[href]")].map(a => a.getAttribute("href"));
t("email link correct", hrefs.includes("mailto:bhalaji.d@hotmail.com"));
t("phone link correct", hrefs.includes("tel:+4915256433329"));
t("linkedin link present", hrefs.some(h => h.includes("linkedin.com/in/bhalajid")));
t("quenora link present", hrefs.some(h => h.includes("quenora.ai")));
t("hero: 2 badges (availability + fellowship)", d.querySelectorAll(".badgerow > *").length===2);
t("hero: no founder pill (kept out of hero by choice)", !d.querySelector(".qpill"));
t("Quenora lives in Projects, not hero", !!d.querySelector("#projects") && d.querySelector("#projects").textContent.includes("Quenora"));
t("external links use noopener", [...d.querySelectorAll('a[target="_blank"]')].every(a => (a.getAttribute("rel")||"").includes("noopener")));
t("no empty/# links besides logo", hrefs.filter(h => h === "#").length <= 1);
t("favicon present", !!d.querySelector('link[rel="icon"]'));
t("OG tags present", !!d.querySelector('meta[property="og:title"]') && !!d.querySelector('meta[property="og:image"]'));
t("all images have alt", [...d.querySelectorAll("img")].every(i => i.getAttribute("alt")));

/* ---- report ---- */
console.log(R.join("\n"));
const failed = R.filter(r => r.startsWith("FAIL")).length;
console.log(`\n${R.length - failed}/${R.length} passed`);
if (errors.length) console.log("errors:", errors);
process.exit(failed || errors.length ? 1 : 0);
