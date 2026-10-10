// Builds geo/*.geojson from open boundary data and data/communes.csv.
//
// Inputs (downloaded into geo/.cache, not committed):
//   geoBoundaries DZA ADM3 (communes, from OpenStreetMap, CC BY-SA 2.0)
//   geoBoundaries DZA ADM1 (the 48 wilayas, ODbL), used only to place each
//     commune shape in its pre-2019 wilaya before matching names
//   GeoNames DZ dump (CC BY 4.0), used to name shapes that come unnamed
//
// Each commune shape is matched to an ONS code by name within its pre-2019
// wilaya. Wilaya shapes for the 69, 58 and 48 wilaya maps are then made by
// merging commune shapes according to data/communes.csv.
//
// Needs the package built first (npm run build) and network access.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { communes, commune, normalize } = require(path.join(root, "dist", "index.cjs"));

const cache = path.join(root, "geo", ".cache");
const out = path.join(root, "geo");
fs.mkdirSync(cache, { recursive: true });

const GB = "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/DZA";
const inputs = {
  adm3: `${GB}/ADM3/geoBoundaries-DZA-ADM3_simplified.geojson`,
  adm1: `${GB}/ADM1/geoBoundaries-DZA-ADM1_simplified.geojson`,
  geonames: "https://download.geonames.org/export/dump/DZ.zip",
};

function fetchTo(url, file) {
  if (fs.existsSync(file) && fs.statSync(file).size > 0) return;
  for (let i = 0; i < 5; i++) {
    try {
      execFileSync("curl", ["-sSL", "-m", "300", "-o", file, url], { stdio: "inherit" });
      if (fs.statSync(file).size > 0) return;
    } catch {}
  }
  throw new Error(`could not download ${url}`);
}

function mapshaper(args) {
  execFileSync(process.execPath, [require.resolve("mapshaper/bin/mapshaper"), ...args], { stdio: ["ignore", "ignore", "inherit"] });
}

const read = f => JSON.parse(fs.readFileSync(f, "utf8"));
const c = f => path.join(cache, f);

fetchTo(inputs.adm3, c("adm3.geojson"));
fetchTo(inputs.adm1, c("adm1.geojson"));
fetchTo(inputs.geonames, c("DZ.zip"));
if (!fs.existsSync(c("DZ.txt"))) execFileSync("unzip", ["-o", "-q", c("DZ.zip"), "DZ.txt", "-d", cache]);

// GeoNames commune points, used to name shapes
const gn = fs.readFileSync(c("DZ.txt"), "utf8").split("\n").map(l => l.split("\t")).filter(r => r[6] === "A" && r[7] === "ADM3");
fs.writeFileSync(c("gn.geojson"), JSON.stringify({
  type: "FeatureCollection",
  features: gn.map(r => ({
    type: "Feature",
    properties: { gn: r[1].replace(/^Commune (de |du |des |d')?/i, "") },
    geometry: { type: "Point", coordinates: [+r[5], +r[4]] },
  })),
}));

// pre-2019 wilaya of each shape, from an interior point
const adm1 = read(c("adm1.geojson"));
for (const f of adm1.features) f.properties = { w48: f.properties.shapeISO.slice(3) };
fs.writeFileSync(c("adm1w.geojson"), JSON.stringify(adm1));
mapshaper([c("adm3.geojson"), "-join", c("gn.geojson"), "calc=gn=collect(gn)", "-o", c("named.geojson"), "format=geojson"]);
mapshaper([c("named.geojson"), "-points", "inner", "-join", c("adm1w.geojson"), "fields=w48", "-o", c("points.geojson"), "format=geojson"]);

const shapes = read(c("adm3.geojson")).features;
const points = read(c("points.geojson")).features.map((f, i) => ({
  i,
  w: f.properties.w48,
  keys: [f.properties.shapeName, ...(f.properties.gn || [])].filter(Boolean).map(n => normalize(n.replace(/^d\W+/, ""))),
}));

function lev(a, b) {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let p = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1));
      p = t;
    }
  }
  return d[b.length];
}

const codeOf = new Map();
for (const w of new Set(points.map(p => p.w))) {
  const P = points.filter(p => p.w === w);
  const free = new Set(communes().filter(x => x.wilayaCode48 === w).map(x => ({ x, keys: [x.nameFr, ...x.aliases].map(normalize) })));
  for (const fuzzy of [false, true]) {
    for (const p of P) {
      if (codeOf.has(p.i)) continue;
      const scored = [...free]
        .map(f => ({ f, d: Math.min(...f.keys.flatMap(k => p.keys.map(q => (fuzzy ? lev(q, k) / Math.max(q.length, k.length) : q === k ? 0 : 9)))) }))
        .sort((a, b) => a.d - b.d);
      const [first, second] = scored;
      const ok = fuzzy
        ? first && first.d <= 0.34 && (!second || second.d - first.d >= 0.08)
        : first?.d === 0 && second?.d !== 0;
      if (ok) {
        codeOf.set(p.i, first.f.x.code);
        free.delete(first.f);
      }
    }
  }
  const leftP = P.filter(p => !codeOf.has(p.i));
  if (leftP.length === 1 && free.size === 1) codeOf.set(leftP[0].i, [...free][0].x.code);
  else if (leftP.length) throw new Error(`wilaya ${w}: ${leftP.length} shapes left unmatched`);
}

const coded = {
  type: "FeatureCollection",
  features: shapes.map((f, i) => {
    const x = commune(codeOf.get(i));
    return {
      type: "Feature",
      properties: { code: x.code, wilaya: x.wilayaCode, wilaya58: x.wilayaCode58, wilaya48: x.wilayaCode48, name_fr: x.nameFr, name_ar: x.nameAr },
      geometry: f.geometry,
    };
  }),
};
fs.writeFileSync(path.join(out, "communes.geojson"), JSON.stringify(coded));

for (const [field, n] of [["wilaya", 69], ["wilaya58", 58], ["wilaya48", 48]]) {
  const file = path.join(out, `wilayas-${n}.geojson`);
  mapshaper([path.join(out, "communes.geojson"), "-dissolve2", field, "-clean", "-each", `code=${field}`, "-filter-fields", "code", "-o", file, "format=geojson", "precision=0.00001"]);
  const j = read(file);
  if (j.features.length !== n) throw new Error(`expected ${n} wilaya shapes, got ${j.features.length}`);
}
const missing = communes().length - codeOf.size;
console.log(`${codeOf.size} commune shapes matched, ${missing} commune(s) without a shape in the source`);
