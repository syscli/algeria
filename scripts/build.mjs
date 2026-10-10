// Reads data/*.csv, checks it, and writes src/generated/data.json for the package.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

function read(name) {
  return parseCsv(fs.readFileSync(path.join(root, "data", name), "utf8").replace(/^\uFEFF/, ""));
}

function check(cond, msg) {
  if (!cond) throw new Error(`data check failed: ${msg}`);
}

export function load() {
  const wilayas = read("wilayas.csv");
  const communes = read("communes.csv");

  check(wilayas.length === 69, `expected 69 wilayas, got ${wilayas.length}`);
  check(communes.length === 1541, `expected 1541 communes, got ${communes.length}`);
  wilayas.forEach((w, i) => check(w.code === String(i + 1).padStart(2, "0"), `wilaya codes must run 01..69, found ${w.code}`));

  const codes = new Set();
  const wcodes = new Set(wilayas.map(w => w.code));
  for (const c of communes) {
    check(/^\d{4}$/.test(c.code), `bad commune code ${c.code}`);
    check(!codes.has(c.code), `duplicate commune code ${c.code}`);
    codes.add(c.code);
    check(wcodes.has(c.wilaya_code), `${c.code} points to unknown wilaya ${c.wilaya_code}`);
    check(+c.wilaya_code_58 <= 58 && +c.wilaya_code_48 <= 48, `${c.code} has a bad historical wilaya`);
    check(c.name_fr && c.name_ar, `${c.code} is missing a name`);
  }
  for (const w of wilayas) {
    const n = communes.filter(c => c.wilaya_code === w.code).length;
    check(n === +w.communes, `wilaya ${w.code} declares ${w.communes} communes, data has ${n}`);
  }
  check(new Set(communes.map(c => c.wilaya_code_58)).size === 58, "the 58-wilaya map must use 58 codes");
  check(new Set(communes.map(c => c.wilaya_code_48)).size === 48, "the 48-wilaya map must use 48 codes");
  return { wilayas, communes };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { wilayas, communes } = load();
  const out = {
    wilayas: wilayas.map(w => [w.code, w.name_fr, w.name_ar, w.created_by]),
    communes: communes.map(c => [c.code, c.wilaya_code, c.name_fr, c.name_ar, c.daira_1991, c.wilaya_code_58, c.wilaya_code_48, c.aliases]),
  };
  fs.mkdirSync(path.join(root, "src", "generated"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "generated", "data.json"), JSON.stringify(out));
  console.log(`${wilayas.length} wilayas, ${communes.length} communes`);
}
