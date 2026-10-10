// Builds public/: the "Ma nouvelle wilaya" page, the static JSON API and the
// download files. Needs the package built first (npm run build).

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const pkg = require(path.join(root, "dist", "index.cjs"));
const version = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;

const pub = path.join(root, "public");
fs.rmSync(pub, { recursive: true, force: true });
const put = (rel, body) => {
  const file = path.join(pub, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof body === "string" ? body : JSON.stringify(body));
};

// --- API ---------------------------------------------------------------

const W = pkg.wilayas();
const C = pkg.communes();
const communeJson = c => ({
  code: c.code,
  wilaya_code: c.wilayaCode,
  name_fr: c.nameFr,
  name_ar: c.nameAr,
  daira_1991: c.daira1991,
  wilaya_code_58: c.wilayaCode58,
  wilaya_code_48: c.wilayaCode48,
  aliases: c.aliases,
});
const wilayaJson = w => ({ code: w.code, name_fr: w.nameFr, name_ar: w.nameAr, created_by: w.createdBy, communes: pkg.communes(w.code).length });

put("api/v1/index.json", {
  version,
  wilayas: "/api/v1/wilayas.json",
  wilaya: "/api/v1/wilayas/{code}.json",
  communes: "/api/v1/communes.json",
  commune: "/api/v1/communes/{code}.json",
  changes: ["/api/v1/changes/2026.json", "/api/v1/changes/2019.json"],
  source: "https://github.com/syscli/algeria",
});
put("api/v1/wilayas.json", W.map(wilayaJson));
put("api/v1/communes.json", C.map(communeJson));
for (const w of W) put(`api/v1/wilayas/${w.code}.json`, { ...wilayaJson(w), communes: pkg.communes(w.code).map(communeJson) });
for (const c of C) put(`api/v1/communes/${c.code}.json`, communeJson(c));
for (const year of [2019, 2026]) {
  put(`api/v1/changes/${year}.json`, pkg.changes(year).map(m => ({ code: m.commune.code, name_fr: m.commune.nameFr, name_ar: m.commune.nameAr, from: m.from, to: m.to })));
}

// --- downloads ---------------------------------------------------------

put("downloads/algeria.json", { version, wilayas: W.map(wilayaJson), communes: C.map(communeJson) });
fs.copyFileSync(path.join(root, "data", "wilayas.csv"), path.join(pub, "downloads", "wilayas.csv"));
fs.copyFileSync(path.join(root, "data", "communes.csv"), path.join(pub, "downloads", "communes.csv"));

const sq = v => (v == null || v === "" ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const sql = [
  "-- Algeria: 69 wilayas and 1541 communes. https://github.com/syscli/algeria",
  `-- Version ${version}. Plain SQL for MySQL, PostgreSQL and SQLite.`,
  "",
  "CREATE TABLE wilayas (",
  "  code CHAR(2) PRIMARY KEY,",
  "  name_fr VARCHAR(64) NOT NULL,",
  "  name_ar VARCHAR(64) NOT NULL,",
  "  created_by VARCHAR(16) NOT NULL",
  ");",
  "",
  "CREATE TABLE communes (",
  "  code CHAR(4) PRIMARY KEY,",
  "  wilaya_code CHAR(2) NOT NULL REFERENCES wilayas(code),",
  "  name_fr VARCHAR(64) NOT NULL,",
  "  name_ar VARCHAR(64) NOT NULL,",
  "  daira_1991 VARCHAR(64),",
  "  wilaya_code_58 CHAR(2) NOT NULL,",
  "  wilaya_code_48 CHAR(2) NOT NULL",
  ");",
  "",
  ...W.map(w => `INSERT INTO wilayas VALUES (${[w.code, w.nameFr, w.nameAr, w.createdBy].map(sq).join(", ")});`),
  "",
  ...C.map(c => `INSERT INTO communes VALUES (${[c.code, c.wilayaCode, c.nameFr, c.nameAr, c.daira1991, c.wilayaCode58, c.wilayaCode48].map(sq).join(", ")});`),
  "",
].join("\n");
put("downloads/algeria.sql", sql);

for (const f of ["communes.geojson", "wilayas-69.geojson", "wilayas-58.geojson", "wilayas-48.geojson"]) {
  fs.copyFileSync(path.join(root, "geo", f), path.join(pub, "downloads", f));
}

// --- map ---------------------------------------------------------------

const tmp = path.join(root, "geo", ".cache", "map.svg");
execFileSync(process.execPath, [
  require.resolve("mapshaper/bin/mapshaper"),
  "-i", path.join(root, "geo", "wilayas-69.geojson"), path.join(root, "geo", "wilayas-58.geojson"), "combine-files",
  "-proj", "merc", "target=*",
  "-simplify", "4%", "keep-shapes", "target=*",
  "-o", tmp, "format=svg", "id-field=code", "target=*",
], { stdio: ["ignore", "ignore", "inherit"] });
const svg = fs.readFileSync(tmp, "utf8");
const layer = name => {
  const g = svg.match(new RegExp(`<g id="${name}"[^>]*>([\\s\\S]*?)</g>`))[1];
  return Object.fromEntries([...g.matchAll(/<path d="([^"]+)" id="(\d+)"\/>/g)].map(m => [m[2].padStart(2, "0"), m[1].replace(/(\d+\.\d)\d+/g, "$1")]));
};
const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
put("map.json", { viewBox, w69: layer("wilayas-69"), w58: layer("wilayas-58") });

// --- page --------------------------------------------------------------

for (const f of ["index.html", "style.css", "favicon.svg"]) fs.copyFileSync(path.join(root, "site", f), path.join(pub, f));
await build({
  entryPoints: [path.join(root, "site", "app.ts")],
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2020",
  outfile: path.join(pub, "app.js"),
  loader: { ".json": "json" },
});
put(".nojekyll", "");
console.log(`public/ built: ${W.length} wilayas, ${C.length} communes`);
