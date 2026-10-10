/*!
 * Boundaries derived from OpenStreetMap data published by geoBoundaries
 * (DZA ADM3 and ADM1). (c) OpenStreetMap contributors, CC BY-SA 2.0.
 * https://www.openstreetmap.org/copyright https://www.geoboundaries.org
 */
import shapes from "./generated/shapes.json";
import { commune, wilaya, type Commune, type Wilaya } from "./index.js";

/** [west, south, east, north] in degrees. */
export type Bounds = [number, number, number, number];

type Packed = [code: string, box: number[], rings: string[]];
type Shape = { code: string; box: number[]; packed: string[]; rings?: Int32Array[] };

const SCALE = shapes.scale;

function load(list: unknown): Shape[] {
  return (list as Packed[]).map(([code, box, packed]) => ({ code, box, packed }));
}

const COMMUNE_SHAPES = load(shapes.communes);
const WILAYA_SHAPES = load(shapes.wilayas);
const byCode = new Map([...COMMUNE_SHAPES, ...WILAYA_SHAPES].map(s => [s.code, s]));

function decode(shape: Shape): Int32Array[] {
  if (shape.rings) return shape.rings;
  shape.rings = shape.packed.map(ring => {
    const deltas = ring.split(",");
    const out = new Int32Array(deltas.length);
    let x = 0, y = 0;
    for (let i = 0; i < deltas.length; i += 2) {
      x += Number(deltas[i]);
      y += Number(deltas[i + 1]);
      out[i] = x;
      out[i + 1] = y;
    }
    return out;
  });
  return shape.rings;
}

// Even-odd rule over every ring of the shape, which handles islands and holes.
function contains(shape: Shape, x: number, y: number): boolean {
  const [w, s, e, n] = shape.box as [number, number, number, number];
  if (x < w || x > e || y < s || y > n) return false;
  let inside = false;
  for (const ring of decode(shape)) {
    const len = ring.length;
    for (let i = 0, j = len - 2; i < len; j = i, i += 2) {
      const xi = ring[i]!, yi = ring[i + 1]!, xj = ring[j]!, yj = ring[j + 1]!;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

function point(lat: number, lon: number): [number, number] {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new RangeError(`not a coordinate: ${lat}, ${lon}`);
  }
  return [lon * SCALE, lat * SCALE];
}

/**
 * The commune that contains a point, or undefined outside Algeria.
 *
 *   communeAt(35.6971, -0.6308)?.nameFr   // "Oran"
 *
 * Shapes are accurate to about 100 m, so a point very close to a boundary
 * can land in the neighbouring commune. Menaa (0506) has no shape in the
 * source data and is never returned.
 */
export function communeAt(lat: number, lon: number): Commune | undefined {
  const [x, y] = point(lat, lon);
  for (const s of COMMUNE_SHAPES) if (contains(s, x, y)) return commune(s.code);
  return undefined;
}

/**
 * The wilaya (69-wilaya map) that contains a point, or undefined outside
 * Algeria. Also covers the small gaps between commune shapes.
 */
export function wilayaAt(lat: number, lon: number): Wilaya | undefined {
  const c = communeAt(lat, lon);
  if (c) return wilaya(c.wilayaCode);
  const [x, y] = point(lat, lon);
  for (const s of WILAYA_SHAPES) if (contains(s, x, y)) return wilaya(s.code);
  return undefined;
}

/**
 * Bounding box of a commune (four-digit ONS code) or a wilaya (two-digit
 * code), for fitting a map to it.
 */
export function bounds(code: string | number): Bounds | undefined {
  const s = String(code).trim();
  const shape = byCode.get(s.length <= 2 ? s.padStart(2, "0") : s.padStart(4, "0"));
  if (!shape) return undefined;
  const [w, south, e, n] = shape.box as [number, number, number, number];
  return [w / SCALE, south / SCALE, e / SCALE, n / SCALE];
}
