// Display helpers for Arabic text.
//
// The Journal officiel prints a final ya as alif maqsura (for example sidi,
// wadi, bani), which reads as dated on screen. The data keeps the official
// spelling; the site shows the modern one. Words that really end in alif
// maqsura are left alone.

const KEEP = new Set([
  "\u0639\u064A\u0633\u0649", // Issa
  "\u0645\u0648\u0633\u0649", // Moussa
  "\u064A\u062D\u064A\u0649", // Yahia
  "\u0628\u0648\u064A\u062D\u064A\u0649", // Bouyahia
  "\u0645\u0635\u0637\u0641\u0649", // Mostefa
  "\u0627\u0644\u0645\u0631\u0633\u0649", // El Marsa
  "\u0645\u0631\u0633\u0649", // Marsa
  "\u0627\u0644\u0648\u0633\u0637\u0649", // centre
  "\u0627\u0644\u062F\u0641\u0644\u0649", // Defla
  "\u064A\u0628\u0642\u0649", // Yagout (as printed)
  "\u0633\u0644\u0645\u0649", // Salma
  "\u0627\u0644\u0644\u0649",
  "\u0627\u0644\u0632\u0648\u0649",
  "\u0623\u0628\u0649",
]);

// A few wilaya names kept their 1984 typography in decret 84-79.
const MODERN: Record<string, string> = {
  "\u0627\u0644\u0627\u063A\u0648\u0627\u0637": "\u0627\u0644\u0623\u063A\u0648\u0627\u0637",
  "\u0627\u064A\u0644\u064A\u0632\u0649": "\u0625\u0644\u064A\u0632\u064A",
};

export function modernArabic(text: string): string {
  if (MODERN[text]) return MODERN[text];
  return text
    .split(" ")
    .map(word => (word.endsWith("\u0649") && !KEEP.has(word) ? word.slice(0, -1) + "\u064A" : word))
    .join(" ");
}

// Law and decree numbers such as 26-06 or 26-206 flip inside right-to-left
// text. Isolate them so they always read left to right.
export function isolateNumbers(html: string): string {
  return html.replace(/\d+(?:[-/]\d+)+/g, m => `<bdi dir="ltr">${m}</bdi>`);
}
