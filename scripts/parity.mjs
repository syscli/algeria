// Writes python/tests/parity.json: what the npm package answers for every
// commune name and for a set of searches, so the Python port can be compared.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { communes, normalize, search } from "../dist/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const names = new Set();
for (const c of communes()) for (const n of [c.nameFr, c.nameAr, ...c.aliases]) names.add(n);

// Every 24th commune name, cut and misspelled, plus known hard cases.
const queries = new Set(["bou saada", "Bains Romains", "tamanghaset", "sidi", "el", "oued", "ain", "beni", "Tlemsen", "constantinr", "setif"]);
communes().forEach((c, i) => {
  if (i % 24) return;
  queries.add(c.nameFr).add(c.nameAr).add(c.nameFr.slice(0, 4)).add(c.nameFr.slice(0, -1) + "x");
});

const round = n => Math.round(n * 1e6) / 1e6;
const out = {
  normalize: [...names].map(n => [n, normalize(n)]),
  search: [...queries].map(q => [q, search(q, { limit: 5 }).map(r => [r.commune.code, round(r.score)])]),
};
const file = path.join(root, "python", "tests", "parity.json");
fs.writeFileSync(file, JSON.stringify(out));
console.log(`${out.normalize.length} names, ${out.search.length} searches`);
