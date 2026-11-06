import { useState } from "react";
// Leitner flashcards built from the examples and pairs of finished lessons.
export const BOXES = [0, 1, 3, 7, 21];
export function deck(course, done) {
  const out = [];
  course.units.forEach(u => u.lessons.forEach(l => {
    if (!done[l.id]) return;
    (l.examples || []).forEach((e, i) => out.push({ k: l.id + "e" + i, f: e[0], b: e[1], l: l.title }));
    const m = (l.ex || []).find(x => x.type === "match");
    if (m) m.pairs.slice(0, 4).forEach((p, j) => out.push({ k: l.id + "p" + j, f: p[0], b: p[1], l: l.title }));
  }));
  return out;
}
export function dueCards(course, st, now) {
  const all = deck(course, st.done); const c = st.cards || {};
  const due = all.filter(x => c[x.k] && c[x.k].d <= now);
  const fresh = all.filter(x => !c[x.k]).slice(0, Math.max(0, 12 - due.length, 4));
  return { all, list: [...due, ...fresh].slice(0, 15), due: due.length, fresh: all.filter(x => !c[x.k]).length };
}
export function Flash({ list, t, onDone, onExit, speakFn }) {
  const [i, setI] = useState(0), [flip, setFlip] = useState(false), [res, setRes] = useState({});
  if (i >= list.length) { const n = Object.values(res).filter(Boolean).length; return <div className="screen lesson-end"><h2>🃏 {t.cardsDone}</h2><div className="end-stats"><div className="stat green"><small>{t.knew}</small><b>{n}</b></div><div className="stat red"><small>{t.again}</small><b>{list.length - n}</b></div><div className="stat gold"><small>XP</small><b>+{n * 2}</b></div></div><button className="btn primary big" onClick={() => onDone(res)}>{t.cont}</button></div>; }
  const c = list[i];
  const answer = ok => { setRes({ ...res, [c.k]: ok }); setFlip(false); setI(i + 1); };
  return <div className="screen flash">
    <header className="lesson-top"><button className="x" onClick={() => onExit(res)} aria-label={t.quit}>✕</button><div className="bar"><i style={{ width: Math.round(i / list.length * 100) + "%" }} /></div><span className="hearts">🃏 {i + 1}/{list.length}</span></header>
    <p className="muted small-note">{c.l}</p>
    <button className={"fcard" + (flip ? " flipped" : "")} onClick={() => setFlip(!flip)} aria-label={t.flip}>
      <span className="ff">{c.f}</span>
      {flip ? <span className="fb">{c.b}</span> : <small className="muted">{t.tapFlip}</small>}
    </button>
    {speakFn && <button className="btn small" onClick={() => speakFn(c.f)}>🔊 {t.listen}</button>}
    {flip && <div className="row fbtn"><button className="btn danger" onClick={() => answer(false)}>↺ {t.again}</button><button className="btn primary" onClick={() => answer(true)}>✓ {t.knew}</button></div>}
  </div>;
}
