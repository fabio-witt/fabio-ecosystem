import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Mascot from "./Mascot.jsx";
import { DE, EN, ES, FR } from "./courses1.js";
import { RU, PL, GSW, IT, GA } from "./courses2.js";
import CSS from "./styles.js";

const COURSES = [DE, EN, ES, FR, RU, PL, GSW, IT, GA];
const byId = Object.fromEntries(COURSES.map(c => [c.id, c]));
const allLessons = c => c.units.flatMap(u => u.lessons);
const FLAG = f => "/shared-assets/flags/" + f + ".svg";
const SPEECH = { de: "de-DE", en: "en-GB", es: "es-ES", fr: "fr-FR", ru: "ru-RU", pl: "pl-PL", gsw: "de-CH", it: "it-IT", ga: "ga-IE" };
const MAX_HEARTS = 5, HEART_MS = 30 * 60 * 1000, STORE = "grammarfirst-v2";

// ─── UI TEXT ────────────────────────────────────────────────────────────────
const T = {
  de: {
    learn: "Lernen", league: "Liga", profile: "Profil", shop: "Shop", start: "Los geht's", cont: "Weiter", check: "Prüfen",
    correct: "Richtig!", wrong: "Nicht ganz.", almost: "Fast richtig, achte auf die Akzente:", answer: "Lösung:",
    rule: "Die Regel", structure: "Struktur", examples: "Beispiele", tip: "Tipp", listen: "Anhören",
    chooseCourse: "Welche Sprache willst du lernen?", hello: "Hallo, ich bin Mila!", introText: "Ich zeige dir zuerst die Grammatik und dann üben wir sie, bis sie sitzt.",
    yourName: "Wie soll ich dich nennen?", goal: "Tagesziel", goals: { 20: "Locker", 50: "Normal", 100: "Intensiv" },
    xpDay: "XP pro Tag", streak: "Tage in Folge", gems: "Edelsteine", hearts: "Herzen", lesson: "Lektion", done: "Lektion geschafft!",
    perfect: "Perfekt, keine Fehler!", earned: "Verdient", accuracy: "Treffer", combo: "Serie", practice: "Fehler üben", practiceDesc: "Wiederhole Aufgaben, bei denen du dich vertan hast. Kostet keine Herzen und gibt Herzen zurück.",
    noMistakes: "Keine offenen Fehler. Stark!", outOfHearts: "Keine Herzen mehr", outText: "Übe deine Fehler, um Herzen zurückzubekommen, oder fülle sie im Shop auf.",
    refill: "Auffüllen (50 💎)", wait: "Nächstes Herz in", quests: "Tagesaufgaben", achievements: "Abzeichen", settings: "Einstellungen",
    sound: "Töne", lang: "Sprache der App", reset: "Fortschritt löschen", resetConfirm: "Wirklich alles löschen?", yes: "Ja, löschen", no: "Abbrechen",
    leagueTitle: "Wochenliga", leagueNote: "Übungsliga mit simulierten Mitspielern. Sie startet jeden Montag neu.", you: "Du", promote: "Die Top 3 steigen auf.",
    freeze: "Streak-Schutz", freezeDesc: "Schützt deine Serie, wenn du einen Tag verpasst.", buy: "Kaufen", owned: "Im Besitz", notEnough: "Nicht genug Edelsteine",
    heartRefill: "Herzen auffüllen", chest: "Truhe", chestOpen: "Truhe öffnen", locked: "Noch gesperrt", crown: "Krone", level: "Level",
    tapWords: "Tippe die Wörter in der richtigen Reihenfolge an.", typeHere: "Antwort eingeben …", matchHint: "Tippe links und dann rechts das passende Paar.",
    quit: "Beenden", quitConfirm: "Lektion beenden? Dein Fortschritt in dieser Lektion geht verloren.", stay: "Weiterlernen",
    dailyDone: "Tagesziel erreicht!", newLevel: "Neues Level!", unitDone: "Einheit abgeschlossen", reviewAll: "Lektion wiederholen", course: "Kurs",
    change: "Wechseln", keyHint: "Tastatur: 1 bis 4 wählen, Enter prüfen", mascotSays: "Mila sagt", of: "von", lessons: "Lektionen",
  },
  en: {
    learn: "Learn", league: "League", profile: "Profile", shop: "Shop", start: "Let's go", cont: "Continue", check: "Check",
    correct: "Correct!", wrong: "Not quite.", almost: "Almost, watch the accents:", answer: "Answer:",
    rule: "The rule", structure: "Structure", examples: "Examples", tip: "Tip", listen: "Listen",
    chooseCourse: "Which language do you want to learn?", hello: "Hi, I'm Mila!", introText: "First I show you the grammar, then we practise it until it sticks.",
    yourName: "What should I call you?", goal: "Daily goal", goals: { 20: "Casual", 50: "Regular", 100: "Intense" },
    xpDay: "XP per day", streak: "day streak", gems: "Gems", hearts: "Hearts", lesson: "Lesson", done: "Lesson complete!",
    perfect: "Perfect, no mistakes!", earned: "Earned", accuracy: "Accuracy", combo: "Combo", practice: "Practise mistakes", practiceDesc: "Repeat exercises you got wrong. Costs no hearts and gives hearts back.",
    noMistakes: "No open mistakes. Great!", outOfHearts: "Out of hearts", outText: "Practise your mistakes to earn hearts back, or refill them in the shop.",
    refill: "Refill (50 💎)", wait: "Next heart in", quests: "Daily quests", achievements: "Badges", settings: "Settings",
    sound: "Sounds", lang: "App language", reset: "Reset progress", resetConfirm: "Really delete everything?", yes: "Yes, delete", no: "Cancel",
    leagueTitle: "Weekly league", leagueNote: "Practice league with simulated players. It restarts every Monday.", you: "You", promote: "Top 3 get promoted.",
    freeze: "Streak freeze", freezeDesc: "Protects your streak if you miss a day.", buy: "Buy", owned: "Owned", notEnough: "Not enough gems",
    heartRefill: "Refill hearts", chest: "Chest", chestOpen: "Open chest", locked: "Locked", crown: "Crown", level: "Level",
    tapWords: "Tap the words in the right order.", typeHere: "Type your answer …", matchHint: "Tap a word on the left, then its match on the right.",
    quit: "Quit", quitConfirm: "Quit the lesson? Your progress in this lesson will be lost.", stay: "Keep learning",
    dailyDone: "Daily goal reached!", newLevel: "New level!", unitDone: "Unit complete", reviewAll: "Repeat lesson", course: "Course",
    change: "Change", keyHint: "Keyboard: 1 to 4 to choose, Enter to check", mascotSays: "Mila says", of: "of", lessons: "lessons",
  },
};

const LEVELS = [0, 60, 150, 300, 500, 800, 1200, 1700, 2400, 3200, 4200, 5500];
const levelOf = xp => { let l = 0; while (l < LEVELS.length - 1 && xp >= LEVELS[l + 1]) l++; return l + 1; };

const ACH = [
  { id: "first", icon: "🌱", de: ["Erster Schritt", "Erste Lektion abgeschlossen"], en: ["First step", "Finished your first lesson"], test: s => s.lessonsCompleted >= 1 },
  { id: "five", icon: "📚", de: ["Bücherwurm", "5 Lektionen abgeschlossen"], en: ["Bookworm", "Finished 5 lessons"], test: s => s.lessonsCompleted >= 5 },
  { id: "twenty", icon: "🏔️", de: ["Gipfelstürmer", "20 Lektionen abgeschlossen"], en: ["Summit", "Finished 20 lessons"], test: s => s.lessonsCompleted >= 20 },
  { id: "perfect", icon: "✨", de: ["Fehlerfrei", "Eine Lektion ohne Fehler"], en: ["Flawless", "A lesson without mistakes"], test: s => s.perfects >= 1 },
  { id: "perfect5", icon: "💎", de: ["Präzise", "5 Lektionen ohne Fehler"], en: ["Precise", "5 flawless lessons"], test: s => s.perfects >= 5 },
  { id: "combo10", icon: "🔥", de: ["Heisse Serie", "10 richtige Antworten am Stück"], en: ["On fire", "10 correct answers in a row"], test: s => s.maxCombo >= 10 },
  { id: "streak3", icon: "📅", de: ["Dranbleiben", "3 Tage in Folge gelernt"], en: ["Consistent", "3-day streak"], test: s => s.bestStreak >= 3 },
  { id: "streak7", icon: "🗓️", de: ["Eine Woche", "7 Tage in Folge gelernt"], en: ["One week", "7-day streak"], test: s => s.bestStreak >= 7 },
  { id: "xp500", icon: "⭐", de: ["500 XP", "500 XP gesammelt"], en: ["500 XP", "Collected 500 XP"], test: s => s.xp >= 500 },
  { id: "poly", icon: "🌍", de: ["Polyglott", "Lektionen in 3 Sprachen"], en: ["Polyglot", "Lessons in 3 languages"], test: s => new Set(Object.keys(s.done).map(k => k.replace(/\d+$/, ""))).size >= 3 },
  { id: "fixer", icon: "🛠️", de: ["Fehlerjäger", "10 Fehler nachgeübt"], en: ["Mistake hunter", "Fixed 10 mistakes"], test: s => s.fixed >= 10 },
  { id: "course", icon: "🏆", de: ["Kursabschluss", "Alle Lektionen eines Kurses"], en: ["Course complete", "All lessons of a course"], test: s => COURSES.some(c => allLessons(c).every(l => s.done[l.id])) },
];

const BOTS = ["Lea", "Noah", "Mia", "Luca", "Elif", "Jonas", "Sofia", "Ben", "Aylin", "Nico", "Lena", "Mateo"];

// ─── HELPERS ────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);
const dayDiff = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const weekId = () => { const d = new Date(); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d.toISOString().slice(0, 10); };
const norm = s => s.toLowerCase().replace(/[’`´]/g, "'").replace(/[¿?¡!.,;:«»"“”]/g, " ").replace(/\s+/g, " ").trim();
const plain = s => norm(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/ß/g, "ss");
const tokens = s => s.replace(/[¿?¡!.,;:]/g, " ").split(/\s+/).filter(Boolean);
const shuffle = (a, seed) => { const r = [...a]; let x = seed || Math.random() * 1e9; for (let i = r.length - 1; i > 0; i--) { x = (x * 9301 + 49297) % 233280; const j = Math.floor((x / 233280) * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 1e9; return h; };

const fresh = () => ({
  v: 2, onboarded: false, name: "", ui: "de", sound: true, goal: 50, course: "de",
  xp: 0, gems: 50, hearts: MAX_HEARTS, heartsAt: Date.now(), streak: 0, bestStreak: 0, lastDay: null, freezes: 0,
  dayXp: 0, day: today(), weekXp: 0, week: weekId(), done: {}, mistakes: [], unlockedAch: {},
  lessonsCompleted: 0, perfects: 0, maxCombo: 0, fixed: 0, chests: {}, quests: null, goalPaid: false,
});
const load = () => { try { const s = JSON.parse(localStorage.getItem(STORE)); if (s && s.v === 2) return { ...fresh(), ...s }; } catch (e) { } return fresh(); };
const save = s => { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) { } };

const makeQuests = () => ([
  { id: "xp", goal: 30, prog: 0, gems: 5, de: "Sammle 30 XP", en: "Earn 30 XP" },
  { id: "lessons", goal: 2, prog: 0, gems: 5, de: "Schliesse 2 Lektionen ab", en: "Finish 2 lessons" },
  { id: "combo", goal: 5, prog: 0, gems: 5, de: "Erreiche eine Serie von 5", en: "Reach a combo of 5" },
]);

// Regenerate hearts, roll day/week, refresh quests
function tick(s) {
  const n = { ...s }; const now = Date.now();
  if (n.hearts < MAX_HEARTS) { const g = Math.floor((now - n.heartsAt) / HEART_MS); if (g > 0) { n.hearts = Math.min(MAX_HEARTS, n.hearts + g); n.heartsAt = n.hearts >= MAX_HEARTS ? now : n.heartsAt + g * HEART_MS; } } else n.heartsAt = now;
  if (n.day !== today()) { n.day = today(); n.dayXp = 0; n.goalPaid = false; }
  if (n.week !== weekId()) { n.week = weekId(); n.weekXp = 0; }
  if (!n.quests || n.quests.date !== today()) n.quests = { date: today(), items: makeQuests() };
  if (n.lastDay && dayDiff(n.lastDay, today()) > 1 && !(n.freezes > 0 && dayDiff(n.lastDay, today()) === 2)) n.streak = 0;
  return n;
}

// ─── SOUND ──────────────────────────────────────────────────────────────────
let actx = null;
function beep(kind, on) {
  if (!on) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const seq = { ok: [[660, .08], [880, .12]], bad: [[220, .18]], win: [[523, .1], [659, .1], [784, .1], [1047, .22]], tap: [[440, .04]] }[kind];
    let t = actx.currentTime;
    seq.forEach(([f, d]) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = kind === "bad" ? "triangle" : "sine"; o.frequency.value = f; g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d); t += d * .9; });
  } catch (e) { }
}
function speak(text, lang) { try { const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = .9; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { } }

// ─── SMALL COMPONENTS ───────────────────────────────────────────────────────
const Flag = ({ id, size = 28 }) => <img src={FLAG(id)} alt="" width={size} height={Math.round(size * .7)} className="flag" />;

function Confetti({ run }) {
  if (!run) return null;
  const bits = Array.from({ length: 60 }, (_, i) => i);
  const colors = ["#f2b705", "#107c5c", "#e63946", "#3a86ff", "#8338ec", "#ff8fab"];
  return <div className="confetti" aria-hidden="true">{bits.map(i => <i key={i} style={{ left: (i * 37 % 100) + "%", background: colors[i % colors.length], animationDelay: (i % 12) * .05 + "s", transform: `rotate(${i * 29}deg)` }} />)}</div>;
}

function Bubble({ children }) { return <div className="bubble" role="status">{children}</div>; }

function Ring({ value, max, size = 54, color = "#107c5c", children }) {
  const r = (size - 8) / 2, c = 2 * Math.PI * r, p = Math.min(1, value / max);
  return <div className="ring" style={{ width: size, height: size }}>
    <svg width={size} height={size}><circle cx={size / 2} cy={size / 2} r={r} className="ring-bg" /><circle cx={size / 2} cy={size / 2} r={r} stroke={color} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - p)} /></svg>
    <span>{children}</span></div>;
}

// ─── EXERCISES ──────────────────────────────────────────────────────────────
function Choice({ ex, onAnswer, locked, picked, seed }) {
  const order = useMemo(() => shuffle(ex.options.map((_, i) => i), seed), [ex, seed]);
  useEffect(() => {
    const h = e => { if (locked) return; const n = parseInt(e.key, 10); if (n >= 1 && n <= order.length) onAnswer(order[n - 1]); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [order, locked, onAnswer]);
  return <div className="choices">{order.map((oi, k) => {
    let cls = "choice"; if (locked) { if (oi === ex.answer) cls += " is-right"; else if (oi === picked) cls += " is-wrong"; }
    return <button key={oi} className={cls} disabled={locked} onClick={() => onAnswer(oi)}><kbd>{k + 1}</kbd>{ex.options[oi]}</button>;
  })}</div>;
}

function Build({ ex, value, setValue, locked, seed }) {
  const bank = useMemo(() => shuffle([...tokens(ex.answer), ...(ex.extra || [])].map((w, i) => ({ w, i })), seed), [ex, seed]);
  const used = new Set(value.map(v => v.i));
  return <div className="build">
    <div className="build-line" aria-label="Antwort">{value.length ? value.map(v => <button key={v.i} className="tile" disabled={locked} onClick={() => setValue(value.filter(x => x.i !== v.i))}>{v.w}</button>) : <span className="ph">…</span>}</div>
    <div className="build-bank">{bank.map(v => <button key={v.i} className={"tile" + (used.has(v.i) ? " is-used" : "")} disabled={locked || used.has(v.i)} onClick={() => setValue([...value, v])}>{v.w}</button>)}</div>
  </div>;
}

function Match({ ex, onDone, onMiss, sound }) {
  const left = useMemo(() => shuffle(ex.pairs.map((p, i) => ({ t: p[0], i })), hash(ex.pairs[0][0])), [ex]);
  const right = useMemo(() => shuffle(ex.pairs.map((p, i) => ({ t: p[1], i })), hash(ex.pairs[0][1]) + 3), [ex]);
  const [sel, setSel] = useState(null), [okL, setOkL] = useState([]), [okR, setOkR] = useState([]), [bad, setBad] = useState(null);
  const pickRight = i => {
    if (sel === null) return;
    if (ex.pairs[i][1] === ex.pairs[sel][1]) { beep("tap", sound); const n = [...okL, sel]; setOkL(n); setOkR([...okR, i]); setSel(null); if (n.length === ex.pairs.length) onDone(); }
    else { setBad(i); onMiss(); beep("bad", sound); setTimeout(() => setBad(null), 500); setSel(null); }
  };
  return <div className="match">
    <div>{left.map(l => <button key={l.i} className={"tile wide" + (okL.includes(l.i) ? " is-done" : sel === l.i ? " is-sel" : "")} disabled={okL.includes(l.i)} onClick={() => setSel(l.i)}>{l.t}</button>)}</div>
    <div>{right.map(r => <button key={r.i} className={"tile wide" + (okR.includes(r.i) ? " is-done" : bad === r.i ? " is-wrong" : "")} disabled={okR.includes(r.i)} onClick={() => pickRight(r.i)}>{r.t}</button>)}</div>
  </div>;
}

// ─── LESSON PLAYER ──────────────────────────────────────────────────────────
function Lesson({ course, lesson, items, mode, st, t, onExit, onFinish, spendHeart }) {
  const [phase, setPhase] = useState(mode === "lesson" ? "intro" : "ex");
  const [queue, setQueue] = useState(items);
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState(null); // {ok, almost, picked}
  const [buildVal, setBuildVal] = useState([]);
  const [typed, setTyped] = useState("");
  const [combo, setCombo] = useState(0);
  const [stats, setStats] = useState({ right: 0, wrong: 0, xp: 0, maxCombo: 0, wrongItems: [], fixedItems: [] });
  const [matchMiss, setMatchMiss] = useState(false);
  const [quit, setQuit] = useState(false);
  const inputRef = useRef(null);
  const cur = queue[idx];
  const total = items.length;
  const doneCount = Math.min(total, stats.right + (mode === "lesson" ? 0 : 0));
  const lang = SPEECH[course.id];

  useEffect(() => { setBuildVal([]); setTyped(""); setResult(null); setMatchMiss(false); if (inputRef.current) inputRef.current.focus(); }, [idx, phase]);

  const grade = (ok, almost, picked) => {
    const ex = cur.ex;
    const nc = ok ? combo + 1 : 0;
    setCombo(nc);
    setResult({ ok, almost, picked });
    beep(ok ? "ok" : "bad", st.sound);
    setStats(s => {
      const xpGain = ok ? (cur.retry ? 5 : 10) + (nc >= 3 ? 2 : 0) : 0;
      const wrongItems = ok ? s.wrongItems : [...s.wrongItems, cur.ref];
      const fixedItems = ok && mode === "practice" ? [...s.fixedItems, cur.ref] : s.fixedItems;
      return { right: s.right + (ok ? 1 : 0), wrong: s.wrong + (ok ? 0 : 1), xp: s.xp + xpGain, maxCombo: Math.max(s.maxCombo, nc), wrongItems, fixedItems };
    });
    if (!ok) {
      if (mode === "lesson") spendHeart();
      if (!cur.retry) setQueue(q => [...q, { ...cur, retry: true }]);
    }
  };

  const check = () => {
    const ex = cur.ex;
    if (ex.type === "build") {
      const a = norm(buildVal.map(v => v.w).join(" ")), b = norm(ex.answer);
      grade(a === b, false);
    } else if (ex.type === "type") {
      const a = norm(typed), okExact = ex.accept.some(x => norm(x) === a), okPlain = ex.accept.some(x => plain(x) === plain(typed));
      grade(okExact || okPlain, !okExact && okPlain);
    }
  };
  const next = () => {
    if (idx + 1 >= queue.length) { setPhase("end"); beep("win", st.sound); return; }
    setIdx(idx + 1);
  };

  useEffect(() => {
    const h = e => {
      if (e.key !== "Enter" || phase !== "ex" || !cur) return;
      if (result) { e.preventDefault(); next(); }
      else if ((cur.ex.type === "build" && buildVal.length) || (cur.ex.type === "type" && typed.trim())) { e.preventDefault(); check(); }
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  });

  const outOfHearts = mode === "lesson" && st.hearts <= 0 && !result;

  if (phase === "intro") return (
    <div className="screen lesson-intro">
      <header className="lesson-top"><button className="x" onClick={onExit} aria-label={t.quit}>✕</button><span className="crumb"><Flag id={course.flag} size={22} /> {lesson.title}</span></header>
      <div className="mascot-row"><Mascot mood="think" size={70} /><Bubble>{course.explain === "en" ? "First the rule, then practice." : "Zuerst die Regel, dann üben wir."}</Bubble></div>
      <section className="card rule-card" style={{ borderColor: course.accent }}>
        <h2>{t.rule}</h2><p>{lesson.rule}</p>
        <h3>{t.structure}</h3><div className="structure">{lesson.structure}</div>
        <h3>{t.examples}</h3>
        <ul className="examples">{lesson.examples.map(([a, b], i) => <li key={i}><button className="speak" onClick={() => speak(a, lang)} aria-label={t.listen + ": " + a}>🔊</button><div><b>{a}</b><span>{b}</span></div></li>)}</ul>
        <div className="tip">💡 {lesson.tip}</div>
      </section>
      <button className="btn primary big" onClick={() => setPhase("ex")}>{t.start}</button>
    </div>
  );

  if (phase === "end") {
    const acc = Math.round(stats.right / Math.max(1, stats.right + stats.wrong) * 100);
    const perfect = stats.wrong === 0;
    return (
      <div className="screen lesson-end">
        <Confetti run />
        <Mascot mood="cheer" size={130} />
        <h2>{mode === "practice" ? t.practice : t.done}</h2>
        {perfect && <p className="perfect">{t.perfect}</p>}
        <div className="end-stats">
          <div className="stat gold"><small>{t.earned}</small><b>+{stats.xp + (mode === "lesson" ? 10 + (perfect ? 10 : 0) : 0)} XP</b></div>
          <div className="stat green"><small>{t.accuracy}</small><b>{acc}%</b></div>
          <div className="stat red"><small>{t.combo}</small><b>{stats.maxCombo}</b></div>
        </div>
        <button className="btn primary big" onClick={() => onFinish({ ...stats, perfect, acc })}>{t.cont}</button>
      </div>
    );
  }

  const ex = cur.ex;
  const canCheck = (ex.type === "build" && buildVal.length > 0) || (ex.type === "type" && typed.trim().length > 0);
  const correctText = ex.type === "choice" ? ex.options[ex.answer] : ex.type === "build" ? ex.answer : ex.type === "type" ? ex.accept[0] : "";
  return (
    <div className="screen lesson">
      <header className="lesson-top">
        <button className="x" onClick={() => setQuit(true)} aria-label={t.quit}>✕</button>
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(total, idx)}><i style={{ width: Math.min(100, idx / queue.length * 100) + "%", background: course.accent === "#ffffff" ? "#107c5c" : course.accent }} /></div>
        {mode === "lesson" ? <span className="hearts" aria-label={st.hearts + " " + t.hearts}>❤️ {st.hearts}</span> : <span className="hearts">🛠️</span>}
      </header>
      {combo >= 3 && <div className="combo-badge">🔥 {combo} {t.combo}</div>}
      {cur.retry && <div className="retry-badge">↺</div>}
      <div className="mascot-row small"><Mascot mood={result ? (result.ok ? "cheer" : "sad") : "happy"} size={56} /><Bubble>{ex.prompt}</Bubble></div>
      <div className="ex-body">
        {ex.type === "choice" && <Choice ex={ex} seed={hash(ex.prompt) + idx} locked={!!result || outOfHearts} picked={result && result.picked} onAnswer={i => !result && grade(i === ex.answer, false, i)} />}
        {ex.type === "build" && <><p className="hint">{t.tapWords}</p><Build ex={ex} seed={hash(ex.answer) + idx} value={buildVal} setValue={setBuildVal} locked={!!result || outOfHearts} /></>}
        {ex.type === "type" && <input ref={inputRef} className="type-in" value={typed} onChange={e => setTyped(e.target.value)} placeholder={t.typeHere} disabled={!!result || outOfHearts} autoCapitalize="off" autoComplete="off" spellCheck="false" lang={lang} />}
        {ex.type === "match" && !result && <><p className="hint">{t.matchHint}</p><Match key={idx} ex={ex} sound={st.sound} onMiss={() => setMatchMiss(true)} onDone={() => grade(!matchMiss, false)} /></>}
        {ex.type === "match" && result && <div className="match-done">{ex.pairs.map(([a, b]) => <span key={a}>{a} = {b}</span>)}</div>}
      </div>
      {ex.type === "choice" && !result && <p className="keyhint">{t.keyHint}</p>}
      <footer className={"feedback" + (result ? (result.ok ? " ok" : " bad") : "")} aria-live="polite">
        {result ? <div className="fb-text">
          <b>{result.ok ? (result.almost ? t.almost : t.correct) : t.wrong}</b>
          {(!result.ok || result.almost) && ex.type !== "match" && <span>{t.answer} <em>{correctText}</em></span>}
          {ex.explain && <span className="explain">{ex.explain}</span>}
        </div> : <div className="fb-text" />}
        {result ? <button className={"btn " + (result.ok ? "primary" : "danger")} onClick={next}>{t.cont}</button>
          : (ex.type === "build" || ex.type === "type") && <button className="btn primary" disabled={!canCheck || outOfHearts} onClick={check}>{t.check}</button>}
      </footer>
      {outOfHearts && <div className="modal"><div className="modal-card"><Mascot mood="sad" size={90} /><h3>{t.outOfHearts}</h3><p>{t.outText}</p><button className="btn primary" onClick={onExit}>{t.cont}</button></div></div>}
      {quit && <div className="modal"><div className="modal-card"><Mascot mood="sad" size={80} /><p>{t.quitConfirm}</p><div className="row"><button className="btn primary" onClick={() => setQuit(false)}>{t.stay}</button><button className="btn ghost" onClick={onExit}>{t.quit}</button></div></div></div>}
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [st, setSt] = useState(() => tick(load()));
  const [tab, setTab] = useState("learn");
  const [play, setPlay] = useState(null); // {lesson, items, mode}
  const [toast, setToast] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pickCourse, setPickCourse] = useState(false);
  const [now, setNow] = useState(Date.now());
  const t = T[st.ui] || T.de;
  const course = byId[st.course] || DE;

  useEffect(() => { save(st); }, [st]);
  useEffect(() => { const i = setInterval(() => { setNow(Date.now()); setSt(s => tick(s)); }, 30000); return () => clearInterval(i); }, []);
  const notify = (msg, icon = "⭐") => { setToast({ msg, icon, k: Date.now() }); setTimeout(() => setToast(x => x && Date.now() - x.k > 2500 ? null : x), 2800); };
  const update = fn => setSt(s => checkAch(fn(s)));

  function checkAch(s) {
    const n = { ...s, unlockedAch: { ...s.unlockedAch } };
    ACH.forEach(a => { if (!n.unlockedAch[a.id] && a.test(n)) { n.unlockedAch[a.id] = today(); n.gems += 10; setTimeout(() => notify((a[n.ui] || a.de)[0] + " +10 💎", a.icon), 600); } });
    return n;
  }

  const lessons = allLessons(course);
  const isUnlocked = (l, i) => i === 0 || !!st.done[lessons[i - 1].id];

  const startLesson = l => {
    if (st.hearts <= 0) { notify(t.outOfHearts, "💔"); return; }
    const items = l.ex.map((ex, i) => ({ ex, ref: { c: course.id, l: l.id, i } }));
    setPlay({ lesson: l, items, mode: "lesson" });
  };
  const startPractice = () => {
    const list = st.mistakes.filter(m => byId[m.c]).slice(0, 8);
    if (!list.length) { notify(t.noMistakes, "✅"); return; }
    const items = list.map(m => { const l = allLessons(byId[m.c]).find(x => x.id === m.l); return l && { ex: l.ex[m.i], ref: m }; }).filter(Boolean);
    setPlay({ lesson: { title: t.practice }, items, mode: "practice", courseId: list[0].c });
  };

  const spendHeart = () => setSt(s => ({ ...s, hearts: Math.max(0, s.hearts - 1), heartsAt: s.hearts >= MAX_HEARTS ? Date.now() : s.heartsAt }));

  const finish = res => {
    const { lesson, mode } = play;
    update(s => {
      const n = { ...s, done: { ...s.done }, quests: { ...s.quests, items: s.quests.items.map(q => ({ ...q })) } };
      let gain = res.xp;
      const key = r => r.c + "|" + r.l + "|" + r.i;
      const fixedKeys = new Set(res.fixedItems.map(key));
      let mistakes = n.mistakes.filter(m => !fixedKeys.has(key(m)));
      res.wrongItems.forEach(r => { if (!mistakes.some(m => key(m) === key(r))) mistakes.push(r); });
      if (mode === "practice") mistakes = mistakes.filter(m => !fixedKeys.has(key(m)));
      n.mistakes = mistakes.slice(-60);
      if (mode === "lesson") {
        gain += 10 + (res.perfect ? 10 : 0);
        const prev = n.done[lesson.id] || { crown: 0, best: 0 };
        n.done[lesson.id] = { crown: Math.min(3, prev.crown + 1), best: Math.max(prev.best, res.acc) };
        n.lessonsCompleted += 1; if (res.perfect) n.perfects += 1;
        n.gems += 5 + (res.perfect ? 5 : 0);
        // streak
        if (n.lastDay !== today()) {
          const d = n.lastDay ? dayDiff(n.lastDay, today()) : null;
          if (d === 1) n.streak += 1; else if (d === 2 && n.freezes > 0) { n.freezes -= 1; n.streak += 1; } else n.streak = 1;
          n.lastDay = today(); n.bestStreak = Math.max(n.bestStreak, n.streak);
          setTimeout(() => notify(st.ui === "en" ? (n.streak === 1 ? "Streak started: day 1" : n.streak + "-day streak!") : (n.streak === 1 ? "Serie gestartet: Tag 1" : "Serie: " + n.streak + " Tage!"), "🔥"), 300);
        }
        n.quests.items.forEach(q => { if (q.id === "lessons") q.prog += 1; });
      } else {
        n.fixed += res.fixedItems.length;
        n.hearts = Math.min(MAX_HEARTS, n.hearts + Math.max(1, res.fixedItems.length));
      }
      const oldLevel = levelOf(n.xp);
      n.xp += gain; n.dayXp += gain; n.weekXp += gain; n.maxCombo = Math.max(n.maxCombo, res.maxCombo);
      if (levelOf(n.xp) > oldLevel) setTimeout(() => notify(t.newLevel + " " + levelOf(n.xp), "🎉"), 900);
      n.quests.items.forEach(q => { if (q.id === "xp") q.prog += gain; if (q.id === "combo") q.prog = Math.max(q.prog, res.maxCombo); if (!q.paid && q.prog >= q.goal) { q.paid = true; n.gems += q.gems; } });
      if (!n.goalPaid && n.dayXp >= n.goal) { n.goalPaid = true; n.gems += 10; setTimeout(() => notify(t.dailyDone + " +10 💎", "🎯"), 1200); }
      return n;
    });
    setPlay(null);
  };

  const openChest = ui => { const k = course.id + ui; if (st.chests[k]) return; const g = 20 + (hash(k) % 21); update(s => ({ ...s, gems: s.gems + g, chests: { ...s.chests, [k]: true } })); notify("+" + g + " 💎", "🎁"); beep("win", st.sound); };
  const buy = (what) => {
    if (what === "freeze") { if (st.freezes >= 2) return; if (st.gems < 100) return notify(t.notEnough, "💎"); update(s => ({ ...s, gems: s.gems - 100, freezes: s.freezes + 1 })); notify(t.freeze + " ✓", "🧊"); }
    if (what === "hearts") { if (st.hearts >= MAX_HEARTS) return; if (st.gems < 50) return notify(t.notEnough, "💎"); update(s => ({ ...s, gems: s.gems - 50, hearts: MAX_HEARTS, heartsAt: Date.now() })); notify(t.heartRefill + " ✓", "❤️"); }
  };

  const nextHeartIn = st.hearts < MAX_HEARTS ? Math.max(0, HEART_MS - (now - st.heartsAt)) : 0;
  const mm = Math.ceil(nextHeartIn / 60000);
  const level = levelOf(st.xp), lvlFrom = LEVELS[level - 1], lvlTo = LEVELS[level] || LEVELS[level - 1] + 1500;
  const mood = st.dayXp >= st.goal ? "cheer" : st.dayXp > 0 ? "happy" : "wave";
  const greet = st.dayXp >= st.goal ? (st.ui === "en" ? "Goal reached! Keep it up." : "Ziel erreicht! Weiter so.")
    : st.streak > 0 && st.lastDay !== today() ? (st.ui === "en" ? `Keep your ${st.streak}-day streak alive!` : `Halte deine Serie von ${st.streak} Tagen!`)
      : (st.ui === "en" ? `Hi ${st.name || "there"}! Ready for today's grammar?` : `Hoi ${st.name || "du"}! Bereit für die Grammatik von heute?`);

  // ── ONBOARDING ──
  if (!st.onboarded) return (
    <div className="app"><style>{CSS}</style>
      <div className="screen onboarding">
        <div className="lang-toggle"><button className={st.ui === "de" ? "on" : ""} onClick={() => setSt({ ...st, ui: "de" })}>DE</button><button className={st.ui === "en" ? "on" : ""} onClick={() => setSt({ ...st, ui: "en" })}>EN</button></div>
        <Mascot mood="wave" size={120} />
        <h1>GrammarFirst</h1>
        <p className="lead"><b>{t.hello}</b> {t.introText}</p>
        <label className="field"><span>{t.yourName}</span><input value={st.name} maxLength={24} onChange={e => setSt({ ...st, name: e.target.value })} placeholder="Fabio" /></label>
        <h3>{t.chooseCourse}</h3>
        <div className="course-grid">{COURSES.map(c => <button key={c.id} className={"course-pick" + (st.course === c.id ? " on" : "")} onClick={() => setSt({ ...st, course: c.id })}><Flag id={c.flag} size={34} /><b>{c.name}</b><small>{c.native}</small></button>)}</div>
        <h3>{t.goal}</h3>
        <div className="goal-row">{[20, 50, 100].map(g => <button key={g} className={"goal" + (st.goal === g ? " on" : "")} onClick={() => setSt({ ...st, goal: g })}><b>{t.goals[g]}</b><small>{g} {t.xpDay}</small></button>)}</div>
        <button className="btn primary big" onClick={() => setSt({ ...st, onboarded: true })}>{t.start}</button>
      </div>
    </div>
  );

  // ── LESSON ──
  if (play) {
    const pc = byId[play.courseId] || course;
    return <div className="app"><style>{CSS}</style>
      <Lesson course={pc} lesson={play.lesson} items={play.items} mode={play.mode} st={st} t={t} onExit={() => setPlay(null)} onFinish={finish} spendHeart={spendHeart} />
      {toast && <div className="toast" key={toast.k}>{toast.icon} {toast.msg}</div>}
    </div>;
  }

  // ── HUD ──
  const hud = <div className="hud">
    <button className="hud-course" onClick={() => setPickCourse(true)} aria-label={t.course + ": " + course.name}><Flag id={course.flag} size={30} /></button>
    <span className="hud-item" title={t.streak}>🔥 <b>{st.streak}</b></span>
    <span className="hud-item" title={t.gems}>💎 <b>{st.gems}</b></span>
    <span className="hud-item" title={t.hearts}>❤️ <b>{st.hearts}</b>{st.hearts < MAX_HEARTS && <small>{mm}′</small>}</span>
    <Ring value={st.dayXp} max={st.goal} size={44}><small>{Math.min(st.dayXp, 999)}</small></Ring>
  </div>;

  // ── LEARN TAB ──
  let li = 0;
  const learn = <div className="screen">
    <div className="mascot-row"><Mascot mood={mood} size={82} /><Bubble>{greet}</Bubble></div>
    <div className="course-head" style={{ background: course.color }}><Flag id={course.flag} size={40} /><div><b>{course.name}</b><small>{course.tagline}</small></div><button className="btn small light" onClick={() => setPickCourse(true)}>{t.change}</button></div>
    {course.units.map((u, ui) => {
      const unitDone = u.lessons.every(l => st.done[l.id]);
      return <section key={ui} className="unit">
        <h2 className="unit-title">{u.title}</h2>
        <div className="path">{u.lessons.map((l, k) => {
          const i = li++; const un = isUnlocked(l, i); const d = st.done[l.id];
          const off = [0, 48, -32, 40, -44, 24][k % 6];
          return <div key={l.id} className="node-wrap" style={{ transform: `translateX(${off}px)` }}>
            <button className={"node" + (d ? " done" : un ? " open" : " locked")} style={un ? { "--acc": course.accent === "#ffffff" ? "#0b3d91" : course.accent } : null} disabled={!un} onClick={() => startLesson(l)} aria-label={l.title + (un ? "" : ", " + t.locked)}>
              <span className="node-icon">{d ? "★" : un ? i + 1 : "🔒"}</span>
              {d && <span className="crowns">{"👑".repeat(d.crown)}</span>}
            </button>
            <span className="node-label">{l.title}</span>
          </div>;
        })}
          <div className="node-wrap"><button className={"chest" + (unitDone ? (st.chests[course.id + ui] ? " opened" : " ready") : "")} disabled={!unitDone || st.chests[course.id + ui]} onClick={() => openChest(ui)} aria-label={t.chestOpen}>{st.chests[course.id + ui] ? "📭" : "🎁"}</button><span className="node-label">{unitDone ? t.unitDone : t.chest}</span></div>
        </div>
      </section>;
    })}
    <section className="card practice-card"><div><b>🛠️ {t.practice}</b><p>{t.practiceDesc}</p></div><button className="btn primary" onClick={startPractice}>{st.mistakes.length ? st.mistakes.length : "✓"}</button></section>
    <section className="card">
      <h3>{t.quests}</h3>
      {st.quests.items.map(q => <div key={q.id} className="quest"><span>{q[st.ui] || q.de}</span><div className="bar"><i style={{ width: Math.min(100, q.prog / q.goal * 100) + "%" }} /></div><small>{q.paid ? "✓" : `${Math.min(q.prog, q.goal)}/${q.goal}`} · {q.gems}💎</small></div>)}
    </section>
  </div>;

  // ── LEAGUE TAB ──
  const wk = st.week, dayIdx = (new Date().getDay() + 6) % 7 + 1;
  const rows = BOTS.slice(0, 9).map((n, i) => { const h = hash(wk + n); const pace = 15 + (h % 60); return { n, xp: Math.round(pace * dayIdx * (.6 + (h % 50) / 100)), bot: true }; });
  rows.push({ n: st.name || t.you, xp: st.weekXp, me: true });
  rows.sort((a, b) => b.xp - a.xp);
  const league = <div className="screen">
    <div className="mascot-row"><Mascot mood="cheer" size={76} /><Bubble>{t.promote}</Bubble></div>
    <section className="card"><h2>🏅 {t.leagueTitle}</h2><p className="muted">{t.leagueNote}</p>
      <ol className="board">{rows.map((r, i) => <li key={r.n + i} className={(r.me ? "me " : "") + (i < 3 ? "top" : "")}><span className="pos">{i + 1}</span><span className="av">{r.n[0]}</span><span className="nm">{r.n}{r.bot ? " 🤖" : ""}</span><b>{r.xp} XP</b></li>)}</ol>
    </section>
  </div>;

  // ── PROFILE TAB ──
  const profile = <div className="screen">
    <section className="card profile-head"><Mascot mood="happy" size={70} /><div><h2>{st.name || "GrammarFirst"}</h2><p className="muted">{t.level} {level}</p><div className="bar"><i style={{ width: ((st.xp - lvlFrom) / (lvlTo - lvlFrom) * 100) + "%" }} /></div><small className="muted">{st.xp} / {lvlTo} XP</small></div></section>
    <div className="stat-grid">
      <div className="stat"><small>🔥 {t.streak}</small><b>{st.streak}</b></div>
      <div className="stat"><small>⭐ XP</small><b>{st.xp}</b></div>
      <div className="stat"><small>📚 {t.lessons}</small><b>{st.lessonsCompleted}</b></div>
      <div className="stat"><small>✨ {t.perfect.split(",")[0]}</small><b>{st.perfects}</b></div>
    </div>
    <section className="card"><h3>{t.achievements}</h3><div className="ach-grid">{ACH.map(a => { const on = st.unlockedAch[a.id]; const [n, d] = a[st.ui] || a.de; return <div key={a.id} className={"ach" + (on ? " on" : "")} title={d}><span>{a.icon}</span><b>{n}</b><small>{d}</small></div>; })}</div></section>
    <section className="card"><h3>{t.course}</h3>{COURSES.map(c => { const ls = allLessons(c); const n = ls.filter(l => st.done[l.id]).length; return <button key={c.id} className="course-row" onClick={() => { setSt({ ...st, course: c.id }); setTab("learn"); }}><Flag id={c.flag} size={26} /><span>{c.name}</span><div className="bar"><i style={{ width: n / ls.length * 100 + "%" }} /></div><small>{n}/{ls.length}</small></button>; })}</section>
    <section className="card"><h3>{t.settings}</h3>
      <label className="set"><span>{t.sound}</span><input type="checkbox" checked={st.sound} onChange={e => setSt({ ...st, sound: e.target.checked })} /></label>
      <label className="set"><span>{t.lang}</span><select value={st.ui} onChange={e => setSt({ ...st, ui: e.target.value })}><option value="de">Deutsch</option><option value="en">English</option></select></label>
      <label className="set"><span>{t.goal}</span><select value={st.goal} onChange={e => setSt({ ...st, goal: +e.target.value })}>{[20, 50, 100].map(g => <option key={g} value={g}>{t.goals[g]} · {g} XP</option>)}</select></label>
      <label className="set"><span>Name</span><input value={st.name} maxLength={24} onChange={e => setSt({ ...st, name: e.target.value })} /></label>
      <button className="btn ghost danger-text" onClick={() => setConfirmReset(true)}>{t.reset}</button>
    </section>
  </div>;

  // ── SHOP TAB ──
  const shop = <div className="screen">
    <div className="mascot-row"><Mascot mood="happy" size={76} /><Bubble>💎 {st.gems} {t.gems}</Bubble></div>
    <section className="card shop-item"><span className="big-ic">❤️</span><div><b>{t.heartRefill}</b><p className="muted">{st.hearts}/{MAX_HEARTS} {t.hearts}{st.hearts < MAX_HEARTS ? ` · ${t.wait} ${mm} min` : ""}</p></div><button className="btn primary" disabled={st.hearts >= MAX_HEARTS} onClick={() => buy("hearts")}>50 💎</button></section>
    <section className="card shop-item"><span className="big-ic">🧊</span><div><b>{t.freeze}</b><p className="muted">{t.freezeDesc} ({st.freezes}/2)</p></div><button className="btn primary" disabled={st.freezes >= 2} onClick={() => buy("freeze")}>{st.freezes >= 2 ? t.owned : "100 💎"}</button></section>
  </div>;

  return (
    <div className="app"><style>{CSS}</style>
      {hud}
      <main className="main">{tab === "learn" ? learn : tab === "league" ? league : tab === "shop" ? shop : profile}</main>
      <nav className="tabs" aria-label="GrammarFirst">
        {[["learn", "📖", t.learn], ["league", "🏅", t.league], ["shop", "💎", t.shop], ["profile", "🙂", t.profile]].map(([k, ic, lb]) => <button key={k} className={tab === k ? "on" : ""} aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}><span>{ic}</span><small>{lb}</small></button>)}
      </nav>
      {pickCourse && <div className="modal" onClick={() => setPickCourse(false)}><div className="modal-card wide" onClick={e => e.stopPropagation()}><h3>{t.chooseCourse}</h3><div className="course-grid">{COURSES.map(c => { const ls = allLessons(c); const n = ls.filter(l => st.done[l.id]).length; return <button key={c.id} className={"course-pick" + (st.course === c.id ? " on" : "")} onClick={() => { setSt({ ...st, course: c.id }); setPickCourse(false); setTab("learn"); }}><Flag id={c.flag} size={34} /><b>{c.name}</b><small>{n}/{ls.length} {t.lessons}</small></button>; })}</div></div></div>}
      {confirmReset && <div className="modal"><div className="modal-card"><Mascot mood="sad" size={80} /><p>{t.resetConfirm}</p><div className="row"><button className="btn danger" onClick={() => { const f = fresh(); setSt(tick(f)); setConfirmReset(false); setTab("learn"); }}>{t.yes}</button><button className="btn ghost" onClick={() => setConfirmReset(false)}>{t.no}</button></div></div></div>}
      {toast && <div className="toast" key={toast.k}>{toast.icon} {toast.msg}</div>}
    </div>
  );
}
