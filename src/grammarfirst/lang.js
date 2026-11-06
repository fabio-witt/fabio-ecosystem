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
const exs = (list, lang, cid) => (list || []).forEach(e => {
  set(e, "prompt", lang, cid); set(e, "explain", lang, cid);
  if (e.options) { e.options.forEach((_, i) => set(e.options, i, lang, cid)); }
  if (e.pairs) e.pairs.forEach(p => { set(p, 0, lang, cid); set(p, 1, lang, cid); });
});
export function applyLang(lang) {
  SWITCHABLE.forEach(c => {
    const cid = c.id;
    c.explain = lang === "en" ? "en" : "de";
    set(c, "name", lang, cid); set(c, "tagline", lang, cid);
    c.units.forEach(u => {
      set(u, "title", lang, cid);
      if (u.reading) { set(u.reading, "title", lang, cid); set(u.reading, "tr", lang, cid); exs(u.reading.ex, lang, cid); }
      u.lessons.forEach(l => {
        ["title", "rule", "structure", "tip", "more"].forEach(k => set(l, k, lang, cid));
        (l.examples || []).forEach(ex => set(ex, 1, lang, cid));
        if (l.table) {
          l.table.head.forEach((_, i) => set(l.table.head, i, lang, cid));
          const m = ORIG.get(l.table.head) || {}; const heads = l.table.head.map((h, i) => (i in m ? m[i] : h));
          const skip = heads.map(h => /Hochdeutsch|Züridütsch|Partizip|Infinitiv|Perfekt|Verkleinerung|Grundwort|Komparativ|Superlativ|indirekt|normal/.test(h));
          l.table.rows.forEach(r => r.forEach((_, i) => { if (!skip[i]) set(r, i, lang, cid); }));
        }
        exs(l.ex, lang, cid);
      });
    });
  });
}
export const NAME_EN = { de: "German", en: "English" };
