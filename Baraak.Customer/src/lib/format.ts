/** Title-case with cuisine-aware small words kept lowercase (except first/last). */
export function titleCase(input: string) {
  if (!input) return input;
  const small = new Set(["and","or","the","a","an","of","for","to","in","on","with","by","at","from"]);
  const words = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g," ")
    .split(" ");
  return words.map((w, i) => {
    // keep acronyms & roman numerals
    if (/^[A-Z0-9]{2,}$/.test(input) || /^[ivx]+$/i.test(w)) return w.toUpperCase();
    if (i !== 0 && i !== words.length-1 && small.has(w)) return w;
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(" ");
}

export function currencyAED(v: number) {
  return `AED ${v.toFixed(2)}`;
}
