import { describe, expect, it } from "vitest";
import { bounds, communeAt, wilayaAt } from "../src/geo.js";
import { communes } from "../src/index.js";

// City centres, [lat, lon].
const CITIES: [string, number, number, string, string][] = [
  ["Oran", 35.6971, -0.6308, "3101", "31"],
  ["Constantine", 36.365, 6.6147, "2501", "25"],
  ["Ghardaia", 32.49, 3.67, "4701", "47"],
  ["Tamanrasset", 22.785, 5.5228, "1101", "11"],
  ["Bou Saada", 35.2083, 4.1736, "2820", "68"],
];

describe("communeAt", () => {
  it("finds the commune and wilaya of city centres", () => {
    for (const [name, lat, lon, code, w] of CITIES) {
      expect(communeAt(lat, lon)?.code, name).toBe(code);
      expect(wilayaAt(lat, lon)?.code, name).toBe(w);
    }
  });

  it("returns nothing outside Algeria", () => {
    expect(communeAt(48.85, 2.35)).toBeUndefined(); // Paris
    expect(communeAt(36.8, 10.18)).toBeUndefined(); // Tunis
    expect(wilayaAt(37.5, 3)).toBeUndefined(); // at sea
  });

  it("rejects values that are not coordinates", () => {
    expect(() => communeAt(Number.NaN, 3)).toThrow(RangeError);
    expect(() => communeAt(91, 3)).toThrow(RangeError);
  });

  it("agrees with wilayaAt across the country", () => {
    // A fixed grid over Algeria rather than random points, so failures repeat.
    let checked = 0;
    for (let lat = 19; lat <= 37; lat += 0.25) {
      for (let lon = -8.5; lon <= 12; lon += 0.25) {
        const c = communeAt(lat, lon);
        if (!c) continue;
        expect(wilayaAt(lat, lon)?.code).toBe(c.wilayaCode);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(3000);
  });
});

describe("bounds", () => {
  it("gives the box of a wilaya or a commune", () => {
    const [w, s, e, n] = bounds(16)!;
    expect(w).toBeLessThan(e);
    expect(s).toBeLessThan(n);
    const c = bounds("1601")!;
    expect(c[0]).toBeGreaterThanOrEqual(w);
    expect(c[2]).toBeLessThanOrEqual(e);
  });

  it("covers every commune but Menaa", () => {
    const missing = communes().filter(c => !bounds(c.code)).map(c => c.code);
    expect(missing).toEqual(["0506"]);
    expect(bounds("99")).toBeUndefined();
  });
});
