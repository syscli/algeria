import { changes, commune, communes, search, wilaya, wilayas, type Commune, type Wilaya } from "../src/index.js";
import strings from "./strings.json";

type Lang = "fr" | "ar";
type Key = keyof typeof strings.fr;
type MapData = { viewBox: string; w69: Record<string, string>; w58: Record<string, string> };

const $ = <T extends Element>(sel: string) => document.querySelector(sel) as T;
const input = $<HTMLInputElement>("#q");
const list = $<HTMLUListElement>("#suggestions");
const box = $<HTMLDivElement>(".search");
const result = $<HTMLElement>("#result");
const svg = $<SVGSVGElement>("#map");

let lang: Lang = pickLang();
let selected: Commune | null = null;
let options: Commune[] = [];
let active = -1;
let map: MapData | null = null;

const moved2026 = new Map(changes(2026).map(m => [m.commune.code, m]));
const moved2019 = new Map(changes(2019).map(m => [m.commune.code, m]));

function pickLang(): Lang {
  const q = new URLSearchParams(location.search).get("lang");
  if (q === "ar" || q === "fr") return q;
  return navigator.language.startsWith("ar") ? "ar" : "fr";
}

function t(key: Key, vars: Record<string, string | number> = {}): string {
  return strings[lang][key].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const cName = (c: Commune) => (lang === "ar" ? c.nameAr : c.nameFr);
const wName = (w: Wilaya | undefined) => (w ? (lang === "ar" ? w.nameAr : w.nameFr) : "");
const wLabel = (code: string) => `${code} ${wName(wilaya(code))}`;

// Old wilaya names under the 58-wilaya map, for "before" lines
function oldName(code: string): string {
  return wName(wilaya(code));
}

function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.title = t("title");
  document.querySelectorAll<HTMLElement>("[data-t]").forEach(el => (el.textContent = t(el.dataset.t as Key)));
  input.placeholder = t("placeholder");
  document.querySelectorAll<HTMLButtonElement>(".lang button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  renderNew();
  if (selected) show(selected, false);
}

// --- search box ---------------------------------------------------------

function suggest() {
  const q = input.value.trim();
  if (!q) return close();
  options = search(q, { limit: 8 }).map(r => r.commune);
  active = options.length ? 0 : -1;
  list.innerHTML = options.length
    ? options.map((c, i) => `<li role="option" id="opt-${i}" data-code="${c.code}" aria-selected="${i === active}"><span>${esc(cName(c))}</span><span class="w">${esc(wLabel(c.wilayaCode))}</span></li>`).join("")
    : `<li class="empty">${esc(t("noResult"))}</li>`;
  list.hidden = false;
  box.setAttribute("aria-expanded", "true");
}

function close() {
  list.hidden = true;
  box.setAttribute("aria-expanded", "false");
  active = -1;
}

function move(step: number) {
  if (!options.length) return;
  active = (active + step + options.length) % options.length;
  list.querySelectorAll("li").forEach((li, i) => li.setAttribute("aria-selected", String(i === active)));
  input.setAttribute("aria-activedescendant", `opt-${active}`);
}

input.addEventListener("input", suggest);
input.addEventListener("keydown", e => {
  if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
  else if (e.key === "Enter" && active >= 0 && options[active]) { e.preventDefault(); pick(options[active]!); }
  else if (e.key === "Escape") close();
});
list.addEventListener("mousedown", e => {
  const li = (e.target as Element).closest<HTMLLIElement>("li[data-code]");
  if (li) { e.preventDefault(); pick(commune(li.dataset.code!)!); }
});
input.addEventListener("blur", () => setTimeout(close, 100));

function pick(c: Commune) {
  input.value = cName(c);
  close();
  show(c, true);
}

// The daira is named after its seat commune; show that commune's name in the current language
function dairaName(c: Commune): string {
  if (lang === "fr") return c.daira1991!;
  const seat = communes().find(x => x.wilayaCode48 === c.wilayaCode48 && x.nameFr === c.daira1991);
  return seat ? seat.nameAr : c.daira1991!;
}

// --- result -------------------------------------------------------------

function show(c: Commune, scroll: boolean) {
  selected = c;
  const now = wilaya(c.wilayaCode)!;
  const m26 = moved2026.get(c.code);
  const m19 = moved2019.get(c.code);
  const name = esc(cName(c));
  const to = esc(wLabel(now.code));
  let head: string;
  let before = "";
  let source: string;
  if (m26) {
    head = t("moved2026", { commune: name, to });
    before = t("moved2026Before", { from: esc(`${m26.from} ${oldName(m26.from)}`) });
    source = t("source2026");
  } else if (m19) {
    head = t("moved2019", { commune: name, from: esc(`${m19.from} ${oldName(m19.from)}`), to });
    source = t("source2019");
  } else {
    head = t("same", { commune: name, to });
    source = t("sourceSame");
  }

  const url = new URL(location.href);
  url.search = "";
  url.searchParams.set("c", c.code);
  if (lang === "ar") url.searchParams.set("lang", "ar");
  history.replaceState(null, "", url);
  const shareText = `${t("shareText", { commune: cName(c), to: wLabel(now.code) })} ${url.href}`;

  result.className = `result${m26 || m19 ? " moved" : ""}`;
  result.innerHTML = `
    <h2>${head}</h2>
    ${before ? `<p class="before">${esc(before)}</p>` : ""}
    <dl class="facts">
      <div><dt>${esc(t("codeLabel"))}</dt><dd class="big">${now.code}</dd></div>
      <div><dt>${esc(t("wilayaLabel"))}</dt><dd>${esc(wName(now))}</dd></div>
      ${c.daira1991 ? `<div><dt>${esc(t("dairaLabel"))}</dt><dd>${esc(dairaName(c))}</dd></div>` : ""}
      <div><dt>ONS</dt><dd>${c.code}</dd></div>
    </dl>
    <p class="note">${esc(t("codeNote"))}</p>
    <p class="source"><strong>${esc(t("sourceLabel"))}:</strong> ${esc(source)}</p>
    <div class="actions">
      <a class="wa" href="https://wa.me/?text=${encodeURIComponent(shareText)}" target="_blank" rel="noopener">WhatsApp</a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url.href)}" target="_blank" rel="noopener">Facebook</a>
      <button type="button" id="copy">${esc(t("copy"))}</button>
    </div>`;
  result.hidden = false;
  $<HTMLButtonElement>("#copy").addEventListener("click", async e => {
    try { await navigator.clipboard.writeText(url.href); (e.target as HTMLButtonElement).textContent = t("copied"); } catch {}
  });
  highlight(now.code, m26?.from ?? m19?.from ?? null);
  if (scroll) result.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// --- map ----------------------------------------------------------------

const NS = "http://www.w3.org/2000/svg";

function drawMap(data: MapData) {
  map = data;
  svg.setAttribute("viewBox", data.viewBox);
  const g = document.createElementNS(NS, "g");
  for (const [code, d] of Object.entries(data.w69)) {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    p.dataset.code = code;
    if (+code >= 59) p.classList.add("fresh");
    const title = document.createElementNS(NS, "title");
    p.append(title);
    g.append(p);
  }
  const old = document.createElementNS(NS, "g");
  old.setAttribute("class", "old");
  svg.replaceChildren(g, old);
  labelMap();
  if (selected) show(selected, false);
}

function labelMap() {
  svg.querySelectorAll<SVGPathElement>("path[data-code]").forEach(p => {
    p.querySelector("title")!.textContent = wLabel(p.dataset.code!);
  });
}

function highlight(code: string, oldCode: string | null) {
  if (!map) return;
  svg.querySelectorAll("path.target").forEach(p => p.classList.remove("target"));
  svg.querySelector(`path[data-code="${code}"]`)?.classList.add("target");
  const old = svg.querySelector(".old")!;
  old.replaceChildren();
  if (oldCode && map.w58[oldCode]) {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", map.w58[oldCode]!);
    old.append(p);
  }
}

svg.addEventListener("click", e => {
  const code = (e.target as Element).closest<SVGPathElement>("path[data-code]")?.dataset.code;
  if (code) showWilaya(code);
});

function showWilaya(code: string) {
  const seat = communes(code).find(c => c.nameFr === wilaya(code)!.nameFr) ?? communes(code)[0];
  if (seat) pick(seat);
}

// --- new wilayas --------------------------------------------------------

function renderNew() {
  const items = wilayas().filter(w => +w.code >= 59);
  $<HTMLUListElement>("#new-wilayas").innerHTML = items
    .map(w => {
      const n = communes(w.code).length;
      const parents = [...new Set(communes(w.code).map(c => c.wilayaCode58))].map(oldName).join(", ");
      const count = t(n > 10 ? "communesMany" : "communes", { n });
      return `<li data-code="${w.code}"><div class="code">${w.code}</div><div class="name">${esc(wName(w))}</div><div class="meta">${esc(count)} &middot; ${esc(t("from", { parent: parents }))}</div></li>`;
    })
    .join("");
}

$<HTMLUListElement>("#new-wilayas").addEventListener("click", e => {
  const li = (e.target as Element).closest<HTMLLIElement>("li[data-code]");
  if (li) showWilaya(li.dataset.code!);
});

document.querySelectorAll<HTMLButtonElement>(".lang button").forEach(b =>
  b.addEventListener("click", () => {
    lang = b.dataset.lang as Lang;
    if (selected) input.value = cName(selected);
    applyLang();
    labelMap();
  }),
);

// --- start --------------------------------------------------------------

applyLang();
const start = new URLSearchParams(location.search).get("c");
const first = start ? commune(start) : undefined;
if (first) { input.value = cName(first); show(first, false); }
fetch("map.json").then(r => r.json()).then(drawMap).catch(() => {});
