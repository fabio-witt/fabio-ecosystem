// Switches the explanation language of the courses between German and English.
import { DE, EN, ES, FR } from "./courses1.js";
import { RU, PL, GSW, IT, GA } from "./courses2.js";
import DICT from "./en_dict.js";
const SWITCHABLE = [ES, FR, RU, PL, GSW, IT, GA];
const KEEP = { fr: { du: 1, des: 1 }, es: { es: 1 }, pl: { ja: 1 }, it: { da: 1, di: 1, in: 1 } };
const ORIG = new WeakMap();
const set = (o, k, lang, cid) => {
  if (o == null || o[k] == null) return;
  let m = ORIG.get(o); if (!m) { m = {}; ORIG.set(o, m); }
  if (!(k in m)) m[k] = o[k];
  const src = m[k];
  o[k] = lang === "en" && !(KEEP[cid] && KEEP[cid][src]) && DICT[src] ? DICT[src] : src;
};
// Target-language material of a course, used so that answers in the language being learned are never translated.
const CORPUS = {};
const nrm = s => String(s).toLowerCase().replace(/\*\*/g, "").replace(/[¿?¡!.,;:«»"“”„()]/g, " ").replace(/\s+/g, " ").trim();
function corpus(c) {
  if (CORPUS[c.id]) return CORPUS[c.id];
  const parts = [];
  c.units.forEach(u => { if (u.reading) parts.push(u.reading.text); [...u.lessons, ...(u.reading ? [u.reading] : [])].forEach(l => { (l.examples || []).forEach(x => parts.push(x[0])); (l.ex || []).forEach(e => { if (e.accept) parts.push(...e.accept); if (e.type === "build") parts.push(e.answer, ...(e.extra || [])); const pr = (ORIG.get(e) || {}).prompt || e.prompt; if (pr && pr.includes("___")) parts.push(pr.replace(/\([^)]*\)/g, " ")); }); }); });
  const text = " " + parts.map(nrm).join(" | ") + " ";
  return (CORPUS[c.id] = { text, toks: new Set(text.split(/[\s|]+/)) });
}
const inCorpus = (c, s) => { const k = corpus(c), n = nrm(s); if (!n) return false; if (k.text.includes(" " + n + " ")) return true; const t = n.split(" "); return t.length <= 3 && t.every(x => k.toks.has(x)); };
const orig = (o, k) => { const m = ORIG.get(o); return m && k in m ? m[k] : o[k]; };
const exs = (list, lang, c) => (list || []).forEach(e => {
  const cid = c.id;
  const blank = String(orig(e, "prompt") || "").includes("___");
  set(e, "prompt", lang, cid); set(e, "explain", lang, cid);
  // Options that fill a blank in a target-language sentence are answers in that language: never translate them.
  if (e.options && !blank) e.options.forEach((_, i) => set(e.options, i, lang, cid));
  if (e.pairs) {
    // Find which side of the pairs holds the language being learned; only the other side is translated.
    const score = k => e.pairs.filter(p => inCorpus(c, orig(p, k))).length;
    const s0 = score(0), s1 = score(1), n = e.pairs.length;
    if (!(s0 === n && s1 === n)) { const tgt = s1 > s0 ? 1 : 0; e.pairs.forEach(p => set(p, 1 - tgt, lang, cid)); }
  }
});
export function applyLang(lang) {
  SWITCHABLE.forEach(c => corpus(c));
  SWITCHABLE.forEach(c => {
    const cid = c.id;
    c.explain = lang === "en" ? "en" : "de";
    set(c, "name", lang, cid); set(c, "tagline", lang, cid);
    c.units.forEach(u => {
      set(u, "title", lang, cid);
      if (u.reading) { set(u.reading, "title", lang, cid); set(u.reading, "tr", lang, cid); exs(u.reading.ex, lang, c); }
      u.lessons.forEach(l => {
        ["title", "rule", "structure", "tip", "more"].forEach(k => set(l, k, lang, cid));
        (l.examples || []).forEach(ex => set(ex, 1, lang, cid));
        if (l.table) {
          l.table.head.forEach((_, i) => set(l.table.head, i, lang, cid));
          const m = ORIG.get(l.table.head) || {}; const heads = l.table.head.map((h, i) => (i in m ? m[i] : h));
          const skip = heads.map(h => /Hochdeutsch|Züridütsch|Partizip|Infinitiv|Perfekt|Verkleinerung|Grundwort|Komparativ|Superlativ|indirekt|normal/.test(h));
          l.table.rows.forEach(r => r.forEach((_, i) => { if (!skip[i]) set(r, i, lang, cid); }));
        }
        exs(l.ex, lang, c);
      });
    });
  });
}
export const NAME_EN = { de: "German", en: "English" };
