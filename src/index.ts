import data from "./generated/data.json";
import { normalize, distance } from "./normalize.js";

export { normalize } from "./normalize.js";

export interface Wilaya {
  /** Two-digit code, "01" to "69". Also the vehicle plate number. */
  code: string;
  nameFr: string;
  nameAr: string;
  /** The law that created the wilaya: "loi 84-09", "loi 19-12" or "loi 26-06". */
  createdBy: string;
}

export interface Commune {
  /** Four-digit ONS code, e.g. "1601". */
  code: string;
  wilayaCode: string;
  nameFr: string;
  nameAr: string;
  /** Seat of the daira the commune belonged to in decret 91-306 (1991). */
  daira1991: string | null;
  /** Wilaya under the 58-wilaya map (2019 to 2026). */
  wilayaCode58: string;
  /** Wilaya under the 48-wilaya map (1984 to 2019). */
  wilayaCode48: string;
  /** Older official names and other common spellings. */
  aliases: readonly string[];
}

export interface SearchResult {
  commune: Commune;
  wilaya: Wilaya;
  /** 0 is an exact match; higher is a weaker match. */
  score: number;
}

export interface WilayaChange {
  commune: Commune;
  from: string;
  to: string;
}

type Raw = { wilayas: string[][]; communes: string[][] };
const raw = data as Raw;

const WILAYAS: readonly Wilaya[] = Object.freeze(
  raw.wilayas.map(([code, nameFr, nameAr, createdBy]) => Object.freeze({ code: code!, nameFr: nameFr!, nameAr: nameAr!, createdBy: createdBy! })),
);

const COMMUNES: readonly Commune[] = Object.freeze(
  raw.communes.map(([code, wilayaCode, nameFr, nameAr, daira, w58, w48, aliases]) =>
    Object.freeze({
      code: code!,
      wilayaCode: wilayaCode!,
      nameFr: nameFr!,
      nameAr: nameAr!,
      daira1991: daira || null,
      wilayaCode58: w58!,
      wilayaCode48: w48!,
      aliases: Object.freeze(aliases ? aliases.split("|") : []),
    }),
  ),
);

const byWilaya = new Map(WILAYAS.map(w => [w.code, w]));
const byCommune = new Map(COMMUNES.map(c => [c.code, c]));

const index = COMMUNES.map(c => ({
  commune: c,
  keys: [...new Set([c.nameFr, c.nameAr, ...c.aliases].map(normalize).filter(Boolean))],
}));

function code(value: string | number, width: number): string {
  return String(value).trim().padStart(width, "0");
}

/** All 69 wilayas, ordered by code. */
export function wilayas(): readonly Wilaya[] {
  return WILAYAS;
}

/** A wilaya by code (5, "05") or by name in French or Arabic. */
export function wilaya(query: string | number): Wilaya | undefined {
  if (typeof query === "number" || /^\d{1,2}$/.test(query.trim())) return byWilaya.get(code(query, 2));
  const q = normalize(query);
  return WILAYAS.find(w => normalize(w.nameFr) === q || normalize(w.nameAr) === q);
}

/** All communes, or the communes of one wilaya. */
export function communes(wilayaCode?: string | number): readonly Commune[] {
  if (wilayaCode === undefined) return COMMUNES;
  const w = code(wilayaCode, 2);
  return COMMUNES.filter(c => c.wilayaCode === w);
}

/** A commune by its four-digit ONS code. */
export function commune(onsCode: string | number): Commune | undefined {
  return byCommune.get(code(onsCode, 4));
}

/**
 * Finds communes by name. Accepts French, Arabic, old official names and
 * loose spellings ("setif" finds Setif with or without the accent), and
 * tolerates small typos.
 */
export function search(query: string, options: { limit?: number; wilaya?: string | number } = {}): SearchResult[] {
  const q = normalize(query);
  if (!q) return [];
  const limit = options.limit ?? 10;
  const only = options.wilaya === undefined ? undefined : code(options.wilaya, 2);
  const results: SearchResult[] = [];
  for (const { commune: c, keys } of index) {
    if (only && c.wilayaCode !== only) continue;
    let best = Infinity;
    for (const k of keys) {
      let s: number;
      if (k === q) s = 0;
      else if (k.startsWith(q)) s = 1 + (k.length - q.length) / 100;
      else if (k.includes(q)) s = 2 + (k.length - q.length) / 100;
      else {
        const d = distance(q, k);
        s = q.length >= 4 && d <= Math.max(1, Math.floor(q.length / 4)) ? 3 + d : Infinity;
      }
      if (s < best) best = s;
    }
    if (best !== Infinity) results.push({ commune: c, wilaya: byWilaya.get(c.wilayaCode)!, score: best });
  }
  return results.sort((a, b) => a.score - b.score || a.commune.code.localeCompare(b.commune.code)).slice(0, limit);
}

/**
 * Communes whose wilaya changed with a reform: 2026 (58 to 69 wilayas)
 * or 2019 (48 to 58 wilayas).
 */
export function changes(reform: 2019 | 2026 = 2026): WilayaChange[] {
  return COMMUNES.flatMap(c => {
    const [from, to] = reform === 2026 ? [c.wilayaCode58, c.wilayaCode] : [c.wilayaCode48, c.wilayaCode58];
    return from === to ? [] : [{ commune: c, from, to }];
  });
}
