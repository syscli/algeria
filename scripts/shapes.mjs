// Packs geo/communes.geojson and geo/wilayas-69.geojson into
// src/generated/shapes.json for point lookups in the "geo" entry.
//
// Coordinates are rounded to 1e-4 degree (about 11 m) and stored as integer
// deltas, one string per ring: "x0,y0,dx1,dy1,...". Each shape keeps its
// bounding box so most shapes can be skipped without decoding a ring.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SCALE = 1e4;

function rings(geometry) {
  const polys = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polys.flat();
}

function pack(geometry) {
  const box = [Infinity, Infinity, -Infinity, -Infinity];
  const out = [];
  for (const ring of rings(geometry)) {
    const parts = [];
    let px = 0, py = 0;
    for (const [lon, lat] of ring) {
      const x = Math.round(lon * SCALE), y = Math.round(lat * SCALE);
      if (parts.length && x === px && y === py) continue;
      parts.push(x - px, y - py);
      px = x; py = y;
      if (x < box[0]) box[0] = x;
      if (y < box[1]) box[1] = y;
      if (x > box[2]) box[2] = x;
      if (y > box[3]) box[3] = y;
    }
    if (parts.length >= 6) out.push(parts.join(","));
  }
  return [box, out];
}

function read(name) {
  return JSON.parse(fs.readFileSync(path.join(root, "geo", name), "utf8")).features;
}

export function build() {
  const communes = read("communes.geojson").map(f => [f.properties.code, ...pack(f.geometry)]);
  const wilayas = read("wilayas-69.geojson").map(f => [f.properties.code, ...pack(f.geometry)]);
  communes.sort((a, b) => a[0].localeCompare(b[0]));
  wilayas.sort((a, b) => a[0].localeCompare(b[0]));
  return { scale: SCALE, communes, wilayas };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = build();
  const file = path.join(root, "src", "generated", "shapes.json");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(out));
  console.log(`${out.communes.length} commune shapes, ${out.wilayas.length} wilaya shapes, ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}
