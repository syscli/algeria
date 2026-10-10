import { describe, expect, it } from "vitest";
import { changes, commune, communes, normalize, search, wilaya, wilayas } from "../src/index.js";

describe("data", () => {
  it("has 69 wilayas and 1541 communes", () => {
    expect(wilayas()).toHaveLength(69);
    expect(communes()).toHaveLength(1541);
  });

  it("has unique commune codes", () => {
    expect(new Set(communes().map(c => c.code)).size).toBe(1541);
  });

  it("matches the commune counts of loi 26-06 for rewritten wilayas", () => {
    const declared: Record<string, number> = {
      "03": 12, "05": 53, "07": 22, "12": 24, "13": 49, "14": 36, "17": 18, "26": 43, "28": 24, "32": 15,
      "59": 12, "60": 8, "61": 5, "62": 4, "63": 4, "64": 6, "65": 10, "66": 8, "67": 21, "68": 23, "69": 7,
    };
    for (const [code, n] of Object.entries(declared)) expect(communes(code), code).toHaveLength(n);
  });

  it("keeps Algiers at 57 communes after ordonnance 97-14", () => {
    expect(communes(16)).toHaveLength(57);
  });

  it("uses the names and numbers of decret presidentiel 26-206", () => {
    expect(wilaya(59)?.nameFr).toBe("Aflou");
    expect(wilaya(65)?.nameFr).toBe("Aïn Ouessara");
    expect(wilaya(69)?.nameFr).toBe("El Abiodh Sidi Cheikh");
    expect(wilaya("68")?.createdBy).toBe("loi 26-06");
  });
});

describe("lookup", () => {
  it("finds a wilaya by code or name", () => {
    expect(wilaya("5")?.nameFr).toBe("Batna");
    expect(wilaya("Setif")?.code).toBe("19");
    expect(wilaya("سطيف")?.code).toBe("19");
    expect(wilaya(70)).toBeUndefined();
  });

  it("finds a commune by ONS code", () => {
    expect(commune("1601")?.wilayaCode).toBe("16");
    expect(commune(1601)?.code).toBe("1601");
    expect(commune("9999")).toBeUndefined();
  });
});

describe("search", () => {
  it("matches French, Arabic and loose spellings", () => {
    expect(search("Bou Saada")[0]?.commune.code).toBe(search("bousaada")[0]?.commune.code);
    expect(search("بوسعادة")[0]?.wilaya.code).toBe("68");
    expect(search("Ghardaia")[0]?.commune.nameFr).toBe("Ghardaïa");
  });

  it("finds communes by their old official names", () => {
    expect(search("Bains Romains")[0]?.commune.nameFr).toBe("Hammamet");
    expect(search("Hamma Anassers")[0]?.commune.wilayaCode).toBe("16");
  });

  it("tolerates a small typo", () => {
    expect(search("Tamanghaset")[0]?.commune.code).toBe("1101");
  });

  it("can be limited to one wilaya", () => {
    const all = search("Sidi");
    const one = search("Sidi", { wilaya: 22, limit: 50 });
    expect(one.length).toBeGreaterThan(0);
    expect(one.every(r => r.wilaya.code === "22")).toBe(true);
    expect(all.length).toBeLessThanOrEqual(10);
  });

  it("returns nothing for an empty query", () => {
    expect(search("  ")).toEqual([]);
  });
});

describe("changes", () => {
  it("lists communes moved by the 2026 reform", () => {
    const moved = changes(2026);
    expect(moved.length).toBe(108);
    const bouSaada = moved.find(m => m.commune.nameFr === "Bou Saada");
    expect(bouSaada).toMatchObject({ from: "28", to: "68" });
  });

  it("lists communes moved by the 2019 reform", () => {
    const moved = changes(2019);
    expect(moved.length).toBe(60);
    expect(moved.every(m => +m.to >= 49 && +m.to <= 58)).toBe(true);
  });
});

describe("normalize", () => {
  it("folds accents, articles and transliteration variants", () => {
    expect(normalize("Aïn Témouchent")).toBe(normalize("ain temouchent"));
    expect(normalize("Djelfa")).toBe(normalize("Jelfa"));
    expect(normalize("El Oued")).toBe(normalize("Oued"));
  });

  it("folds Arabic letter variants", () => {
    expect(normalize("الأغواط")).toBe(normalize("الاغواط"));
    expect(normalize("سيدى بلعباس")).toBe(normalize("سيدي بلعباس"));
  });
});
