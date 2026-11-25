import { advancedUnits } from './advanced-courses';
import { expansionUnits } from './content';
import { portugueseCourse } from './content/pt';
import { starterUnits } from './content/starter';
import { alphabetLessons } from './content/alphabets';
import { basicsUnits } from './content/basics';
import { advancedMoreA } from './content/advanced-more-1';
import { advancedMoreB } from './content/advanced-more-2';
import { croatianCourse } from './content/sh';
import { indonesianCourse } from './content/id';
import { extraUnits } from './extra-units';
import data from './grammarfirst.json';
import { t } from '../../lib/i18n';

type Pair = [string, string];
type Prompt = {
  prompt: string;
  explain?: string;
  /** Read aloud and hidden while answering (listening exercise). */
  audio?: string;
  /** Accepted typed answers, kept when a typing exercise became a choice (hard mode). */
  accept?: string[];
};

export type Exercise = Prompt & (
  | { type: 'choice'; options: string[]; answer: number }
  | { type: 'build'; answer: string; extra: string[] }
  | { type: 'type'; accept: string[] }
  | { type: 'match'; pairs: Pair[] }
  | { type: 'writing'; model: string; checklist: string[] }
);

type Entry = { id: string; title: string; ex: Exercise[] };
export type Lesson = Entry & {
  rule: string;
  structure: string;
  examples: [string, string?][];
  tip: string;
  more?: string;
  table?: { head: string[]; rows: string[][] };
  /** Alphabet lesson: every letter with a sound hint and an example word. */
  alphabet?: { letter: string; sound: string; example: string; meaning?: string }[];
};
export type Reading = Entry & { text: string; tr?: string; listening?: true };

export function activityLabel(entry: Lesson | Reading) {
  if (!('text' in entry)) return t('Lesson');
  return entry.listening ? t('Listening') : t('Reading');
}
type Unit = { title: string; lessons: Lesson[]; reading?: Reading; level?: CefrLevel };
export type Course = {
  id: string;
  name: string;
  flag: string;
  units: Unit[];
};

// Learners should not have to type: every 'type' exercise becomes a multiple
// choice question. Wrong options must be plausible, so they are the answers
// that look most like the correct one (same number of words, similar
// spelling), taken from the same lesson first, then the unit, then the course.
function editDistance(a: string, b: string) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length];
}

const wordCount = (text: string) => text.trim().split(/\s+/).length;
const endsSentence = (text: string) => /[.!?…]$/.test(text.trim());

/** 0 … 1: how much a wrong option resembles the right answer. */
function resemblance(correct: string, candidate: string) {
  const a = correct.toLowerCase();
  const b = candidate.toLowerCase();
  let score = 1 - editDistance(a, b) / Math.max(a.length, b.length, 1);
  // Other forms of the same word (lerne, lernst, lernt) share the beginning.
  let shared = 0;
  while (shared < a.length && shared < b.length && a[shared] === b[shared]) shared++;
  score += 0.2 * Math.min(shared, 4) / 4;
  if (wordCount(correct) !== wordCount(candidate)) score -= 0.5;
  if (endsSentence(correct) !== endsSentence(candidate)) score -= 0.3;
  if (Math.max(a.length, b.length) > 2 * Math.min(a.length, b.length) + 2) score -= 0.3;
  // "Les" next to "le" gives the answer away: options should look alike.
  const capital = (text: string) => text.charAt(0) !== text.charAt(0).toLowerCase();
  if (capital(correct) !== capital(candidate)) score -= 0.4;
  return score;
}

/**
 * Single target-language words from a lesson's pattern and table body,
 * e.g. "me / te / le / nos" → me, te, le, nos. Words from the English
 * translations (and the table header) are left out.
 */
function patternWordsOf(lesson: Lesson) {
  const english = new Set(lesson.examples.flatMap(([, meaning]) => (meaning ?? '').toLowerCase().split(/[^\p{L}']+/u)));
  for (const word of ['singular', 'plural', 'verb', 'noun', 'infinitive', 'or', 'and', 'the', 'a', 'to', 'of']) english.add(word);
  const sources = [lesson.structure, ...(lesson.table?.rows.flat() ?? [])];
  const words = sources.flatMap((text) => (text ?? '').split(/[\s/,;:()+·=→…–-]+/))
    .map((word) => word.replace(/^[^\p{L}]+|[^\p{L}']+$/gu, ''))
    .filter((word) => word.length > 0 && !english.has(word.toLowerCase()));
  return [...new Set(words)];
}

function answersOf(entries: (Lesson | Reading)[]) {
  // Alphabet lessons hold letters and sound hints, not words: they make poor options.
  return entries.filter((entry) => !('alphabet' in entry && entry.alphabet)).flatMap((entry) => entry.ex.flatMap((exercise) =>
    exercise.type === 'type' ? [exercise.accept[0]] : exercise.type === 'choice' ? exercise.options : []));
}

function withoutTyping(course: Course): Course {
  const courseAnswers = answersOf(course.units.flatMap(entriesForUnit));
  const convert = (lessonAnswers: string[], unitAnswers: string[], patternWords: string[] = []) => (exercise: Exercise): Exercise => {
    if (exercise.type !== 'type') return exercise;
    const correct = exercise.accept[0];
    const normalized = new Set(exercise.accept.map(normalizeAnswer));
    const seen = new Set<string>();
    const ranked: { text: string; score: number }[] = [];
    const add = (pool: string[], bonus: number) => {
      for (const text of pool) {
        const key = normalizeAnswer(text);
        if (normalized.has(key) || seen.has(key)) continue;
        seen.add(key);
        ranked.push({ text, score: resemblance(correct, text) + bonus });
      }
    };
    // Forms from the lesson's own pattern and table (le → les, me, te) and
    // answers from the same lesson are the most instructive wrong answers.
    if (wordCount(correct) === 1) add(patternWords, 0.45);
    add(lessonAnswers, 0.25);
    add(unitAnswers, 0.1);
    add(courseAnswers, 0);
    const distractors = ranked.sort((x, y) => y.score - x.score || x.text.localeCompare(y.text)).slice(0, 3).map(({ text }) => text);
    if (distractors.length === 0) return exercise;
    const options = [...distractors];
    let seed = 0;
    for (let index = 0; index < exercise.prompt.length; index++) seed = (seed * 31 + exercise.prompt.charCodeAt(index)) | 0;
    const answer = Math.abs(seed) % (options.length + 1);
    options.splice(answer, 0, correct);
    // "Type: ich ___" is now a choice, so the instruction to type goes.
    return { type: 'choice', prompt: exercise.prompt.replace(/^(Type|Write)( the answer)?:\s*/i, ''), explain: exercise.explain, options, answer, accept: exercise.accept };
  };
  return {
    ...course,
    units: course.units.map((unit) => {
      const unitAnswers = answersOf(entriesForUnit(unit));
      const fix = (entry: Lesson | Reading) => entry.ex.map(convert(answersOf([entry]), unitAnswers, 'text' in entry ? [] : patternWordsOf(entry)));
      return {
        ...unit,
        lessons: unit.lessons.map((lesson) => ({ ...lesson, ex: fix(lesson) })),
        reading: unit.reading ? { ...unit.reading, ex: fix(unit.reading) } : unit.reading,
      };
    }),
  };
}

export function entriesForUnit(unit: Unit): (Lesson | Reading)[] {
  return unit.reading ? [...unit.lessons, unit.reading] : unit.lessons;
}

export const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CefrLevel = typeof cefrLevels[number];

export const cefrNames: Record<CefrLevel, string> = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper intermediate',
  C1: 'Advanced',
  C2: 'Proficient',
};

// Teaching levels for the imported unit sequence, matched to what the units
// really teach: units 1–3 are beginner grammar (to be, to have, articles,
// present tense), 4–5 elementary (cases or pronouns, first past tense),
// 6–7 intermediate (subordinate clauses, conditional, passive).
// Irish unit 5 (numbers, question words) is beginner material and therefore
// comes right after the first two units.
const courseLevels: readonly CefrLevel[] = ['A1', 'A1', 'A1', 'A2', 'A2', 'B1', 'B1'];
const irishLevels: readonly CefrLevel[] = ['A1', 'A1', 'A2', 'A2', 'A1'];

// Lessons that sat too late (or too early) in the imported sequence.
// Ids stay the same, so saved progress is not affected.
const lessonMoves: Readonly<Record<string, { id: string; unit: number; at: number }[]>> = {
  // "haben" belongs next to "sein", before the accusative and modal verbs.
  de: [{ id: 'de7', unit: 0, at: 1 }],
  // Numbers, the time and question words are first-week material;
  // the perfect tense fits with the other past lesson.
  gsw: [
    { id: 'gsw24', unit: 1, at: 2 }, { id: 'gsw25', unit: 1, at: 3 }, { id: 'gsw26', unit: 1, at: 4 },
    { id: 'gsw6', unit: 4, at: 3 },
  ],
};

function reorderLessons(course: Course): Course {
  const moves = lessonMoves[course.id];
  if (!moves) return course;
  const units = course.units.map((unit) => ({ ...unit, lessons: [...unit.lessons] }));
  for (const move of moves) {
    const from = units.find((unit) => unit.lessons.some((lesson) => lesson.id === move.id));
    if (!from) throw new Error(`Lesson to move not found: ${move.id}`);
    const [lesson] = from.lessons.splice(from.lessons.findIndex((item) => item.id === move.id), 1);
    units[move.unit].lessons.splice(move.at, 0, lesson);
  }
  return { ...course, units };
}

export function levelForUnit(course: Course, index: number) {
  const level = course.units[index].level ?? (course.id === 'ga' ? irishLevels : courseLevels)[index];
  if (!level) throw new Error(`Missing course level for ${course.id}, unit ${index + 1}`);
  return level;
}

export type CourseEntry = Lesson | Reading;

export function courseSections(course: Course, grammarOnly: boolean) {
  const byLevel = new Map<CefrLevel, CourseEntry[]>();
  course.units.forEach((unit, index) => {
    const level = levelForUnit(course, index);
    const entries = grammarOnly ? unit.lessons : entriesForUnit(unit);
    const existing = byLevel.get(level);
    if (existing) existing.push(...entries);
    else byLevel.set(level, [...entries]);
  });
  return cefrLevels.map((level) => ({ key: level, level, data: byLevel.get(level) ?? [] }));
}

export function findLesson(id: string) {
  for (const course of courses) {
    for (const [index, unit] of course.units.entries()) {
      const entry = entriesForUnit(unit).find((item) => item.id === id);
      if (entry) return { entry, course, level: levelForUnit(course, index) };
    }
  }
}

export function normalizeAnswer(answer: string) {
  return answer.normalize('NFC').trim().toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[.!?…]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function shuffled<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

// Units from all sources, each with an explicit level, ordered A1 → C2 so the
// learning path follows the CEFR levels. Sorting is stable within a level.
function withLevels(original: Course): Course {
  const course = reorderLessons(original);
  const base = course.units.map((unit, index) => ({
    ...unit,
    level: unit.level ?? (course.id === 'ga' ? irishLevels : courseLevels)[index],
  }));
  const units = [
    // Easy first steps (sounds, greetings) always come first.
    // The very first lesson of every course is its alphabet.
    ...(starterUnits[course.id] ?? []).map((unit, index) => (index === 0 && alphabetLessons[course.id]
      ? { ...unit, lessons: [alphabetLessons[course.id], ...unit.lessons] } : unit)),
    ...base,
    ...(basicsUnits[course.id] ?? []),
    ...(extraUnits[course.id] ?? []),
    ...(expansionUnits[course.id] ?? []),
    ...(advancedUnits[course.id] ?? []),
    ...(advancedMoreA[course.id] ?? []),
    ...(advancedMoreB[course.id] ?? []),
  ].map((unit, order) => ({ unit, order }))
    .sort((a, b) => cefrLevels.indexOf(a.unit.level!) - cefrLevels.indexOf(b.unit.level!) || a.order - b.order)
    // "Unit 3 · Everyday grammar" → "Everyday grammar": the path shows the
    // level as a badge and numbers would be out of order after sorting.
    .map(({ unit }) => ({ ...unit, title: unit.title.replace(/^(Unit \d+|[ABC][12]) · /, '') }));
  return { ...course, units };
}

export const courses: Course[] = [...(data as Course[]), portugueseCourse, croatianCourse, indonesianCourse].map((course) => withoutTyping(withLevels(course)));
