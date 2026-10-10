// Folds the many ways a place name gets written into one comparable key.
// Latin: case, accents, apostrophes, spacing and common transliteration
// variants. Arabic: harakat, tatweel, alef and ya forms, ta marbuta.

const LATIN: Array<[RegExp, string]> = [
  [/\b(el|al|les?|la)\b/g, " "],
  [/\bbeni\b|\bbni\b/g, "bn"],
  [/\bain\b/g, "an"],
  [/dj/g, "j"],
  [/ou/g, "u"],
  [/ch|sh/g, "c"],
  [/kh/g, "k"],
  [/gh/g, "g"],
  [/th/g, "t"],
  [/dh/g, "d"],
  [/q/g, "k"],
  [/y/g, "i"],
  [/e/g, "a"],
  [/([a-z])\1+/g, "$1"],
];

const ARABIC: Array<[RegExp, string]> = [
  [/[\u064B-\u065F\u0670\u0640]/g, ""],
  [/[\u0622\u0623\u0625\u0671]/g, "\u0627"],
  [/\u0649/g, "\u064A"],
  [/\u0629/g, "\u0647"],
  [/\u0624/g, "\u0648"],
  [/\u0626/g, "\u064A"],
  [/(^|\s)\u0627\u0644/g, "$1"],
];

export function normalize(text: string): string {
  let s = text.normalize("NFKD").toLowerCase();
  if (/[\u0600-\u06FF]/.test(s)) {
    for (const [re, to] of ARABIC) s = s.replace(re, to);
    return s.replace(/[^\u0600-\u06FF]/g, "");
  }
  s = s.replace(/[\u0300-\u036F]/g, "").replace(/[^a-z]+/g, " ").trim();
  for (const [re, to] of LATIN) s = s.replace(re, to);
  return s.replace(/\s+/g, "");
}

export function distance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 3) return 99;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length]!;
}
