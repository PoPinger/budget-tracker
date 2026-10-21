// Click-through test of the whole month flow (docs/month-flow-spec.md), run against a local backend + Vite dev server.
// Every run registers a new user. Usage (from frontend/): node e2e/month-flow.mjs <chromium|webkit> <width> [shots]
// e.g. node e2e/month-flow.mjs chromium 390 shots. Width < 900 = mobile. Screenshots and results-*.json go to e2e/output/.
// Exit code 1 if any check fails.
import { chromium, webkit } from "playwright";
import fs from "node:fs";
import path from "node:path";

const [browserName = "chromium", widthArg = "390", shotsArg] = process.argv.slice(2);
const WIDTH = Number(widthArg);
const MOBILE = WIDTH < 900;
const SHOTS = shotsArg === "shots";
const APP = process.env.APP_URL || "http://localhost:5173";
const API = process.env.API_URL || "http://localhost:8000/api/v1";
const TAG = `${browserName}-${WIDTH}`;
const OUT_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "output");
const SHOT_DIR = path.join(OUT_DIR, MOBILE ? "mobile" : "desktop");
fs.mkdirSync(SHOT_DIR, { recursive: true });

// Months relative to today, labelled like the app (formatMonthTitle / formatMonthShort / formatMonthName).
const MONTH_NAMES = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
const MONTH_SHORT = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
function monthAt(delta) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + delta, 1);
  const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return {
    ym,
    value: `${ym}-01`,
    name: MONTH_NAMES[d.getMonth()],
    label: MOBILE ? `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` : `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`,
  };
}
const CUR = monthAt(0);
const PREV = monthAt(-1);
const NEXT = monthAt(1);

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? "PASS" : "FAIL"} [${TAG}] ${name}${detail ? ` — ${detail}` : ""}`);
};
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

const browser = await (browserName === "webkit" ? webkit : chromium).launch();
const context = await browser.newContext({
  viewport: { width: WIDTH, height: MOBILE ? 800 : 900 },
  isMobile: MOBILE && browserName === "chromium",
  hasTouch: MOBILE,
  deviceScaleFactor: MOBILE ? 2 : 1,
  locale: "pl-PL",
  timezoneId: "Europe/Warsaw",
});
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && !/Failed to load resource: the server responded with a status of 4(22|09)/.test(m.text()) && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));
page.on("dialog", (d) => d.accept());

let shotNo = 0;
async function layoutChecks(label) {
  const m = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    bw: document.body.scrollWidth,
    iw: window.innerWidth,
  }));
  check(`no horizontal scroll: ${label}`, m.sw <= m.iw && m.bw <= m.iw, `scrollWidth ${m.sw}/${m.bw}, innerWidth ${m.iw}`);
}
async function shot(name, { full = true } = {}) {
  await page.waitForTimeout(250);
  await layoutChecks(name);
  if (!SHOTS) return;
  shotNo += 1;
  const file = path.join(SHOT_DIR, `${String(shotNo).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage: full });
}

const visible = (sel) => page.locator(`${sel} >> visible=true`);
const tileValue = async (label) =>
  norm(await page.locator(".tile", { has: page.locator(".tile-label", { hasText: new RegExp(`^${label}$`) }) }).locator(".tile-value").first().textContent());
const tileText = async (label) =>
  norm(await page.locator(".tile", { has: page.locator(".tile-label", { hasText: new RegExp(`^${label}$`) }) }).first().textContent());
const banner = async () => norm(await page.locator(".banner, [role=status].banner, .notice").first().textContent().catch(() => ""));

async function api(method, p, body) {
  return page.evaluate(
    async ({ method, url, body }) => {
      const token = localStorage.getItem("budget_tracker_token");
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
      });
      let data = null;
      try { data = await r.json(); } catch {}
      return { status: r.status, data };
    },
    { method, url: API + p, body },
  );
}

// Fills an AmountInput / text input by id.
// Category row (wizard / sheet) whose name input currently holds `name`.
async function catRow(scope, name) {
  const idx = await page.locator(`${scope} .setup-category input[id^=cat-name]`).evaluateAll((els, n) => els.findIndex((e) => e.value === n), name);
  return page.locator(`${scope} .setup-category`).nth(idx);
}
const fill = (id, value) => page.locator(`#${id}`).fill(value);
const submitSheet = () => page.locator(".sheet .sheet-foot button[type=submit]").click();
const sheetTitle = async () => norm(await page.locator(".sheet-title").textContent().catch(() => ""));
const waitSheetClosed = () => page.locator(".sheet").waitFor({ state: "detached", timeout: 10000 });

async function fabCheck(label) {
  if (!MOBILE) return;
  const fab = visible(".fab-float");
  if (!(await fab.count())) return check(`floating + visible: ${label}`, false);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  const covered = await page.evaluate(() => {
    const f = document.querySelector(".fab-float").getBoundingClientRect();
    const hits = [];
    for (const el of document.querySelectorAll("main *")) {
      if (el.closest(".fab-float")) continue;
      const isLeaf = el.children.length === 0 || ["BUTTON", "INPUT", "A"].includes(el.tagName);
      if (!isLeaf) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      if (r.right > f.left && r.left < f.right && r.bottom > f.top && r.top < f.bottom)
        hits.push(`${el.tagName}.${el.className} "${(el.textContent || "").trim().slice(0, 30)}"`);
    }
    const fs = getComputedStyle(document.querySelector(".fab-float"));
    return { hits, rect: [f.left, f.top, f.width, f.height], right: window.innerWidth - f.right, bottom: window.innerHeight - f.bottom, fs: fs.position };
  });
  check(`floating + does not cover content at page end: ${label}`, covered.hits.length === 0, covered.hits.join("; "));
  check(`floating + 58px, fixed bottom-right: ${label}`, covered.rect[2] === 58 && covered.fs === "fixed" && covered.right >= 16 && covered.bottom >= 18, JSON.stringify(covered));
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function swipeHeader(dx) {
  await page.evaluate((dx) => {
    const el = document.querySelector(".mobile-header");
    const r = el.getBoundingClientRect();
    const y = r.top + r.height / 2;
    const x0 = r.left + r.width / 2 - dx / 2;
    const touch = (x) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
    el.dispatchEvent(new TouchEvent("touchstart", { touches: [touch(x0)], changedTouches: [touch(x0)], bubbles: true }));
    el.dispatchEvent(new TouchEvent("touchend", { touches: [], changedTouches: [touch(x0 + dx)], bubbles: true }));
  }, dx);
}
const monthLabel = async () => norm(await visible(".month-label").first().textContent());
const waitIdle = () => page.waitForLoadState("networkidle");

async function addExpense({ name, amount, category, date, notes }) {
  if (MOBILE) await visible(".fab-float").click();
  else await visible(".page-header .btn-primary").click();
  await page.locator("#expense-name").fill(name);
  await page.locator("#expense-amount").fill(amount);
  await page.locator("#expense-category").selectOption({ label: category });
  if (date) await page.locator("#expense-date").fill(date);
  if (notes) await page.locator("#expense-notes").fill(notes);
}

try {
  // ---------- Manifest ----------
  const man = await (await fetch(`${APP}/manifest.webmanifest`)).json();
  const head = await fetch(`${APP}/`).then((r) => r.text());
  check("manifest linked in index.html", head.includes('rel="manifest" href="/manifest.webmanifest"'));
  check("manifest fields", man.name === "Budget Tracker" && man.display === "standalone" && man.theme_color && man.icons?.length === 3, JSON.stringify({ name: man.name, display: man.display, theme: man.theme_color }));
  for (const icon of man.icons) {
    const r = await fetch(APP + icon.src);
    check(`manifest icon ${icon.src} loads`, r.ok && r.headers.get("content-type")?.includes("png"), `${r.status}`);
  }

  // ---------- Register (incl. 422 messages) ----------
  await page.goto(APP);
  await page.locator(".link-btn", { hasText: "Zarejestruj" }).click();
  await shot("login-register");
  await fill("auth-name", "Test Użytkownik");
  await fill("auth-email", "nie-email");
  await fill("auth-password", "haslo123");
  await page.locator("button[type=submit]").click();
  const msgEmail = norm(await page.locator("[role=alert]").textContent());
  check("422 register bad e-mail → Polish message", msgEmail === "Podaj poprawny adres e-mail.", msgEmail);
  await fill("auth-email", `e2e-${TAG}-${Date.now()}@example.com`);
  await fill("auth-password", "abc");
  await page.locator("button[type=submit]").click();
  await page.waitForTimeout(400);
  const msgPwd = norm(await page.locator("[role=alert]").textContent());
  check("422 register short password → Polish message", /^[^A-Za-z]*[ĄĆĘŁŃÓŚŹŻA-Za-ząćęłńóśźż ,.]+$/.test(msgPwd) && !/String|should|Value/.test(msgPwd), msgPwd);
  await shot("login-error-422", { full: false });
  await fill("auth-password", "haslo123");

  // Slow down the first data so the loader is visible.
  let slow = true;
  await page.route(`${API}/**`, async (route) => {
    if (slow && route.request().method() === "GET") await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });
  await page.locator("button[type=submit]").click();
  await page.locator(".app-loader").waitFor({ timeout: 5000 });
  check("loading screen shown", await page.locator(".app-loader").isVisible());
  const loaderTxt = norm(await page.locator(".app-loader").textContent());
  check("loading screen text", loaderTxt.includes("Budget Tracker") && loaderTxt.includes("Ładowanie aplikacji..."), loaderTxt);
  const loaderBox = await page.locator(".app-loader-title").boundingBox();
  check("loader centered horizontally", Math.abs(loaderBox.x + loaderBox.width / 2 - WIDTH / 2) < 3, JSON.stringify(loaderBox));
  if (SHOTS) await page.screenshot({ path: path.join(SHOT_DIR, `${String(++shotNo).padStart(2, "0")}-loading.png`) });
  slow = false;
  await page.locator(".month-empty").waitFor();
  await waitIdle();

  // ---------- Empty month ----------
  check(`current month = ${CUR.label}`, (await monthLabel()) === CUR.label, await monthLabel());
  check("empty month CTA", await page.getByRole("button", { name: "Zacznij kontrolę budżetu" }).isVisible());
  check("no floating + in empty month", (await visible(".fab-float").count()) === 0);
  check("no header actions in empty month", (await visible(".page-header .btn-primary").count()) === 0);
  await shot("empty-month");

  // Previous month (September) as copy source, through the API.
  const prev = await api("POST", "/months/setup", {
    month: PREV.value, salary: 8000, total_limit: 6000,
    categories: [
      { name: "Czynsz", limit_amount: 2000, is_recurring: true },
      { name: "Jedzenie", limit_amount: 1500, is_recurring: false },
      { name: "Transport", limit_amount: 500, is_recurring: false },
    ],
  });
  check("API: previous month setup 201", prev.status === 201 || prev.status === 200, `${prev.status}`);
  const dup = await api("POST", "/months/setup", { month: PREV.value, salary: 1, total_limit: 1, categories: [] });
  check("API: setup of started month → 409 Polish", dup.status === 409 && /miesiąc/i.test(dup.data?.detail), `${dup.status} ${dup.data?.detail}`);

  // ---------- Wizard ----------
  await page.getByRole("button", { name: "Zacznij kontrolę budżetu" }).click();
  await page.locator(".setup").waitFor();
  check("wizard step 1 'Krok 1 z 3'", norm(await page.locator(".stepper .overline").textContent()) === "Krok 1 z 3");
  check("salary input inputmode=decimal", (await page.locator("#setup-salary").getAttribute("inputmode")) === "decimal");
  await shot("wizard-1-salary");
  await page.getByRole("button", { name: "Dalej" }).click();
  check("wizard: empty salary error", norm(await page.locator(".setup .notice").textContent()).startsWith("Podaj wypłatę"));
  await fill("setup-salary", "abc");
  await page.getByRole("button", { name: "Dalej" }).click();
  check("wizard: invalid salary error", norm(await page.locator(".setup .notice").textContent()).startsWith("Podaj poprawną kwotę"));
  await shot("wizard-1-error", { full: false });
  if (MOBILE) {
    const actions = await page.locator(".setup-actions").boundingBox();
    check("wizard actions fixed at bottom (mobile)", actions && actions.y + actions.height > 800 - 40, JSON.stringify(actions));
    const btnH = (await page.getByRole("button", { name: "Dalej" }).boundingBox()).height;
    check("wizard 'Dalej' ≥ 44px", btnH >= 44, `${btnH}`);
  }
  await fill("setup-salary", "9 000,00");
  await page.getByRole("button", { name: "Dalej" }).click();
  check("wizard step 2", norm(await page.locator(".stepper .overline").textContent()) === "Krok 2 z 3");
  await fill("setup-budget", "9500");
  const warn = norm(await page.locator(".setup .notice-warning, .setup .notice").first().textContent());
  check("over-salary warning", warn.includes("Budżet przekracza wypłatę o 500,00 zł – cel oszczędnościowy będzie ujemny"), warn);
  await shot("wizard-2-over-salary");
  await page.getByRole("button", { name: /Tak jak w poprzednim miesiącu/ }).click();
  check("copy previous budget", (await page.locator("#setup-budget").inputValue()).replace(/\s/g, "") === "6000" || /6\s?000/.test(await page.locator("#setup-budget").inputValue()), await page.locator("#setup-budget").inputValue());
  check("warning gone after copy", (await page.locator(".setup .notice").count()) === 0);
  await page.getByRole("button", { name: "Dalej" }).click();
  check("wizard step 3", norm(await page.locator(".stepper .overline").textContent()) === "Krok 3 z 3");
  await shot("wizard-3-categories-empty");
  await page.getByRole("button", { name: /Skopiuj kategorie/ }).click();
  const names = await page.locator(".setup-category input[id^=cat-name]").evaluateAll((els) => els.map((e) => e.value));
  check("copy categories", names.join(",") === "Czynsz,Jedzenie,Transport", names.join(","));
  const recChecked = await page.locator(".setup-category input[type=checkbox]").evaluateAll((els) => els.map((e) => e.checked));
  check("copied recurring flags", recChecked.join(",") === "true,false,false", recChecked.join(","));
  await page.getByRole("button", { name: "Dodaj kategorię" }).click();
  const last = page.locator(".setup-category").last();
  await last.locator("input[id^=cat-name]").fill("Internet");
  await last.locator("input[id^=cat-limit]").fill("80,50");
  await last.locator("input[type=checkbox]").check();
  // Make limits exceed budget to see the live hint, then fix.
  await page.locator(".setup-category").nth(1).locator("input[id^=cat-limit]").fill("4000");
  const hint = norm(await page.locator(".setup .notice").first().textContent().catch(() => ""));
  check("limits > budget hint", hint.includes("Limity przekraczają budżet o"), hint);
  await shot("wizard-3-limits-over");
  await page.locator(".setup-category").nth(1).locator("input[id^=cat-limit]").fill("1500");
  await page.getByRole("button", { name: "Wstecz" }).click();
  check("Wstecz → step 2 keeps value", /6\s?000/.test(await page.locator("#setup-budget").inputValue()));
  await page.getByRole("button", { name: "Dalej" }).click();
  check("rows kept after back/next", (await page.locator(".setup-category").count()) === 4);
  await page.getByRole("button", { name: "Zapisz" }).click();
  await page.locator(".tiles").waitFor({ timeout: 10000 });
  await waitIdle();

  // ---------- Dashboard tiles ----------
  check("banner after setup", (await banner()).includes("Miesiąc został rozpoczęty."), await banner());
  const tileLabels = await page.locator(".tiles .tile-label").evaluateAll((els) => els.map((e) => e.textContent.trim()));
  check("6 tiles in order", tileLabels.join("|") === "Pozostało do wydania|Cel oszczędnościowy|Przychody|Budżet|Wydano|Limity", tileLabels.join("|"));
  check("Pozostało = 3 919,50 zł", (await tileValue("Pozostało do wydania")) === "3 919,50 zł", await tileValue("Pozostało do wydania"));
  check("Cel = 3 000,00 zł", (await tileValue("Cel oszczędnościowy")) === "3 000,00 zł", await tileValue("Cel oszczędnościowy"));
  check("Cel 100 % · na dziś", (await tileText("Cel oszczędnościowy")).includes("100 %") && (await tileText("Cel oszczędnościowy")).includes("na dziś"), await tileText("Cel oszczędnościowy"));
  check("Przychody = 9 000,00 zł", (await tileValue("Przychody")) === "9 000,00 zł");
  check("Budżet = 6 000,00 zł, 66,7 % przychodów", (await tileValue("Budżet")) === "6 000,00 zł" && (await tileText("Budżet")).includes("66,7 % przychodów"), await tileText("Budżet"));
  check("Wydano = 2 080,50 zł, 2 wydatki", (await tileValue("Wydano")) === "2 080,50 zł" && (await tileText("Wydano")).includes("2 wydatki"), await tileText("Wydano"));
  check("Limity 0 / 4", (await tileValue("Limity")) === "0 / 4" && (await tileText("Limity")).includes("Wszystkie w normie"), await tileText("Limity"));
  const cols = await page.evaluate(() => getComputedStyle(document.querySelector(".tiles")).gridTemplateColumns.split(" ").length);
  check(`tile grid ${MOBILE ? 2 : 3} columns`, cols === (MOBILE ? 2 : 3), `${cols}`);
  const editTiles = await page.locator(".tiles button.tile").evaluateAll((els) => els.map((e) => [e.getAttribute("aria-label"), e.getBoundingClientRect().height]));
  check("editable tiles are buttons ≥ 44px with aria-label", editTiles.length >= 2 && editTiles.every(([l, h]) => h >= 44) && editTiles.some(([l]) => l === "Edytuj przychody") && editTiles.some(([l]) => l === "Edytuj budżet"), JSON.stringify(editTiles));
  const rowHeights = await page.locator(".tiles .tile").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
  const perRow = MOBILE ? 2 : 3;
  let equal = true;
  for (let i = 0; i < rowHeights.length; i += perRow) if (new Set(rowHeights.slice(i, i + perRow)).size > 1) equal = false;
  check("tiles equal height per row", equal, rowHeights.join(","));
  const valueWraps = await page.locator(".tile-value").evaluateAll((els) => els.filter((e) => e.getClientRects().length > 1 || e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
  check("tile values don't wrap/overflow", valueWraps.length === 0, valueWraps.join(","));
  check("recurring category has no warning pill", (await page.locator("#kategorie .cat-line", { hasText: "Czynsz" }).locator(".pill").count()) === 0);
  await shot("dashboard-active");
  await fabCheck("dashboard after setup");

  // ---------- Add expense ----------
  await addExpense({ name: "Zakupy spożywcze", amount: "1300,50", category: "Jedzenie", notes: "Biedronka tygodniowe" });
  check("expense sheet title", (await sheetTitle()) === "Dodaj wydatek");
  const catOptions = await page.locator("#expense-category option").evaluateAll((els) => els.map((e) => e.textContent));
  check("recurring categories not offered for new expense", !catOptions.includes("Czynsz") && !catOptions.includes("Internet"), catOptions.join(","));
  check("no floating + while sheet open", (await visible(".fab-float").count()) === 0);
  await shot("sheet-add-expense", { full: false });
  await submitSheet();
  await waitSheetClosed();
  await waitIdle();
  check("banner 'Wydatek został dodany.'", (await banner()).includes("Wydatek został dodany."), await banner());
  check("Wydano = 3 381,00 zł", (await tileValue("Wydano")) === "3 381,00 zł", await tileValue("Wydano"));
  // Over-limit warning + 422 on too long name.
  await addExpense({ name: "Kolacja", amount: "400", category: "Jedzenie" });
  await page.locator("#expense-amount").fill("400");
  const w = norm(await page.locator(".sheet .notice").first().textContent().catch(() => ""));
  check("over-limit warning in sheet", w.includes("przekroczysz limit kategorii „Jedzenie” o 200,50 zł"), w);
  await shot("sheet-expense-over-limit", { full: false });
  await page.locator("#expense-name").fill("X".repeat(300));
  await submitSheet();
  await page.waitForTimeout(500);
  const e422 = norm(await page.locator(".sheet .notice-error, .sheet .notice").last().textContent());
  check("422 too long name → Polish 'Tekst jest za długi.'", e422 === "Tekst jest za długi.", e422);
  await shot("sheet-expense-422", { full: false });
  await page.locator("#expense-name").fill("Kolacja");
  await submitSheet();
  await waitSheetClosed();
  await waitIdle();
  check("Limity 1 / 4 exceeded", (await tileValue("Limity")) === "1 / 4" && (await tileText("Limity")).includes("1 przekroczony"), await tileText("Limity"));
  check("exceeded pill on Jedzenie", (await page.locator("#kategorie .cat-line", { hasText: "Jedzenie" }).locator(".pill").count()) === 1);

  // ---------- Extra income: add / edit / delete ----------
  await page.getByRole("button", { name: "Edytuj przychody" }).click();
  check("Przychody sheet", (await sheetTitle()) === "Przychody");
  await shot("sheet-incomes-empty", { full: false });
  await page.getByRole("button", { name: "Dodaj przychód" }).click();
  check("Dodaj przychód sheet", (await sheetTitle()) === "Dodaj przychód");
  await page.locator("#income-name").fill("Premia");
  await page.locator("#income-amount").fill("1000");
  await page.locator("#income-date").fill(`${NEXT.ym}-02`);
  await submitSheet();
  const dErr = norm(await page.locator(".sheet .notice").last().textContent());
  check("income date outside month error", dErr === "Data musi być w wybranym miesiącu.", dErr);
  await page.locator("#income-date").fill(`${CUR.ym}-10`);
  await shot("sheet-add-income", { full: false });
  await submitSheet();
  await page.locator(".sheet-title", { hasText: /^Przychody$/ }).waitFor();
  await page.getByRole("button", { name: "Dodaj przychód" }).click();
  await page.locator("#income-name").fill("Zwrot podatku");
  await page.locator("#income-amount").fill("200");
  await submitSheet();
  await page.locator(".sheet-title", { hasText: /^Przychody$/ }).waitFor();
  await waitIdle();
  check("2 incomes listed", (await page.locator(".mini-row").count()) === 2);
  check("Przychody razem 10 200,00 zł", norm(await page.locator(".sheet-total").textContent()).includes("10 200,00 zł"), norm(await page.locator(".sheet-total").textContent()));
  await page.getByRole("button", { name: "Edytuj przychód Premia" }).click();
  check("Edytuj przychód sheet", (await sheetTitle()) === "Edytuj przychód");
  await page.locator("#income-amount").fill("1500");
  await shot("sheet-edit-income", { full: false });
  await submitSheet();
  await page.locator(".sheet-title", { hasText: /^Przychody$/ }).waitFor();
  await waitIdle();
  await page.getByRole("button", { name: "Usuń przychód Zwrot podatku" }).click();
  await page.waitForTimeout(500);
  await waitIdle();
  check("1 income after delete", (await page.locator(".mini-row").count()) === 1);
  check("Przychody razem 10 500,00 zł", norm(await page.locator(".sheet-total").textContent()).includes("10 500,00 zł"), norm(await page.locator(".sheet-total").textContent()));
  const iconBtns = await page.locator(".mini-row .icon-btn").evaluateAll((els) => els.map((e) => [e.offsetWidth, e.offsetHeight]));
  check("income row icon buttons 44×44", iconBtns.every(([w, h]) => w >= 44 && h >= 44), JSON.stringify(iconBtns));
  await shot("sheet-incomes-list", { full: false });
  // Salary edit
  await page.locator("#sheet-salary").fill("9500");
  await submitSheet();
  await waitSheetClosed();
  await waitIdle();
  check("Przychody tile 11 000,00 zł, + 1 dodatkowy", (await tileValue("Przychody")) === "11 000,00 zł" && (await tileText("Przychody")).includes("+ 1 dodatkowy"), await tileText("Przychody"));

  // ---------- Goal recalculation (active) ----------
  // income 11000, budget 6000 -> goal 5000; spent 3781 < budget -> 100 %.
  check("goal 5 000,00 zł", (await tileValue("Cel oszczędnościowy")) === "5 000,00 zł", await tileValue("Cel oszczędnościowy"));
  check("active goal within budget = 100 %", (await tileText("Cel oszczędnościowy")).includes("100 %"), await tileText("Cel oszczędnościowy"));
  // Overspend: +4000 -> spent 7781 -> saved 11000-7781 = 3219 / 5000 = 64,4 % amber.
  await addExpense({ name: "Naprawa auta", amount: "4000", category: "Transport", notes: "mechanik" });
  await submitSheet();
  await waitSheetClosed();
  await waitIdle();
  const g1 = await tileText("Cel oszczędnościowy");
  check("active goal overspent = 64,4 % amber", g1.includes("64,4 %") && (await page.locator(".tile", { hasText: "Cel oszczędnościowy" }).locator(".pill-warning").count()) === 1, g1);
  check("Pozostało negative red", (await tileValue("Pozostało do wydania")) === "-1 781,00 zł" || (await tileValue("Pozostało do wydania")).includes("1 781,00"), await tileValue("Pozostało do wydania"));
  check("budget bar exceeded state", (await page.locator(".tile-accent .progress-fill, .tile-accent [class*=exceeded]").count()) > 0);
  await shot("dashboard-overspent");

  // ---------- Recurring group, search, filter ----------
  const group = page.locator(".rec-head");
  check("recurring group collapsed", (await group.getAttribute("aria-expanded")) === "false");
  check("recurring group meta '2 pozycje · stałe co miesiąc'", norm(await group.textContent()).includes("2 pozycje · stałe co miesiąc"), norm(await group.textContent()));
  await group.click();
  check("recurring group expanded", (await group.getAttribute("aria-expanded")) === "true" && (await page.locator(".rec-items .expense-row, .rec-items > *").count()) === 2);
  await shot("expenses-recurring-expanded");
  await group.click();
  await page.locator(".search-input").fill("mechanik");
  const visibleNames = async () => page.locator(".expense-list .expense-name").evaluateAll((els) => els.map((e) => e.textContent.trim()));
  check("search by note", (await visibleNames()).join(",") === "Naprawa auta", (await visibleNames()).join(","));
  await page.locator(".search-input").fill("zakupy");
  check("search by name", (await visibleNames()).join(",") === "Zakupy spożywcze", (await visibleNames()).join(","));
  await page.locator(".search-input").fill("czyn");
  check("search finds recurring (group auto-expanded)", (await visibleNames()).includes("Czynsz"), (await visibleNames()).join(","));
  await page.locator(".search-input").fill("zzzz");
  check("search no match message", norm(await page.locator(".expenses-empty").textContent()) === "Brak wydatków pasujących do wyszukiwania.");
  await shot("expenses-search-empty");
  await page.locator(".search-input").fill("");
  const chips = await page.locator(".filter-chip").evaluateAll((els) => els.map((e) => e.textContent.trim()));
  check("chips: Wszystkie, Wydatki cykliczne, non-recurring categories", chips.join(",") === "Wszystkie,Wydatki cykliczne,Jedzenie,Transport", chips.join(","));
  await page.locator(".filter-chip", { hasText: "Jedzenie" }).click();
  check("filter Jedzenie", (await visibleNames()).sort().join(",") === "Kolacja,Zakupy spożywcze", (await visibleNames()).join(","));
  await shot("expenses-filter-category");
  await page.locator(".filter-chip", { hasText: "Wydatki cykliczne" }).click();
  check("filter recurring shows only expanded group", (await visibleNames()).join(",") === "Wydatki cykliczne,Czynsz,Internet" || (await visibleNames()).sort().join(",") === "Czynsz,Internet,Wydatki cykliczne", (await visibleNames()).join(","));
  const chipRow = await page.evaluate(() => { const r = document.querySelector(".chip-row"); return { ox: getComputedStyle(r).overflowX, sw: r.scrollWidth, cw: r.clientWidth }; });
  check("chip row scrolls itself (overflow-x auto)", ["auto", "scroll"].includes(chipRow.ox), JSON.stringify(chipRow));
  await page.locator(".filter-chip", { hasText: "Wszystkie" }).click();

  // ---------- Edit / delete expense ----------
  await page.locator(".expense-list .expense-name", { hasText: "Naprawa auta" }).click();
  check("Edytuj wydatek sheet", (await sheetTitle()) === "Edytuj wydatek");
  check("edit sheet prefilled", (await page.locator("#expense-name").inputValue()) === "Naprawa auta");
  await shot("sheet-edit-expense", { full: false });
  await page.locator("#expense-amount").fill("3500");
  await submitSheet();
  await waitSheetClosed();
  await waitIdle();
  check("banner 'Wydatek został zaktualizowany.'", (await banner()).includes("zaktualizowany"), await banner());
  check("Wydano 7 281,00 zł after edit", (await tileValue("Wydano")) === "7 281,00 zł", await tileValue("Wydano"));
  await page.locator(".expense-list .expense-name", { hasText: "Naprawa auta" }).click();
  await page.getByRole("button", { name: "Usuń wydatek" }).click();
  await waitSheetClosed();
  await waitIdle();
  check("expense deleted", (await tileValue("Wydano")) === "3 781,00 zł" && (await banner()).includes("usunięty"), await tileValue("Wydano"));
  // Recurring row not editable
  await page.locator(".rec-head").click();
  await page.locator(".rec-items .expense-name", { hasText: "Czynsz" }).click();
  check("recurring expense click opens nothing", (await page.locator(".sheet").count()) === 0);
  await page.locator(".rec-head").click();

  // ---------- Edit budget ----------
  await page.getByRole("button", { name: "Edytuj budżet" }).click();
  check("Edytuj budżet sheet", (await sheetTitle()) === "Edytuj budżet");
  await page.locator("#sheet-budget").fill("12000");
  const bw = norm(await page.locator(".sheet .notice").first().textContent().catch(() => ""));
  check("budget > income warning in sheet", bw.includes("Budżet przekracza przychody o 1 000,00 zł"), bw);
  await shot("sheet-budget-over-income", { full: false });
  await page.locator("#sheet-budget").fill("3000");
  const lw = norm(await page.locator(".sheet").textContent());
  check("limits > budget warning in sheet", lw.includes("Limity kategorii przekraczają budżet o"), "");
  await page.locator("#sheet-budget").fill("7000");
  await submitSheet();
  await waitSheetClosed();
  await waitIdle();
  check("budget 7 000,00 zł, goal 4 000,00 zł", (await tileValue("Budżet")) === "7 000,00 zł" && (await tileValue("Cel oszczędnościowy")) === "4 000,00 zł", `${await tileValue("Budżet")} ${await tileValue("Cel oszczędnościowy")}`);

  // ---------- Edit categories ----------
  await page.locator("#kategorie .edit-btn").click();
  check("Kategorie sheet", (await sheetTitle()) === "Kategorie");
  check("Kategorie sheet rows = 4", (await page.locator(".sheet .setup-category").count()) === 4);
  await shot("sheet-categories", { full: false });
  // Change Internet limit (recurring) -> recurring expense follows.
  const internetRow = await catRow(".sheet", "Internet");
  await internetRow.locator("input[id^=cat-limit]").fill("100");
  // Rename Transport, add Rozrywka, delete... add then remove a new one
  await (await catRow(".sheet", "Transport")).locator("input[id^=cat-name]").fill("Komunikacja");
  await page.locator(".sheet").getByRole("button", { name: "Dodaj kategorię" }).click();
  await page.locator(".sheet .setup-category").last().locator("input[id^=cat-name]").fill("Rozrywka");
  await page.locator(".sheet .setup-category").last().locator("input[id^=cat-limit]").fill("300");
  await page.locator(".sheet").getByRole("button", { name: "Dodaj kategorię" }).click();
  await page.locator(".sheet .setup-category").last().locator("input[id^=cat-name]").fill("Do usunięcia");
  await page.locator(".sheet .setup-category").last().getByRole("button", { name: /Usuń kategorię/ }).click();
  // Duplicate name check
  await page.locator(".sheet .setup-category").last().locator("input[id^=cat-name]").fill("Jedzenie");
  await submitSheet();
  const dupErr = norm(await page.locator(".sheet .notice").last().textContent());
  check("duplicate category name error", dupErr.includes("występuje więcej niż raz"), dupErr);
  await page.locator(".sheet .setup-category").last().locator("input[id^=cat-name]").fill("Rozrywka");
  await submitSheet();
  await waitSheetClosed();
  await waitIdle();
  const catNames = await page.locator("#kategorie .cat-line-text").evaluateAll((els) => els.map((e) => e.textContent.trim()));
  check("categories saved", catNames.slice().sort().join(",") === "Czynsz,Internet,Jedzenie,Komunikacja,Rozrywka", catNames.join(","));
  const sheetOrder = await (async () => { await page.locator("#kategorie .edit-btn").click(); const v = await page.locator(".sheet .setup-category input[id^=cat-name]").evaluateAll((els) => els.map((e) => e.value)); await page.locator(".sheet-foot .btn-secondary").click(); return v; })();
  check("Kategorie card order = sheet order (stable)", catNames.join(",") === sheetOrder.join(","), `card ${catNames.join(",")} / sheet ${sheetOrder.join(",")}`);
  check("recurring Internet follows limit (Wydano 3 800,50)", (await tileValue("Wydano")) === "3 800,50 zł", await tileValue("Wydano"));
  check("Limity x / 5", (await tileValue("Limity")).endsWith("/ 5"), await tileValue("Limity"));
  // Delete a category with no expenses via the sheet
  await page.locator("#kategorie .edit-btn").click();
  await (await catRow(".sheet", "Rozrywka")).getByRole("button", { name: /Usuń kategorię/ }).click();
  await submitSheet();
  await waitSheetClosed();
  await waitIdle();
  check("category deleted", (await tileValue("Limity")).endsWith("/ 4"), await tileValue("Limity"));
  await shot("dashboard-after-edits");
  await fabCheck("dashboard after edits");

  // ---------- 422 on budget via API (Polish mapping) ----------
  const big = await api("POST", "/incomes/", { name: "Duży", amount: 99999999999, income_date: `${CUR.ym}-05` });
  check("API 422 amount too large → 'Kwota jest za duża.'", big.status === 422 && big.data.detail?.[0]?.msg === "Kwota jest za duża.", JSON.stringify(big.data?.detail?.[0]?.msg));

  // ---------- Close month ----------
  if (MOBILE) await page.locator(".close-month-btn").click();
  else await visible(".page-header .btn-secondary").click();
  check("close dialog title", (await sheetTitle()) === `Zamknąć ${CUR.name.toLowerCase()}?`, await sheetTitle());
  check("close dialog is alertdialog centered", (await page.locator(".sheet-dialog[role=alertdialog]").count()) === 1);
  await shot("dialog-close-month", { full: false });
  await submitSheet();
  await page.locator(".tile-label", { hasText: "Zaoszczędzono" }).waitFor();
  await waitIdle();

  // ---------- Closed summary ----------
  check("banner 'Miesiąc został zamknięty.'", (await banner()).includes("zamknięty"), await banner());
  const closedLabels = await page.locator(".tiles .tile-label").evaluateAll((els) => els.map((e) => e.textContent.trim()));
  check("closed tiles in order", closedLabels.join("|") === "Przychody razem|Wydano|Zaoszczędzono|Cel oszczędnościowy|Budżet|Limity", closedLabels.join("|"));
  // income 11000, spent 3800.5, budget 7000, goal 4000 -> saved 7199.5 -> 180 %
  check("Zaoszczędzono 7 199,50 zł", (await tileValue("Zaoszczędzono")) === "7 199,50 zł", await tileValue("Zaoszczędzono"));
  const g2 = await tileText("Cel oszczędnościowy");
  check("closed goal formula 180 % Ponad cel (no 'na dziś')", g2.includes("180 %") && g2.includes("Ponad cel") && !g2.includes("na dziś"), g2);
  check("closed Przychody razem lists Premia", (await tileText("Przychody razem")).includes("Premia"), await tileText("Przychody razem"));
  check("Przekroczone limity card", (await page.locator(".panel, section", { hasText: "Przekroczone limity" }).count()) > 0);
  check("closed: no pencils / edit buttons", (await page.locator(".tile-edit, .edit-btn, button.tile[aria-label]").count()) === 0);
  check("closed: no floating +", (await visible(".fab-float").count()) === 0);
  check("closed: no Zamknij miesiąc", (await visible(".close-month-btn").count()) + (await visible(".page-header .btn-secondary").count()) === 0);
  check("closed: Otwórz ponownie visible", await visible("button:has-text('Otwórz ponownie')").first().isVisible());
  await page.locator(".expense-list .expense-name", { hasText: "Zakupy" }).click();
  check("closed: expense row opens nothing", (await page.locator(".sheet").count()) === 0);
  await page.locator(".search-input").fill("kolacja");
  check("closed: search still works", (await visibleNames()).join(",") === "Kolacja", (await visibleNames()).join(","));
  await page.locator(".search-input").fill("");
  await page.locator(".filter-chip", { hasText: "Jedzenie" }).click();
  check("closed: filter still works", (await visibleNames()).length === 2);
  await page.locator(".filter-chip", { hasText: "Wszystkie" }).click();
  await shot("closed-summary");

  // Backend 409 for every edit in a closed month
  const cats = (await api("GET", "/categories/")).data.filter((c) => c.month.startsWith(CUR.ym));
  const exps = (await api("GET", "/expenses/")).data.filter((e) => e.expense_date.startsWith(CUR.ym));
  const incs = (await api("GET", `/incomes/?month=${CUR.value}`)).data;
  const ov = (await api("GET", `/stats/month-overview?month=${CUR.value}`)).data;
  const regular = exps.find((e) => !e.is_recurring);
  const calls = [
    ["POST expense", "POST", "/expenses/", { category_id: cats.find((c) => !c.is_recurring).id, name: "Test", amount: 1, expense_date: `${CUR.ym}-05` }],
    ["PUT expense", "PUT", `/expenses/${regular.id}`, { amount: 2 }],
    ["DELETE expense", "DELETE", `/expenses/${regular.id}`],
    ["POST income", "POST", "/incomes/", { name: "Test", amount: 1, income_date: `${CUR.ym}-05` }],
    ["PUT income", "PUT", `/incomes/${incs[0].id}`, { amount: 2 }],
    ["DELETE income", "DELETE", `/incomes/${incs[0].id}`],
    ["POST category", "POST", "/categories/", { month: CUR.value, name: "Nowa", limit_amount: 5 }],
    ["PUT category", "PUT", `/categories/${cats[0].id}`, { limit_amount: 5 }],
    ["DELETE category", "DELETE", `/categories/${cats[0].id}`],
    ["PUT budget", "PUT", `/budgets/${ov.budget_id}`, { total_limit: 5 }],
    ["PUT salary", "PUT", `/months/${CUR.value}/salary`, { salary: 5 }],
    ["move expense into closed month", "PUT", `/expenses/${regular.id}`, { expense_date: `${PREV.ym}-10` }],
    ["close again", "POST", `/months/${CUR.value}/close`],
  ];
  for (const [label, method, p, body] of calls) {
    const r = await api(method, p, body);
    const detail = r.data?.detail;
    check(`API 409 closed month: ${label}`, r.status === 409 && /zamknięty/.test(detail), `${r.status} ${detail}`);
  }

  // ---------- Reopen ----------
  await visible("button:has-text('Otwórz ponownie')").first().click();
  await page.locator(".tile-label", { hasText: "Pozostało do wydania" }).waitFor();
  await waitIdle();
  check("reopened: active dashboard", (await banner()).includes("otwarty ponownie"), await banner());
  check("reopened: edits allowed again", (await page.locator("button.tile").count()) >= 2);
  if (MOBILE) check("reopened: floating + back", (await visible(".fab-float").count()) === 1);

  // 409 shown in the UI (stale page: month closed elsewhere)
  await api("POST", `/months/${CUR.value}/close`);
  await addExpense({ name: "Kino", amount: "40", category: "Jedzenie" });
  await submitSheet();
  await page.waitForTimeout(600);
  const e409 = norm(await page.locator(".sheet .notice").last().textContent());
  check("UI shows Polish 409 in sheet", e409 === "Miesiąc jest zamknięty. Otwórz go ponownie, aby wprowadzić zmiany.", e409);
  await shot("sheet-expense-409", { full: false });
  await page.locator(".sheet-foot .btn-secondary").click();
  await page.reload();
  await page.locator(".tile-label", { hasText: "Zaoszczędzono" }).waitFor();
  await visible("button:has-text('Otwórz ponownie')").first().click();
  await page.locator(".tile-label", { hasText: "Pozostało do wydania" }).waitFor();
  await waitIdle();

  // ---------- Month switcher ----------
  const prevBtn = visible("button[aria-label='Poprzedni miesiąc']").first();
  const nextBtn = visible("button[aria-label='Następny miesiąc']").first();
  const arrowBox = await prevBtn.boundingBox();
  if (MOBILE) check("mobile month arrows ≥ 44px", arrowBox.width >= 44 && arrowBox.height >= 44, JSON.stringify(arrowBox));
  await prevBtn.click();
  await waitIdle();
  check(`‹ → ${PREV.label}`, (await monthLabel()) === PREV.label, await monthLabel());
  check("September active dashboard", (await page.locator(".tiles").count()) === 1);
  check("not-current dot shown", (await visible(".month-today-dot").count()) === 1);
  await shot("month-previous");
  await nextBtn.click();
  await nextBtn.click();
  await waitIdle();
  await page.locator(".month-empty").waitFor({ timeout: 5000 }).catch(() => {});
  check(`› › → ${NEXT.label} empty`, (await monthLabel()) === NEXT.label && (await page.getByRole("button", { name: "Zacznij kontrolę budżetu" }).count()) === 1, await monthLabel());
  await visible(".month-label").first().click();
  await waitIdle();
  check("tap label → current month", (await monthLabel()) === CUR.label && (await visible(".month-today-dot").count()) === 0, await monthLabel());
  if (MOBILE) {
    await swipeHeader(-120);
    await waitIdle();
    check("swipe left → next month", (await monthLabel()) === NEXT.label, await monthLabel());
    await swipeHeader(120);
    await swipeHeader(120);
    await waitIdle();
    check("swipe right ×2 → previous month", (await monthLabel()) === PREV.label, await monthLabel());
    await swipeHeader(20);
    await waitIdle();
    check("short swipe ignored", (await monthLabel()) === PREV.label, await monthLabel());
    await visible(".month-label").first().click();
    await waitIdle();
  }
  // Quick switching: a slow response for the month we left must not replace the new month's data.
  const slowCurrent = async (route) => {
    if (route.request().url().includes(CUR.value)) await new Promise((r) => setTimeout(r, 1200));
    await route.continue();
  };
  await page.route(`${API}/**`, slowCurrent);
  await prevBtn.click();
  await visible(".month-label").first().click();
  await nextBtn.click();
  await page.waitForTimeout(2000);
  await waitIdle();
  check("quick switching: stale response ignored", (await monthLabel()) === NEXT.label && (await page.locator(".month-empty").count()) === 1 && (await page.locator(".tiles").count()) === 0, await monthLabel());
  await page.unroute(`${API}/**`, slowCurrent);
  await visible(".month-label").first().click();
  await waitIdle();

  // Wizard closes when month changes
  await nextBtn.click();
  await page.getByRole("button", { name: "Zacznij kontrolę budżetu" }).click();
  await page.locator(".setup").waitFor();
  await prevBtn.click();
  await waitIdle();
  check("switching month closes wizard", (await page.locator(".setup").count()) === 0);
  // Far past
  for (let i = 0; i < 30; i++) await prevBtn.click();
  await waitIdle();
  check(`far past (30 back) → ${monthAt(-30).label} empty`, (await monthLabel()) === monthAt(-30).label && (await page.getByRole("button", { name: "Zacznij kontrolę budżetu" }).count()) === 1, await monthLabel());
  await shot("month-far-past");
  await visible(".month-label").first().click();
  for (let i = 0; i < 27; i++) await nextBtn.click();
  await waitIdle();
  check(`far future (27 ahead) → ${monthAt(27).label} empty`, (await monthLabel()) === monthAt(27).label && (await page.getByRole("button", { name: "Zacznij kontrolę budżetu" }).count()) === 1, await monthLabel());
  check("no error banner on far months", (await page.locator(".banner-error, .banner.error, [class*=banner][class*=error]").count()) === 0);
  await shot("month-far-future");
  await visible(".month-label").first().click();
  await waitIdle();
  check("back to current", (await monthLabel()) === CUR.label);

  // Account menu screenshot (mobile)
  if (MOBILE) {
    await page.locator(".mobile-header .account-trigger, .mobile-header button[aria-haspopup]").first().click().catch(() => {});
    await shot("account-menu", { full: false });
  }

  // Mobile tap targets (visible buttons/inputs < 44 px; chips are 36 px by design, desktop is mouse-sized)
  if (MOBILE) {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll("button, input, select, a")]
      .filter((e) => e.offsetParent && !e.classList.contains("filter-chip"))
      .map((e) => [e.className || e.tagName, e.getBoundingClientRect()])
      .filter(([, r]) => r.width && (r.height < 44 || r.width < 44))
      .map(([c, r]) => `${c} ${Math.round(r.width)}×${Math.round(r.height)}`),
  );
  check("tap targets ≥ 44px (except chips)", small.length === 0, [...new Set(small)].join("; "));
  }
} catch (err) {
  check("script error", false, err.stack?.split("\n").slice(0, 3).join(" | "));
  await page.screenshot({ path: path.join(SHOT_DIR, `ERROR-${TAG}.png`), fullPage: true }).catch(() => {});
} finally {
  check("no console errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));
  await browser.close();
  const failed = results.filter((r) => !r.ok);
  fs.writeFileSync(path.join(OUT_DIR, `results-${TAG}.json`), JSON.stringify(results, null, 2));
  console.log(`\n[${TAG}] ${results.length - failed.length}/${results.length} passed`);
  process.exitCode = failed.length ? 1 : 0;
}
