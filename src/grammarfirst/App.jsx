import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Mascot from "./Mascot.jsx";
import { DE, EN, ES, FR } from "./courses1.js";
import { RU, PL, GSW, IT, GA } from "./courses2.js";
import "./extend.js";
import { applyLang, NAME_EN } from "./lang.js";
import * as cloud from "./cloud.js";
import { Flash, dueCards, BOXES } from "./flash.jsx";
import CSS from "./styles.js";

const COURSES = [DE, EN, ES, FR, RU, PL, GSW, IT, GA];
const byId = Object.fromEntries(COURSES.map(c => [c.id, c]));
const allLessons = c => c.units.flatMap(u => u.lessons);
const FLAG = f => "/shared-assets/flags/" + f + ".svg";
const SITE = "";
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


const X = {
  de: {
    grammar: "Grammatik", slow: "Langsam", sayIt: "Nachsprechen", translation: "Übersetzung", markedNote: "Markiert: die Grammatik dieser Einheit.",
    moreBtn: "Mehr dazu: Ausnahmen und typische Fehler", moreTitle: "Mehr dazu", readFirst: "Lies den Text und achte auf die markierten Wörter.",
    review: "Wiederholen", reviewNone: "Noch nichts zu wiederholen.", reviewDesc: "Regeln, die du bald vergisst, kommen zurück.", reviewDue: "fällig",
    unitTest: "Prüfung Einheit", testPassed: "Prüfung bestanden!", testFailed: "Noch nicht bestanden", testRule: "Bestanden ab 80 % beim ersten Versuch.", trophy: "Trophäe",
    placement: "Einstufungstest", placementDesc: "Kannst du schon etwas? Mach den Test und überspring, was du kennst.", placementDone: "Einstufung abgeschlossen", placedAt: "Du startest bei Einheit", placedStart: "Du startest am Anfang. Viel Spass!",
    readingDone: "Lesetext geschafft!", reading: "Lesetext", fixHint: "Tippe das Wort an, das falsch ist.", yourAnswer: "Deine Antwort:", showRule: "Regel ansehen", report: "Fehler melden", back: "Zurück",
    search: "Regel suchen …", map: "Deine Grammatik-Landkarte", st_open: "offen", st_learned: "gelernt", st_solid: "gefestigt", st_due: "auffrischen", weakest: "Deine schwächsten Regeln", weakNone: "Noch keine Schwächen erkannt. Mach weiter so!",
    practiceThis: "Üben", learnThis: "Lernen", certs: "Zertifikate", cert: "Zertifikat", certLocked: "Schliesse alle Lektionen dieses Niveaus ab.", certOpen: "Ansehen und drucken",
    milestone: "Meilenstein", msReached: "Niveau {lv} erreicht!", msGoal: "Ziel: Niveau {lv}", msSoon: "Kurse für dieses Niveau sind in Arbeit", msNote: "Die Meilensteine zeigen, dass du die Grammatik eines Niveaus abgeschlossen hast. Für ein offizielles Sprachzertifikat brauchst du eine Prüfung wie Goethe, DELE, DELF oder TELC.", yourLevel: "Dein Niveau", levelStart: "Start", explLang: "Sprache der Erklärungen", explNote: "Gilt für alle Kurse ausser Deutsch (immer Englisch) und Englisch (immer Deutsch).",
    cards: "Karteikarten", cardsDesc: "Sätze und Formen aus deinen Lektionen, mit Wiederholung im richtigen Abstand.", cardsNone: "Gerade keine Karten fällig.", cardsDone: "Karten geschafft", knew: "Gewusst", again: "Nochmal", flip: "Karte umdrehen", tapFlip: "Tippen zum Umdrehen", saveTitle: "Fortschritt sichern", saveDesc: "Mit einem Konto geht nichts verloren, auch nicht auf einem neuen Handy.", saveBtn: "Konto", listTitle: "Neue Lektionen und Level", listDesc: "Wir schicken dir eine kurze E-Mail, wenn neue Lektionen, Level oder Sprachen dazukommen. Kein Spam, abmelden geht jederzeit.", listBtn: "Eintragen", listOk: "Danke! Du bist auf der Liste.", listFail: "Das hat nicht geklappt. Prüfe die E-Mail-Adresse.", listNote: "Mit dem Eintragen akzeptierst du die", listPriv: "Datenschutzerklärung", account: "Konto", accountDesc: "Melde dich mit deiner E-Mail an. Du bekommst einen Link, ein Passwort brauchst du nicht. Dein Fortschritt wird dann automatisch gesichert.", email: "E-Mail", sendLink: "Login-Link senden", linkSent: "Link verschickt. Schau in dein Postfach und öffne den Link auf diesem Gerät.", linkLimit: "Der Login ist gerade nicht verfügbar. Bitte versuch es später nochmals.", linkFail: "Das hat nicht geklappt. Prüfe die E-Mail-Adresse.", loggedAs: "Angemeldet als", synced: "Gesichert um", syncNow: "Jetzt sichern", logout: "Abmelden", wipe: "Online-Daten löschen", wiped: "Online-Daten gelöscht", theme: "Darstellung", themeAuto: "Automatisch", themeLight: "Hell", themeDark: "Dunkel", statsOpt: "Anonyme Nutzungsstatistik", statsNote: "Hilft, die App zu verbessern. Ohne Cookies, ohne Namen oder E-Mail.", privacy: "Datenschutz", terms: "AGB",
    transfer: "Fortschritt übertragen", transferDesc: "Kopiere den Code und füge ihn auf einem anderen Gerät ein.", copy: "Code kopieren", copied: "Kopiert", load: "Code laden", loaded: "Fortschritt geladen", badCode: "Der Code ist ungültig.",
  },
  en: {
    grammar: "Grammar", slow: "Slow", sayIt: "Say it", translation: "Translation", markedNote: "Highlighted: the grammar of this unit.",
    moreBtn: "More: exceptions and common mistakes", moreTitle: "More", readFirst: "Read the text and look at the highlighted words.",
    review: "Review", reviewNone: "Nothing to review yet.", reviewDesc: "Rules you are about to forget come back.", reviewDue: "due",
    unitTest: "Unit test", testPassed: "Test passed!", testFailed: "Not passed yet", testRule: "Pass with 80% on the first try.", trophy: "Trophy",
    placement: "Placement test", placementDesc: "Already know some? Take the test and skip what you know.", placementDone: "Placement complete", placedAt: "You start at unit", placedStart: "You start at the beginning. Have fun!",
    readingDone: "Reading done!", reading: "Reading", fixHint: "Tap the word that is wrong.", yourAnswer: "Your answer:", showRule: "Show rule", report: "Report a mistake", back: "Back",
    search: "Search rules …", map: "Your grammar map", st_open: "open", st_learned: "learned", st_solid: "solid", st_due: "refresh", weakest: "Your weakest rules", weakNone: "No weak spots found yet. Keep going!",
    practiceThis: "Practise", learnThis: "Learn", certs: "Certificates", cert: "Certificate", certLocked: "Finish all lessons of this level.", certOpen: "View and print",
    milestone: "Milestone", msReached: "Level {lv} reached!", msGoal: "Goal: level {lv}", msSoon: "Courses for this level are in progress", msNote: "Milestones show that you have completed the grammar of a level. For an official language certificate you need an exam such as Goethe, DELE, DELF or TELC.", yourLevel: "Your level", levelStart: "Start", explLang: "Explanation language", explNote: "Applies to all courses except German (always English) and English (always German).",
    cards: "Flashcards", cardsDesc: "Sentences and forms from your lessons, with spaced review.", cardsNone: "No cards due right now.", cardsDone: "Cards done", knew: "Knew it", again: "Again", flip: "Flip card", tapFlip: "Tap to flip", saveTitle: "Save your progress", saveDesc: "With an account nothing gets lost, not even on a new phone.", saveBtn: "Account", listTitle: "New lessons and levels", listDesc: "We'll send you a short email when new lessons, levels or languages arrive. No spam, unsubscribe any time.", listBtn: "Sign up", listOk: "Thanks! You're on the list.", listFail: "That didn't work. Please check the email address.", listNote: "By signing up you accept the", listPriv: "privacy policy", account: "Account", accountDesc: "Sign in with your email. You get a link, no password needed. Your progress is then saved automatically.", email: "Email", sendLink: "Send login link", linkSent: "Link sent. Check your inbox and open the link on this device.", linkLimit: "Login is not available right now. Please try again later.", linkFail: "That didn't work. Check the email address.", loggedAs: "Signed in as", synced: "Saved at", syncNow: "Save now", logout: "Sign out", wipe: "Delete online data", wiped: "Online data deleted", theme: "Appearance", themeAuto: "Automatic", themeLight: "Light", themeDark: "Dark", statsOpt: "Anonymous usage statistics", statsNote: "Helps improve the app. No cookies, no name or email.", privacy: "Privacy", terms: "Terms",
    transfer: "Transfer progress", transferDesc: "Copy the code and paste it on another device.", copy: "Copy code", copied: "Copied", load: "Load code", loaded: "Progress loaded", badCode: "The code is not valid.",
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

// ─── LEARNING ENGINE ────────────────────────────────────────────────────────
const INTERVALS = [1, 3, 7, 16, 35], DAYMS = 86400000;
const CEFR = ui => ["A1", "A1", "A2", "A2", "B1", "B1", "B2"][ui] || "B2";
const NO_TTS = { gsw: 1, ga: 1 };
const LEVELS_ALL = ["A1", "A2", "B1", "B2", "C1", "C2"];
const CANDO = {
  de: { A1: "Du verstehst vertraute Alltagsausdrücke, stellst dich vor und stellst einfache Fragen.", A2: "Du verständigst dich in einfachen Routinesituationen und erzählst von dir, deiner Herkunft und deinem Alltag.", B1: "Du kommst in den meisten Alltagssituationen zurecht, erzählst von Erlebnissen und begründest kurz deine Meinung.", B2: "Du verstehst anspruchsvolle Texte und unterhältst dich spontan und fliessend mit Muttersprachlern.", C1: "Du drückst dich fliessend und präzise aus, auch im Beruf und im Studium.", C2: "Du verstehst praktisch alles mühelos und drückst dich sehr fein und genau aus." },
  en: { A1: "You understand familiar everyday expressions, introduce yourself and ask simple questions.", A2: "You manage simple routine situations and talk about yourself, your background and your daily life.", B1: "You handle most everyday situations, describe experiences and briefly explain your opinion.", B2: "You understand demanding texts and talk spontaneously and fluently with native speakers.", C1: "You express yourself fluently and precisely, also at work and in your studies.", C2: "You understand virtually everything with ease and express yourself very precisely." },
};
const levelUnits = (c, lv) => c.units.map((u, ui) => ({ u, ui })).filter(x => CEFR(x.ui) === lv);
const levelDone = (st, c, lv) => { const ls = levelUnits(c, lv).flatMap(x => x.u.lessons); return ls.length > 0 && ls.every(l => st.done[l.id]); };
const currentLevel = (st, c) => { let cur = null; for (const lv of LEVELS_ALL) { if (levelDone(st, c, lv)) cur = lv; else break; } return cur; };
const canSpeak = () => { try { return "speechSynthesis" in window; } catch (e) { return false; } };
const SR = () => { try { return window.SpeechRecognition || window.webkitSpeechRecognition || null; } catch (e) { return null; } };
const lev = (a, b) => { const m = a.length, n = b.length; if (!m) return n; if (!n) return m; let p = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; };
const ownerOf = id => COURSES.find(c => allLessons(c).some(l => l.id === id) || c.units.some(u => u.reading && u.reading.id === id));
const findLesson = id => { for (const c of COURSES) { for (const u of c.units) { if (u.reading && u.reading.id === id) return u.reading; const l = u.lessons.find(x => x.id === id); if (l) return l; } } return null; };
const poolCache = {};
// Every lesson gets extra exercises derived from its own data: a table to fill, an error to find and a listening task.
function pool(cid, l) {
  if (poolCache[l.id]) return poolCache[l.id];
  const c = byId[cid] || {}; const en = c.explain === "en";
  const out = [...l.ex];
  const m = l.ex.find(e => e.type === "match" && e.pairs && e.pairs.length >= 3);
  if (m) out.push({ type: "table", prompt: (en ? "Fill in the table: " : "Fülle die Tabelle aus: ") + m.prompt, rows: m.pairs, explain: l.structure });
  const b = l.id === "es14" ? null : l.ex.find(e => e.type === "build" && e.extra && e.extra.length);
  if (b) {
    const tk = tokens(b.answer);
    const wrong = (b.extra || []).find(x => !tk.some(w => norm(w) === norm(x)));
    if (wrong && tk.length >= 2) {
      let pos = 0, best = 1e9; tk.forEach((w, i) => { const d = lev(norm(w), norm(wrong)); if (d < best) { best = d; pos = i; } });
      const A = norm(tk[pos]), B = norm(wrong), ratio = best / Math.max(A.length, B.length);
      const plausible = best < Math.min(A.length, B.length) && (A[0] === B[0] || ratio < .5 || (Math.max(A.length, B.length) <= 3 && best <= 1));
      const words = [...tk]; words[pos] = wrong;
      const meant = b.prompt.replace(/^(Translate|Übersetze|Build|Baue)[^:]*:\s*/i, "");
      if (plausible) out.push({ type: "fix", prompt: (en ? "Find the wrong word. Meant: " : "Finde das falsche Wort. Gemeint: ") + meant, words, pos, answer: b.answer, explain: b.explain });
    }
  }
  if (!NO_TTS[cid] && l.examples && l.examples.length) {
    const [text, tr] = l.examples[hash(l.id) % l.examples.length];
    out.push({ type: "hear", prompt: en ? "Listen and type what you hear." : "Hör zu und schreib, was du hörst.", text, explain: tr, tts: true });
  }
  poolCache[l.id] = out; return out;
}
try { if (/[?&]debug/.test(location.search)) window.__GF = { pool: (c, id) => pool(c, findLesson(id)) }; } catch (e) { }
const strengthOf = (st, id, now) => { const d = st.done[id]; if (!d) return 0; const r = st.srs[id]; if (!r) return .35; const base = (r.lv + 1) / INTERVALS.length; return now > r.due ? base * .55 : base; };
const statusOf = (st, id, now) => { if (!st.done[id]) return "open"; const r = st.srs[id]; if (r && now > r.due) return "due"; if (r && r.lv >= 2) return "solid"; return "learned"; };
const bumpSrs = (srs, id, ok, now) => { const p = srs[id]; const lv = ok ? Math.min(INTERVALS.length - 1, p ? p.lv + 1 : 0) : Math.max(0, (p ? p.lv : 0) - 1); return { ...srs, [id]: { lv, due: now + INTERVALS[lv] * DAYMS } }; };
const exportCode = s => { try { return btoa(unescape(encodeURIComponent(JSON.stringify(s)))); } catch (e) { return ""; } };
const importCode = c => { try { const s = JSON.parse(decodeURIComponent(escape(atob(c.trim())))); return s && s.v === 2 ? s : null; } catch (e) { return null; } };

const fresh = () => ({
  v: 2, onboarded: false, name: "", ui: "en", expl: "en", sound: true, goal: 50, course: "de",
  xp: 0, gems: 50, hearts: MAX_HEARTS, heartsAt: Date.now(), streak: 0, bestStreak: 0, lastDay: null, freezes: 0,
  dayXp: 0, day: today(), weekXp: 0, week: weekId(), done: {}, mistakes: [], unlockedAch: {},
  lessonsCompleted: 0, perfects: 0, maxCombo: 0, fixed: 0, chests: {}, quests: null, goalPaid: false,
  srs: {}, tests: {}, readDone: {}, placed: {}, cards: {}, stats: true, theme: "auto",
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

function TableEx({ ex, value, setValue, locked, result }) {
  return <div className="tbl-ex">{ex.rows.map(([a, b], i) => <label key={i} className={"tbl-row" + (result ? (norm(value[i] || "") === norm(b) || plain(value[i] || "") === plain(b) ? " ok" : " bad") : "")}>
    <span>{a}</span><input value={value[i] || ""} disabled={locked} autoCapitalize="off" autoComplete="off" spellCheck="false" onChange={e => { const v = [...value]; v[i] = e.target.value; setValue(v); }} />
    {result && !(norm(value[i] || "") === norm(b) || plain(value[i] || "") === plain(b)) && <em>{b}</em>}</label>)}</div>;
}
function FixEx({ ex, onPick, locked, picked }) {
  return <div className="fix-ex">{ex.words.map((w, i) => <button key={i} className={"tile" + (locked && i === ex.pos ? " is-wrong" : "") + (locked && picked === i && i !== ex.pos ? " is-sel" : "")} disabled={locked} onClick={() => onPick(i)}>{w}</button>)}</div>;
}
function HearEx({ ex, lang, value, setValue, locked, inputRef, t }) {
  useEffect(() => { const id = setTimeout(() => speak(ex.text, lang), 350); return () => clearTimeout(id); }, [ex]);
  return <div className="hear-ex">
    <div className="row"><button className="btn primary" onClick={() => speak(ex.text, lang)}>🔊 {t.listen}</button><button className="btn" onClick={() => speakSlow(ex.text, lang)}>🐢 {t.slow}</button></div>
    <input ref={inputRef} className="type-in" value={value} onChange={e => setValue(e.target.value)} placeholder={t.typeHere} disabled={locked} autoCapitalize="off" autoComplete="off" spellCheck="false" lang={lang} />
  </div>;
}
function speakSlow(text, lang) { try { const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = .6; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { } }

function MicButton({ text, lang, t }) {
  const [res, setRes] = useState(null);
  const Rec = SR(); if (!Rec) return null;
  const go = () => {
    try { const r = new Rec(); r.lang = lang; r.interimResults = false; r.maxAlternatives = 1; setRes("…");
      r.onresult = e => { const heard = e.results[0][0].transcript; const a = plain(heard), b = plain(text); const score = Math.max(0, Math.round(100 - lev(a, b) / Math.max(1, b.length) * 100)); setRes(score + "%"); };
      r.onerror = () => setRes(null); r.start(); } catch (e) { setRes(null); }
  };
  return <button className="speak mic" onClick={go} aria-label={t.sayIt}>{res ? <small>{res}</small> : "🎙️"}</button>;
}

function RuleCard({ lesson, course, t, lang, open }) {
  const [more, setMore] = useState(!!open);
  const md = s => s.split(/(\*\*[^*]+\*\*)/).map((p, i) => p.startsWith("**") ? <mark key={i}>{p.slice(2, -2)}</mark> : p);
  if (lesson.text) return <section className="card rule-card reading-card" style={{ borderColor: course.accent === "#ffffff" ? "#0b3d91" : course.accent }}>
    <h2>📖 {lesson.title}</h2><p className="reading">{md(lesson.text)}</p>
    {!NO_TTS[course.id] && <button className="btn small" onClick={() => speak(lesson.text.replace(/\*\*/g, ""), lang)}>🔊 {t.listen}</button>}
    <details className="tr"><summary>{t.translation}</summary><p>{lesson.tr}</p></details>
    <p className="muted small-note">{t.markedNote}</p></section>;
  return <section className="card rule-card" style={{ borderColor: course.accent === "#ffffff" ? "#0b3d91" : course.accent }}>
    <h2>{t.rule}</h2><p>{lesson.rule}</p>
    <h3>{t.structure}</h3><div className="structure">{lesson.structure}</div>
    {lesson.table && <div className="gtable-wrap"><table className="gtable"><thead><tr>{lesson.table.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead><tbody>{lesson.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>}
    <h3>{t.examples}</h3>
    <ul className="examples">{lesson.examples.map(([a, b], i) => <li key={i}>{!NO_TTS[course.id] && <button className="speak" onClick={() => speak(a, lang)} aria-label={t.listen + ": " + a}>🔊</button>}{!NO_TTS[course.id] && <MicButton text={a} lang={lang} t={t} />}<div><b>{a}</b><span>{b}</span></div></li>)}</ul>
    <div className="tip">💡 {lesson.tip}</div>
    {lesson.more && <div className="more">{more ? <><h3>{t.moreTitle}</h3><p>{lesson.more}</p></> : <button className="btn small light more-btn" onClick={() => setMore(true)}>📘 {t.moreBtn}</button>}</div>}
  </section>;
}

// ─── LESSON PLAYER ──────────────────────────────────────────────────────────
// modes: lesson (hearts, retries), practice (retries), review, test, placement, reading
function Lesson({ course, lesson, items, mode, st, t, onExit, onFinish, spendHeart }) {
  const intro = mode === "lesson" || mode === "reading";
  const [phase, setPhase] = useState(intro ? "intro" : "ex");
  const [queue, setQueue] = useState(items);
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [buildVal, setBuildVal] = useState([]);
  const [typed, setTyped] = useState("");
  const [rows, setRows] = useState([]);
  const [combo, setCombo] = useState(0);
  const [stats, setStats] = useState({ right: 0, wrong: 0, xp: 0, maxCombo: 0, wrongItems: [], fixedItems: [], results: [] });
  const [matchMiss, setMatchMiss] = useState(false);
  const [quit, setQuit] = useState(false);
  const [ruleOpen, setRuleOpen] = useState(false);
  const inputRef = useRef(null);
  const cur = queue[idx];
  const total = items.length;
  const lang = SPEECH[course.id];
  const retries = mode === "lesson" || mode === "practice" || mode === "reading";

  useEffect(() => { setBuildVal([]); setTyped(""); setRows([]); setResult(null); setMatchMiss(false); setRuleOpen(false); if (inputRef.current) inputRef.current.focus(); }, [idx, phase]);

  const grade = (ok, almost, picked) => {
    const nc = ok ? combo + 1 : 0;
    setCombo(nc);
    setResult({ ok, almost, picked });
    beep(ok ? "ok" : "bad", st.sound);
    setStats(s => {
      const xpGain = ok ? (cur.retry ? 5 : 10) + (nc >= 3 ? 2 : 0) : 0;
      const wrongItems = ok ? s.wrongItems : [...s.wrongItems, cur.ref];
      const fixedItems = ok && mode === "practice" ? [...s.fixedItems, cur.ref] : s.fixedItems;
      const results = cur.retry ? s.results : [...s.results, { ref: cur.ref, ok }];
      return { right: s.right + (ok ? 1 : 0), wrong: s.wrong + (ok ? 0 : 1), xp: s.xp + xpGain, maxCombo: Math.max(s.maxCombo, nc), wrongItems, fixedItems, results };
    });
    if (!ok) {
      if (mode === "lesson") spendHeart();
      if (retries && !cur.retry) setQueue(q => [...q, { ...cur, retry: true }]);
    }
  };

  const check = () => {
    const ex = cur.ex;
    if (ex.type === "build") grade(norm(buildVal.map(v => v.w).join(" ")) === norm(ex.answer), false);
    else if (ex.type === "type") { const a = norm(typed), okExact = ex.accept.some(x => norm(x) === a), okPlain = ex.accept.some(x => plain(x) === plain(typed)); grade(okExact || okPlain, !okExact && okPlain); }
    else if (ex.type === "table") { const exact = ex.rows.every(([, b], i) => norm(rows[i] || "") === norm(b)); const pl = ex.rows.every(([, b], i) => plain(rows[i] || "") === plain(b)); grade(exact || pl, !exact && pl); }
    else if (ex.type === "hear") { const a = plain(typed), b = plain(ex.text); const exact = norm(typed) === norm(ex.text); const close = a === b || lev(a, b) <= Math.max(1, Math.floor(b.length / 20)); grade(exact || close, !exact && close); }
  };
  const next = () => {
    if (idx + 1 >= queue.length) { setPhase("end"); beep("win", st.sound); return; }
    setIdx(idx + 1);
  };

  useEffect(() => {
    const h = e => {
      if (e.key !== "Enter" || phase !== "ex" || !cur) return;
      if (result) { e.preventDefault(); next(); }
      else if (canCheck) { e.preventDefault(); check(); }
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  });

  const outOfHearts = mode === "lesson" && st.hearts <= 0 && !result;
  const ruleLesson = cur && cur.ref ? findLesson(cur.ref.l) : lesson;

  if (phase === "intro") return (
    <div className="screen lesson-intro">
      <header className="lesson-top"><button className="x" onClick={onExit} aria-label={t.quit}>✕</button><span className="crumb"><Flag id={course.flag} size={22} /> {lesson.title}</span></header>
      <div className="mascot-row"><Mascot mood="think" size={70} /><Bubble>{mode === "reading" ? t.readFirst : course.explain === "en" ? "First the rule, then practice." : "Zuerst die Regel, dann üben wir."}</Bubble></div>
      <RuleCard lesson={lesson} course={course} t={t} lang={lang} />
      <button className="btn primary big" onClick={() => setPhase("ex")}>{t.start}</button>
    </div>
  );

  if (phase === "end") {
    const acc = Math.round(stats.right / Math.max(1, stats.right + stats.wrong) * 100);
    const perfect = stats.wrong === 0;
    const firstAcc = Math.round(stats.results.filter(r => r.ok).length / Math.max(1, stats.results.length) * 100);
    const passed = firstAcc >= 80;
    const title = mode === "practice" ? t.practice : mode === "review" ? t.review : mode === "test" ? (passed ? t.testPassed : t.testFailed) : mode === "placement" ? t.placementDone : mode === "reading" ? t.readingDone : t.done;
    return (
      <div className="screen lesson-end">
        {(mode !== "test" || passed) && <Confetti run />}
        <Mascot mood={mode === "test" && !passed ? "sad" : "cheer"} size={130} />
        <h2>{title}</h2>
        {mode === "test" && <p className="muted">{t.testRule}</p>}
        {perfect && mode !== "placement" && <p className="perfect">{t.perfect}</p>}
        <div className="end-stats">
          <div className="stat gold"><small>{t.earned}</small><b>+{stats.xp + (mode === "lesson" ? 10 + (perfect ? 10 : 0) : 0)} XP</b></div>
          <div className="stat green"><small>{t.accuracy}</small><b>{mode === "test" || mode === "placement" ? firstAcc : acc}%</b></div>
          <div className="stat red"><small>{t.combo}</small><b>{stats.maxCombo}</b></div>
        </div>
        <button className="btn primary big" onClick={() => onFinish({ ...stats, perfect, acc, firstAcc, passed })}>{t.cont}</button>
      </div>
    );
  }

  const ex = cur.ex;
  const canCheck = !result && !outOfHearts && ((ex.type === "build" && buildVal.length > 0) || ((ex.type === "type" || ex.type === "hear") && typed.trim().length > 0) || (ex.type === "table" && ex.rows.every((_, i) => (rows[i] || "").trim())));
  const correctText = ex.type === "choice" ? ex.options[ex.answer] : ex.type === "build" || ex.type === "fix" ? ex.answer : ex.type === "type" ? ex.accept[0] : ex.type === "hear" ? ex.text : ex.type === "table" ? ex.rows.map(r => r.join(" = ")).join(" · ") : "";
  const report = "mailto:fabiowitt@gmx.de?subject=" + encodeURIComponent("GrammarFirst Fehler " + (cur.ref ? cur.ref.l + "/" + cur.ref.i : "")) + "&body=" + encodeURIComponent("Aufgabe: " + ex.prompt + "\nLösung in der App: " + correctText + "\n\nWas ist falsch?\n");
  return (
    <div className="screen lesson">
      <header className="lesson-top">
        <button className="x" onClick={() => setQuit(true)} aria-label={t.quit}>✕</button>
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(total, idx)}><i style={{ width: Math.min(100, idx / queue.length * 100) + "%", background: course.accent === "#ffffff" ? "#107c5c" : course.accent }} /></div>
        {ruleLesson && !ruleLesson.text && <button className="x rule-q" onClick={() => setRuleOpen(true)} aria-label={t.showRule}>?</button>}
        {mode === "lesson" ? <span className="hearts" aria-label={st.hearts + " " + t.hearts}>❤️ {st.hearts}</span> : <span className="hearts">{mode === "test" ? "🏆" : mode === "placement" ? "🧭" : mode === "review" ? "🔁" : "🛠️"}</span>}
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
        {ex.type === "table" && <TableEx ex={ex} value={rows} setValue={setRows} locked={!!result || outOfHearts} result={result} />}
        {ex.type === "fix" && <><p className="hint">{t.fixHint}</p><FixEx ex={ex} locked={!!result || outOfHearts} picked={result && result.picked} onPick={i => !result && grade(i === ex.pos, false, i)} /></>}
        {ex.type === "hear" && <HearEx key={idx} ex={ex} lang={lang} value={typed} setValue={setTyped} locked={!!result || outOfHearts} inputRef={inputRef} t={t} />}
      </div>
      {ex.type === "choice" && !result && <p className="keyhint">{t.keyHint}</p>}
      <footer className={"feedback" + (result ? (result.ok ? " ok" : " bad") : "")} aria-live="polite">
        {result ? <div className="fb-text">
          <b>{result.ok ? (result.almost ? t.almost : t.correct) : t.wrong}</b>
          {!result.ok && ex.type === "choice" && result.picked != null && <span>{t.yourAnswer} <s>{ex.options[result.picked]}</s></span>}
          {(!result.ok || result.almost) && ex.type !== "match" && <span>{t.answer} <em>{correctText}</em></span>}
          {ex.explain && <span className="explain">{ex.explain}</span>}
          {!result.ok && ex.why && result.picked != null && ex.why[result.picked] && <span className="explain">{ex.why[result.picked]}</span>}
          <span className="fb-links">{!result.ok && ruleLesson && !ruleLesson.text && <button className="linkbtn" onClick={() => setRuleOpen(true)}>📘 {t.showRule}</button>}<a className="linkbtn" href={report}>⚑ {t.report}</a></span>
        </div> : <div className="fb-text" />}
        {result ? <button className={"btn " + (result.ok ? "primary" : "danger")} onClick={next}>{t.cont}</button>
          : (ex.type === "build" || ex.type === "type" || ex.type === "table" || ex.type === "hear") && <button className="btn primary" disabled={!canCheck} onClick={check}>{t.check}</button>}
      </footer>
      {ruleOpen && ruleLesson && <div className="modal" onClick={() => setRuleOpen(false)}><div className="modal-card wide rule-modal" onClick={e => e.stopPropagation()}><RuleCard lesson={ruleLesson} course={course} t={t} lang={lang} open /><button className="btn primary" onClick={() => setRuleOpen(false)}>{t.back}</button></div></div>}
      {outOfHearts && <div className="modal"><div className="modal-card"><Mascot mood="sad" size={90} /><h3>{t.outOfHearts}</h3><p>{t.outText}</p><button className="btn primary" onClick={onExit}>{t.cont}</button></div></div>}
      {quit && <div className="modal"><div className="modal-card"><Mascot mood="sad" size={80} /><p>{t.quitConfirm}</p><div className="row"><button className="btn primary" onClick={() => setQuit(false)}>{t.stay}</button><button className="btn ghost" onClick={onExit}>{t.quit}</button></div></div></div>}
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [st, setSt] = useState(() => { const s = tick(load()); try { const q = new URLSearchParams(location.search).get("course"); if (q && byId[q] && !s.onboarded) s.course = q; } catch (e) { } applyLang(s.expl || "en"); return s; });
  const [langV, setLangV] = useState(0);
  useEffect(() => { applyLang(st.expl || "en"); for (const k in poolCache) delete poolCache[k]; setLangV(v => v + 1); }, [st.expl]);
  const [tab, setTab] = useState("learn");
  const [play, setPlay] = useState(null); // {lesson, items, mode}
  const [toast, setToast] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pickCourse, setPickCourse] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [libQ, setLibQ] = useState("");
  const [user, setUser] = useState(null);
  const [mail, setMail] = useState(""), [mailMsg, setMailMsg] = useState("");
  const [lmail, setLmail] = useState(""), [lmsg, setLmsg] = useState("");
  const [syncAt, setSyncAt] = useState(null);
  const [flash, setFlash] = useState(null);
  const ev = (e, d = {}) => cloud.track(e, { course: st.course, ui: st.ui, ...d }, st.stats !== false);
  useEffect(() => {
    const fromLink = cloud.captureLogin();
    if (!st.statsOpen || st.statsOpen !== today()) { ev("open"); setSt(s => ({ ...s, statsOpen: today() })); }
    (async () => {
      if (!cloud.session()) return;
      const u = await cloud.me(); if (!u) return; setUser(u);
      const remote = await cloud.pull(u.id);
      if (remote && remote.state && remote.state.v === 2) {
        setSt(s => { const r = remote.state; const take = (r.xp || 0) > (s.xp || 0) || (!s.onboarded && r.onboarded); return take ? tick({ ...fresh(), ...r, ui: s.ui, expl: r.expl || s.expl }) : s; });
      }
      setSyncAt(Date.now());
      if (fromLink) { ev("signup"); setTab("profile"); }
    })();
  }, []);
  useEffect(() => { if (!user) return; const id = setTimeout(async () => { if (await cloud.push(user.id, st)) setSyncAt(Date.now()); }, 4000); return () => clearTimeout(id); }, [st, user]);
  const [code, setCode] = useState("");
  const t = { ...(T[st.ui] || T.de), ...(X[st.ui] || X.de) };
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
  const itemsOf = (cid, l) => pool(cid, l).filter(ex => !ex.tts || canSpeak()).map(ex => ({ ex, ref: { c: cid, l: l.id, i: pool(cid, l).indexOf(ex) } }));
  const pick = (arr, n, seed) => shuffle(arr, seed).slice(0, n);

  const startLesson = l => {
    if (st.hearts <= 0) { notify(t.outOfHearts, "💔"); return; }
    setPlay({ lesson: l, items: itemsOf(course.id, l), mode: "lesson" }); ev("lesson_start", { lesson: l.id });
  };
  const startPractice = (onlyLessons) => {
    const list = st.mistakes.filter(m => byId[m.c] && (!onlyLessons || onlyLessons.includes(m.l))).slice(0, 8);
    if (!list.length) { notify(t.noMistakes, "✅"); return; }
    const items = list.map(m => { const l = findLesson(m.l); const ex = l && pool(m.c, l)[m.i]; return ex && { ex, ref: m }; }).filter(Boolean);
    setPlay({ lesson: { title: t.practice }, items, mode: "practice", courseId: list[0].c });
  };
  const dueLessons = lessons.filter(l => st.done[l.id] && (!st.srs[l.id] || st.srs[l.id].due <= now));
  const startReview = () => {
    let src = dueLessons;
    if (!src.length) src = lessons.filter(l => st.done[l.id]).sort((a, b) => strengthOf(st, a.id, now) - strengthOf(st, b.id, now)).slice(0, 4);
    if (!src.length) { notify(t.reviewNone, "🔁"); return; }
    const items = src.slice(0, 6).flatMap(l => pick(itemsOf(course.id, l), 2, hash(l.id) + now % 997));
    setPlay({ lesson: { title: t.review }, items: shuffle(items, now % 9973).slice(0, 10), mode: "review", srcLessons: src.slice(0, 6).map(l => l.id) });
  };
  const startTest = ui => {
    const u = course.units[ui];
    const items = shuffle(u.lessons.flatMap(l => pick(itemsOf(course.id, l), 2, hash(l.id + "t"))), hash(course.id + ui)).slice(0, 10);
    setPlay({ lesson: { title: t.unitTest + " " + (ui + 1) }, items, mode: "test", unit: ui });
  };
  const startPlacement = () => {
    const items = course.units.flatMap((u, ui) => [u.lessons[0], u.lessons[u.lessons.length - 1]].map(l => { const ex = l.ex.find(e => e.type === "choice") || l.ex[0]; return { ex, ref: { c: course.id, l: l.id, i: l.ex.indexOf(ex), u: ui } }; }));
    setPlay({ lesson: { title: t.placement }, items, mode: "placement" });
  };
  const startReading = r => setPlay({ lesson: r, items: r.ex.map((ex, i) => ({ ex, ref: { c: course.id, l: r.id, i } })), mode: "reading" });

  const spendHeart = () => setSt(s => ({ ...s, hearts: Math.max(0, s.hearts - 1), heartsAt: s.hearts >= MAX_HEARTS ? Date.now() : s.heartsAt }));

  const finish = res => {
    const { lesson, mode } = play;
    ev({ lesson: "lesson_done", review: "review_done", test: "test_done", placement: "placement_done", reading: "reading_done", practice: "practice_done" }[mode] || "lesson_done", { lesson: lesson && lesson.id, value: mode === "test" || mode === "placement" ? res.firstAcc : res.acc });
    const tnow = Date.now();
    update(s => {
      const n = { ...s, done: { ...s.done }, srs: { ...(s.srs || {}) }, tests: { ...(s.tests || {}) }, readDone: { ...(s.readDone || {}) }, placed: { ...(s.placed || {}) }, quests: { ...s.quests, items: s.quests.items.map(q => ({ ...q })) } };
      let gain = res.xp;
      const key = r => r.c + "|" + r.l + "|" + r.i;
      const fixedKeys = new Set(res.fixedItems.map(key));
      let mistakes = n.mistakes.filter(m => !fixedKeys.has(key(m)));
      if (mode !== "placement") res.wrongItems.forEach(r => { if (!mistakes.some(m => key(m) === key(r))) mistakes.push(r); });
      n.mistakes = mistakes.slice(-80);
      const activity = () => {
        if (n.lastDay !== today()) {
          const d = n.lastDay ? dayDiff(n.lastDay, today()) : null;
          if (d === 1) n.streak += 1; else if (d === 2 && n.freezes > 0) { n.freezes -= 1; n.streak += 1; } else n.streak = 1;
          n.lastDay = today(); n.bestStreak = Math.max(n.bestStreak, n.streak);
          setTimeout(() => notify(st.ui === "en" ? (n.streak === 1 ? "Streak started: day 1" : n.streak + "-day streak!") : (n.streak === 1 ? "Serie gestartet: Tag 1" : "Serie: " + n.streak + " Tage!"), "🔥"), 300);
        }
      };
      if (mode === "lesson") {
        gain += 10 + (res.perfect ? 10 : 0);
        const prev = n.done[lesson.id] || { crown: 0, best: 0 };
        n.done[lesson.id] = { crown: Math.min(3, prev.crown + 1), best: Math.max(prev.best, res.acc) };
        n.srs = bumpSrs(n.srs, lesson.id, res.acc >= 80, tnow);
        n.lessonsCompleted += 1; if (res.perfect) n.perfects += 1;
        n.gems += 5 + (res.perfect ? 5 : 0);
        activity();
        n.quests.items.forEach(q => { if (q.id === "lessons") q.prog += 1; });
      } else if (mode === "review") {
        const byL = {}; res.results.forEach(r => { byL[r.ref.l] = (byL[r.ref.l] !== false) && r.ok; });
        Object.entries(byL).forEach(([id, ok]) => { n.srs = bumpSrs(n.srs, id, ok, tnow); });
        n.gems += 3; activity();
      } else if (mode === "test") {
        const k = play.lesson && course.id + play.unit;
        if (res.passed) { if (!n.tests[k]) { n.gems += 30; setTimeout(() => notify(t.trophy + " +30 💎", "🏆"), 500); } n.tests[k] = Math.max(n.tests[k] || 0, res.firstAcc); }
        activity();
      } else if (mode === "placement") {
        const okU = {}; res.results.forEach(r => { const u = r.ref.u; okU[u] = (okU[u] === undefined ? true : okU[u]) && r.ok; });
        let reached = 0;
        for (let ui = 0; ui < course.units.length; ui++) { if (!okU[ui]) break; course.units[ui].lessons.forEach(l => { if (!n.done[l.id]) { n.done[l.id] = { crown: 1, best: 80 }; n.srs = bumpSrs(n.srs, l.id, true, tnow); } }); reached = ui + 1; }
        n.placed[course.id] = reached;
        gain = Math.min(gain, 30);
        setTimeout(() => notify(reached ? t.placedAt + " " + (reached + 1) : t.placedStart, "🧭"), 500);
      } else if (mode === "reading") {
        if (!n.readDone[lesson.id]) n.gems += 5;
        n.readDone[lesson.id] = true; activity();
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
  const openCert = lv => {
    const esc = x => String(x).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>GrammarFirst ${lv}</title><style>body{font-family:system-ui,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#eef1f7}.c{background:#fff;width:min(780px,92vw);padding:56px;border:10px solid #0f3e92;border-radius:18px;text-align:center}h1{color:#0f3e92;font-size:40px;margin:8px 0}h2{font-size:28px;margin:24px 0 4px}.k{color:#d52b1e;font-weight:800;letter-spacing:.14em;text-transform:uppercase}p{color:#5d6878}@media print{body{background:#fff}button{display:none}}</style></head><body><div class="c"><div class="k">GrammarFirst</div><h1>${st.ui === "en" ? "Certificate" : "Zertifikat"} ${lv}</h1><p>${st.ui === "en" ? "This certifies that" : "Hiermit wird bestätigt, dass"}</p><h2>${esc(st.name || "GrammarFirst")}</h2><p>${st.ui === "en" ? "has completed all grammar lessons of level" : "alle Grammatiklektionen des Niveaus"} <b>${lv}</b> ${st.ui === "en" ? "in" : "im Kurs"} <b>${esc(course.name)}</b>${st.ui === "en" ? "" : " abgeschlossen hat"}.</p><p>${new Date().toLocaleDateString(st.ui === "en" ? "en-GB" : "de-CH")} · Fabio Witt, Zürich</p><button onclick="print()">${st.ui === "en" ? "Print" : "Drucken"}</button></div></body></html>`;
    try { const url = URL.createObjectURL(new Blob([html], { type: "text/html" })); const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { }
  };
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
    <div className={"app theme-" + (st.theme || "auto")}><style>{CSS}</style>
      <div className="screen onboarding">
        <div className="lang-toggle"><button className={st.ui === "de" ? "on" : ""} onClick={() => setSt({ ...st, ui: "de", expl: "de" })}>DE</button><button className={st.ui === "en" ? "on" : ""} onClick={() => setSt({ ...st, ui: "en", expl: "en" })}>EN</button></div>
        <Mascot mood="wave" size={120} />
        <h1>GrammarFirst</h1>
        <p className="lead"><b>{t.hello}</b> {t.introText}</p>
        <label className="field"><span>{t.yourName}</span><input value={st.name} maxLength={24} onChange={e => setSt({ ...st, name: e.target.value })} placeholder="Fabio" /></label>
        <h3>{t.chooseCourse}</h3>
        <div className="course-grid">{COURSES.map(c => <button key={c.id} className={"course-pick" + (st.course === c.id ? " on" : "")} onClick={() => setSt({ ...st, course: c.id })}><Flag id={c.flag} size={34} /><b>{c.name}</b><small>{c.native}</small></button>)}</div>
        <h3>{t.goal}</h3>
        <div className="goal-row">{[20, 50, 100].map(g => <button key={g} className={"goal" + (st.goal === g ? " on" : "")} onClick={() => setSt({ ...st, goal: g })}><b>{t.goals[g]}</b><small>{g} {t.xpDay}</small></button>)}</div>
        <button className="btn primary big" onClick={() => { setSt({ ...st, onboarded: true }); ev("onboard"); }}>{t.start}</button>
      </div>
    </div>
  );

  // ── FLASHCARDS ──
  const finishFlash = res => {
    const tnow = Date.now();
    update(s => { const cards = { ...(s.cards || {}) }; let n = 0; Object.entries(res).forEach(([k, ok]) => { const b = cards[k] ? cards[k].b : 0; const nb = ok ? Math.min(BOXES.length - 1, b + 1) : 0; if (ok) n++; cards[k] = { b: nb, d: tnow + BOXES[nb] * DAYMS + (nb === 0 ? 10 * 60000 : 0) }; }); const g = n * 2; return { ...s, cards, xp: s.xp + g, dayXp: s.dayXp + g, weekXp: s.weekXp + g }; });
    setFlash(null);
  };
  if (flash) return <div className={"app theme-" + (st.theme || "auto")}><style>{CSS}</style><Flash list={flash} t={t} onDone={finishFlash} onExit={res => finishFlash(res)} speakFn={NO_TTS[course.id] || !canSpeak() ? null : x => speak(x, SPEECH[course.id])} /></div>;

  // ── LESSON ──
  if (play) {
    const pc = byId[play.courseId] || course;
    return <div className={"app theme-" + (st.theme || "auto")}><style>{CSS}</style>
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
    <div className="course-head" style={{ background: course.color }}><Flag id={course.flag} size={40} /><div><b>{course.name}</b><small>{course.tagline}</small></div><span className="lvl-pill" title={t.yourLevel}>{currentLevel(st, course) || t.levelStart}</span><button className="btn small light" onClick={() => setPickCourse(true)}>{t.change}</button></div>
    {!lessons.some(l => st.done[l.id]) && !(course.id in st.placed) && <section className="card practice-card"><div><b>🧭 {t.placement}</b><p>{t.placementDesc}</p></div><button className="btn primary" onClick={startPlacement}>{t.start}</button></section>}
    {lessons.some(l => st.done[l.id]) && <section className={"card practice-card review-card" + (dueLessons.length ? " due" : "")}><div><b>🔁 {t.review}</b><p>{t.reviewDesc}</p></div><button className="btn primary" onClick={startReview}>{dueLessons.length ? dueLessons.length + " " + t.reviewDue : "✓"}</button></section>}
    {(() => { const dc = dueCards(course, st, now); return dc.all.length ? <section className="card practice-card"><div><b>🃏 {t.cards}</b><p>{t.cardsDesc}</p></div><button className="btn primary" onClick={() => { if (dc.list.length) setFlash(dc.list); else notify(t.cardsNone, "🃏"); }}>{dc.due ? dc.due + " " + t.reviewDue : dc.fresh ? "+" + Math.min(dc.fresh, 12) : "✓"}</button></section> : null; })()}
    {!user && st.lessonsCompleted >= 2 && <section className="card practice-card save-card"><div><b>☁️ {t.saveTitle}</b><p>{t.saveDesc}</p></div><button className="btn primary" onClick={() => setTab("profile")}>{t.saveBtn}</button></section>}
    {course.units.map((u, ui) => {
      const unitDone = u.lessons.every(l => st.done[l.id]);
      const lv = CEFR(ui), lastOfLevel = ui === course.units.length - 1 || CEFR(ui + 1) !== lv;
      const ms = lastOfLevel ? (() => { const ls = levelUnits(course, lv).flatMap(x => x.u.lessons); const n = ls.filter(l => st.done[l.id]).length; const ok = n === ls.length; return <div key={"ms" + ui} className={"milestone" + (ok ? " reached" : "")}><div className="ms-badge">{lv}</div><div className="ms-body"><small>{t.milestone}</small><b>{ok ? t.msReached.replace("{lv}", lv) : t.msGoal.replace("{lv}", lv)}</b><p>{(CANDO[st.ui] || CANDO.en)[lv]}</p><div className="bar"><i style={{ width: Math.round(n / ls.length * 100) + "%" }} /></div><small>{n}/{ls.length} {t.lessons}</small>{ok && <button className="btn small light" onClick={() => openCert(lv)}>🎓 {t.cert} {lv}</button>}</div></div>; })() : null;
      return <React.Fragment key={ui}><section className="unit">
        <h2 className="unit-title">{u.title}<small className="cefr">{CEFR(ui)}</small></h2>
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
          {u.reading && <div className="node-wrap"><button className={"node reading" + (st.readDone[u.reading.id] ? " done" : unitDone ? " open" : " locked")} style={unitDone ? { "--acc": "#3a86ff" } : null} disabled={!unitDone} onClick={() => startReading(u.reading)} aria-label={t.reading + ": " + u.reading.title}><span className="node-icon">{unitDone ? "📖" : "🔒"}</span></button><span className="node-label">{t.reading}: {u.reading.title}</span></div>}
          <div className="node-wrap"><button className={"chest" + (unitDone ? (st.chests[course.id + ui] ? " opened" : " ready") : "")} disabled={!unitDone || st.chests[course.id + ui]} onClick={() => openChest(ui)} aria-label={t.chestOpen}>{st.chests[course.id + ui] ? "📭" : "🎁"}</button><span className="node-label">{unitDone ? t.unitDone : t.chest}</span></div>
          <div className="node-wrap"><button className={"node test" + (st.tests[course.id + ui] ? " done" : unitDone ? " open" : " locked")} style={unitDone ? { "--acc": "#8338ec" } : null} disabled={!unitDone} onClick={() => startTest(ui)} aria-label={t.unitTest + " " + (ui + 1)}><span className="node-icon">{st.tests[course.id + ui] ? "🏆" : unitDone ? "🎯" : "🔒"}</span>{st.tests[course.id + ui] && <span className="crowns">{st.tests[course.id + ui]}%</span>}</button><span className="node-label">{t.unitTest} {ui + 1}</span></div>
        </div>
      </section>{ms}</React.Fragment>;
    })}
    {LEVELS_ALL.filter(lv => !course.units.some((u, ui) => CEFR(ui) === lv)).map(lv => <div key={lv} className="milestone future"><div className="ms-badge">{lv}</div><div className="ms-body"><small>{t.milestone}</small><b>{t.msGoal.replace("{lv}", lv)}</b><p>{(CANDO[st.ui] || CANDO.en)[lv]}</p><small className="soon">🔒 {t.msSoon}</small></div></div>)}
    {(!st.listJoined || lmsg === t.listOk) && <section className="card list-card"><b>✉️ {t.listTitle}</b><p>{t.listDesc}</p><form className="list-form" onSubmit={async e => { e.preventDefault(); setLmsg("…"); const r = await cloud.joinList((lmail || (user && user.email) || "").trim(), { course: course.id, lang: st.ui, source: "app" }); if (r.ok) { setLmsg(t.listOk); setSt(s => ({ ...s, listJoined: true })); ev("signup", { course: course.id, ui: "list" }); } else setLmsg(t.listFail); }}><input type="email" required aria-label={t.email} placeholder={t.email} value={lmail || (user && user.email) || ""} onChange={e => setLmail(e.target.value)} /><button className="btn primary" type="submit">{t.listBtn}</button></form>{lmsg && <p className="list-msg" role="status">{lmsg}</p>}<small>{t.listNote} <a href="/datenschutz" target="_blank" rel="noopener">{t.listPriv}</a>.</small></section>}
    <p className="muted small-note ms-note">{t.msNote}</p>
    <section className="card practice-card"><div><b>🛠️ {t.practice}</b><p>{t.practiceDesc}</p></div><button className="btn primary" onClick={() => startPractice()}>{st.mistakes.length ? st.mistakes.length : "✓"}</button></section>
    <section className="card">
      <h3>{t.quests}</h3>
      {st.quests.items.map(q => <div key={q.id} className="quest"><span>{q[st.ui] || q.de}</span><div className="bar"><i style={{ width: Math.min(100, q.prog / q.goal * 100) + "%" }} /></div><small>{q.paid ? "✓" : `${Math.min(q.prog, q.goal)}/${q.goal}`} · {q.gems}💎</small></div>)}
    </section>
    <section className="card promo-card"><span className="big-ic">⭐</span><div><b>{st.ui === "en" ? "Premium and workbook" : "Premium und Grammatikheft"}</b><p className="muted">{st.ui === "en" ? "Early Bird for life and the Swiss German workbook as PDF." : "Early Bird lebenslang und das Züridütsch-Heft als PDF."}</p></div><a className="btn primary small" href={SITE + "/grammarfirst/premium"} target={SITE ? "_blank" : undefined} rel="noopener" onClick={() => ev("premium_view")}>{st.ui === "en" ? "View" : "Ansehen"}</a></section>
    <section className="card promo-card"><span className="big-ic">👨‍🏫</span><div><b>{st.ui === "en" ? "Prefer a teacher?" : "Lieber mit Lehrer üben?"}</b><p className="muted">{st.ui === "en" ? "Private lessons with Fabio, online or in Zurich." : "Privatstunden bei Fabio, online oder in Zürich."}</p></div><a className="btn small" href={SITE + "/sprachschule/"} target={SITE ? "_blank" : undefined} rel="noopener">{st.ui === "en" ? "Trial lesson" : "Probestunde"}</a></section>
  </div>;

  // ── GRAMMAR TAB ──
  const q = libQ.trim().toLowerCase();
  const counts = { open: 0, learned: 0, solid: 0, due: 0 }; lessons.forEach(l => { counts[statusOf(st, l.id, now)]++; });
  const mcount = {}; st.mistakes.filter(m => m.c === course.id).forEach(m => { mcount[m.l] = (mcount[m.l] || 0) + 1; });
  const weak = Object.entries(mcount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, n]) => ({ l: findLesson(id), n })).filter(x => x.l && !x.l.text);
  const grammarTab = <div className="screen">
    <section className="card"><h2>📘 {t.map}</h2>
      <div className="map-bar">{["solid", "learned", "due", "open"].map(k => counts[k] ? <i key={k} className={"mb-" + k} style={{ flex: counts[k] }} title={t["st_" + k] + ": " + counts[k]} /> : null)}</div>
      <div className="map-legend">{["solid", "learned", "due", "open"].map(k => <span key={k}><i className={"dot mb-" + k} />{t["st_" + k]} <b>{counts[k]}</b></span>)}</div>
    </section>
    <section className="card"><h3>{t.weakest}</h3>{weak.length ? weak.map(({ l, n }) => <div key={l.id} className="weak-row"><span>{l.title}</span><small className="muted">{n}×</small><button className="btn small" onClick={() => startPractice([l.id])}>{t.practiceThis}</button></div>) : <p className="muted">{t.weakNone}</p>}</section>
    <input className="type-in lib-search" value={libQ} onChange={e => setLibQ(e.target.value)} placeholder={t.search} aria-label={t.search} />
    {course.units.map((u, ui) => {
      const ls = u.lessons.filter(l => !q || (l.title + " " + l.rule + " " + l.structure + " " + (l.more || "")).toLowerCase().includes(q));
      if (!ls.length) return null;
      return <section key={ui} className="lib-unit"><h3 className="unit-title">{u.title}<small className="cefr">{CEFR(ui)}</small></h3>
        {ls.map(l => { const stt = statusOf(st, l.id, now); const idx = lessons.indexOf(l); const un = isUnlocked(l, idx); return <details key={l.id} className="lib-item"><summary><span className={"dot mb-" + stt} /><b>{l.title}</b><span className="lib-str"><i style={{ width: Math.round(strengthOf(st, l.id, now) * 100) + "%" }} /></span><small className="muted">{t["st_" + stt]}</small></summary>
          <RuleCard lesson={l} course={course} t={t} lang={SPEECH[course.id]} />
          <div className="row">{un && <button className="btn primary small" onClick={() => startLesson(l)}>{st.done[l.id] ? t.reviewAll : t.learnThis}</button>}{mcount[l.id] && <button className="btn small" onClick={() => startPractice([l.id])}>{t.practiceThis} ({mcount[l.id]})</button>}</div>
        </details>; })}
      </section>; })}
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
    <section className="card account"><h3>☁️ {t.account}</h3>
      {user ? <><p>{t.loggedAs} <b>{user.email}</b></p><p className="muted small-note">{syncAt ? t.synced + " " + new Date(syncAt).toLocaleTimeString(st.ui === "en" ? "en-GB" : "de-CH", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
        <div className="row"><button className="btn small primary" onClick={async () => { if (await cloud.push(user.id, st)) { setSyncAt(Date.now()); notify(t.synced, "☁️"); } }}>{t.syncNow}</button><button className="btn small" onClick={async () => { await cloud.logout(); setUser(null); }}>{t.logout}</button><button className="btn small ghost danger-text" onClick={async () => { if (await cloud.wipe(user.id)) notify(t.wiped, "🗑️"); }}>{t.wipe}</button></div></>
        : <><p className="muted">{t.accountDesc}</p><label className="field"><span>{t.email}</span><input type="email" value={mail} onChange={e => setMail(e.target.value)} placeholder="name@example.com" autoComplete="email" /></label>
          <button className="btn primary" disabled={!/^\S+@\S+\.\S+$/.test(mail)} onClick={async () => { setMailMsg("…"); const r = await cloud.sendLink(mail.trim()); setMailMsg(r.ok ? t.linkSent : /not_authorized|rate/.test(r.code) || r.status === 429 ? t.linkLimit : t.linkFail); }}>{t.sendLink}</button>
          {mailMsg && <p className="muted small-note">{mailMsg}</p>}</>}
    </section>
    <div className="stat-grid">
      <div className="stat"><small>🔥 {t.streak}</small><b>{st.streak}</b></div>
      <div className="stat"><small>⭐ XP</small><b>{st.xp}</b></div>
      <div className="stat"><small>📚 {t.lessons}</small><b>{st.lessonsCompleted}</b></div>
      <div className="stat"><small>✨ {t.perfect.split(",")[0]}</small><b>{st.perfects}</b></div>
    </div>
    <section className="card"><h3>{t.achievements}</h3><div className="ach-grid">{ACH.map(a => { const on = st.unlockedAch[a.id]; const [n, d] = a[st.ui] || a.de; return <div key={a.id} className={"ach" + (on ? " on" : "")} title={d}><span>{a.icon}</span><b>{n}</b><small>{d}</small></div>; })}</div></section>
    <section className="card"><h3>{t.course}</h3>{COURSES.map(c => { const ls = allLessons(c); const n = ls.filter(l => st.done[l.id]).length; return <button key={c.id} className="course-row" onClick={() => { setSt({ ...st, course: c.id }); setTab("learn"); }}><Flag id={c.flag} size={26} /><span>{c.name}</span><div className="bar"><i style={{ width: n / ls.length * 100 + "%" }} /></div><small>{n}/{ls.length}</small></button>; })}</section>
    <section className="card"><h3>{t.certs}</h3>{["A1", "A2", "B1"].map(lv => { const ls = course.units.filter((u, ui) => CEFR(ui) === lv).flatMap(u => u.lessons); const ok = ls.length && ls.every(l => st.done[l.id]); return <div key={lv} className="weak-row"><span>🎓 {t.cert} {lv} · {course.name}</span>{ok ? <button className="btn small primary" onClick={() => openCert(lv)}>{t.certOpen}</button> : <small className="muted">{ls.filter(l => st.done[l.id]).length}/{ls.length}</small>}</div>; })}<p className="muted small-note">{t.certLocked}</p></section>
    <section className="card"><h3>{t.transfer}</h3><p className="muted">{t.transferDesc}</p>
      <div className="row"><button className="btn small" onClick={() => { const c = exportCode(st); setCode(c); try { navigator.clipboard.writeText(c).then(() => notify(t.copied, "📋"), () => { }); } catch (e) { } }}>{t.copy}</button><button className="btn small" onClick={() => { const n = importCode(code); if (n) { setSt(tick({ ...fresh(), ...n })); notify(t.loaded, "✅"); setCode(""); } else notify(t.badCode, "⚠️"); }}>{t.load}</button></div>
      <textarea className="type-in code-box" value={code} onChange={e => setCode(e.target.value)} rows={3} aria-label={t.transfer} />
    </section>
    <section className="card"><h3>{t.settings}</h3>
      <label className="set"><span>{t.sound}</span><input type="checkbox" checked={st.sound} onChange={e => setSt({ ...st, sound: e.target.checked })} /></label>
      <label className="set"><span>{t.lang}</span><select value={st.ui} onChange={e => setSt({ ...st, ui: e.target.value })}><option value="de">Deutsch</option><option value="en">English</option></select></label>
      <label className="set"><span>{t.explLang}</span><select value={st.expl || "en"} onChange={e => setSt({ ...st, expl: e.target.value })}><option value="en">English</option><option value="de">Deutsch</option></select></label>
      <p className="muted small-note">{t.explNote}</p>
      <label className="set"><span>{t.theme}</span><select value={st.theme || "auto"} onChange={e => setSt({ ...st, theme: e.target.value })}><option value="auto">{t.themeAuto}</option><option value="light">{t.themeLight}</option><option value="dark">{t.themeDark}</option></select></label>
      <label className="set"><span>{t.statsOpt}</span><input type="checkbox" checked={st.stats !== false} onChange={e => setSt({ ...st, stats: e.target.checked })} /></label>
      <p className="muted small-note">{t.statsNote} <a href={SITE + "/datenschutz"} target={SITE ? "_blank" : undefined} rel="noopener">{t.privacy}</a> · <a href={SITE + "/agb"} target={SITE ? "_blank" : undefined} rel="noopener">{t.terms}</a></p>
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
    <div className={"app theme-" + (st.theme || "auto")}><style>{CSS}</style>
      {hud}
      <main className="main">{tab === "learn" ? learn : tab === "grammar" ? grammarTab : tab === "league" ? league : tab === "shop" ? shop : profile}</main>
      <nav className="tabs" aria-label="GrammarFirst navigation">
        {[["learn", "🏠", t.learn], ["grammar", "📘", t.grammar], ["league", "🏅", t.league], ["shop", "💎", t.shop], ["profile", "🙂", t.profile]].map(([k, ic, lb]) => <button key={k} className={tab === k ? "on" : ""} aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}><span>{ic}</span><small>{lb}</small></button>)}
      </nav>
      {pickCourse && <div className="modal" onClick={() => setPickCourse(false)}><div className="modal-card wide" onClick={e => e.stopPropagation()}><h3>{t.chooseCourse}</h3><div className="course-grid">{COURSES.map(c => { const ls = allLessons(c); const n = ls.filter(l => st.done[l.id]).length; return <button key={c.id} className={"course-pick" + (st.course === c.id ? " on" : "")} onClick={() => { setSt({ ...st, course: c.id }); setPickCourse(false); setTab("learn"); }}><Flag id={c.flag} size={34} /><b>{c.name}</b><small>{n}/{ls.length} {t.lessons}</small></button>; })}</div></div></div>}
      {confirmReset && <div className="modal"><div className="modal-card"><Mascot mood="sad" size={80} /><p>{t.resetConfirm}</p><div className="row"><button className="btn danger" onClick={() => { const f = fresh(); setSt(tick(f)); setConfirmReset(false); setTab("learn"); }}>{t.yes}</button><button className="btn ghost" onClick={() => setConfirmReset(false)}>{t.no}</button></div></div></div>}
      {toast && <div className="toast" key={toast.k}>{toast.icon} {toast.msg}</div>}
    </div>
  );
}
