/**
 * GrammarBay's game layer: gems, daily quests, chests, achievements, hearts,
 * Fabio's wardrobe, a small activity diary, saved words and the offline
 * queue for lesson results. Stored on the device per account. Everything
 * that must stay fair between people (XP, leagues, streaks, duels) lives on
 * the server instead.
 */
import { useCallback, useMemo } from 'react';

import { useDeviceState } from '@/lib/device-state';
import { useSession } from '@/providers/session-provider';

import { dailyChestState, isGemWeekend } from './progression';
import { celebrate } from './celebrations';
import { useMyPlus } from '@/features/plus/api';
import { buyExtraLesson, countFreeLesson, GEM_UNLOCK_PRICE, type FreeDay } from '@/features/plus/limits';

export type DayLog = { lessons: number; perfect: number; words: number; mistakes: number; xp: number; sprints: number };
export type SavedWord = { courseId: string; word: string; meaning?: string; at: number };
export type PendingResult = { entryId: string; score: number; at: number };

export type GameState = {
  gems: number;
  owned: string[];
  equipped: { hat?: string; scarf?: string; glasses?: string };
  chests: string[];
  questChests: string[];
  achievements: Record<string, number>;
  days: Record<string, DayLog>;
  hearts: { count: number; at: number };
  saved: SavedWord[];
  sprintBest: Record<string, number>;
  boostUntil: number;
  pending: PendingResult[];
  courses: string[];
  totals: { lessons: number; perfect: number; words: number; mistakes: number; chests: number; corrections: number };
  flags: { early?: boolean; night?: boolean; leagueGold?: boolean };
  /** Word stations on the learning path that were passed ("course:unit"). */
  wordStations: string[];
  /** Stamped crossings on the learning path ("course:unit"). */
  islandCrossings: string[];
  /** Hours (0–23) of the last lessons, so reminders can come when you usually learn. */
  lessonHours: number[];
  /** Monthly challenges already completed ("2026-11:days20"). */
  challenges: string[];
  /** Daily chest calendar: last claimed day and the day number (1–7) in the row. */
  dailyChest: { last?: string; run: number };
  /** Claimed one-off rewards: weekly chests ("week:…"), season tiers ("s3:12"). */
  claims: string[];
  /** Perfect lessons in a row and personal records. */
  perfectRun: number;
  records: { bestCombo: number; bestDayXp: number; bestPerfectRun: number };
  /** Correct review answers towards earning a heart back. */
  heartProgress: number;
  /** Highest level already celebrated. */
  levelSeen: number;
  /** Free learners: new lessons above A1 started today and extra lessons bought with gems. */
  freeDay?: FreeDay;
  /** Best number of fast correct answers in one lesson. */
  fastBest?: number;
  /** Hard mode: type the answers instead of choosing (double gems). */
  hardMode?: boolean;
  hardLessons?: number;
  /** Mistakes fixed in second-chance rounds. */
  secondFixed?: number;
  /** Day the last comeback chest was claimed. */
  comeback?: string;
  /** Lessons finished in hard mode with 100% ("legendary"). */
  legendary?: string[];
  /** Fastest memory game in seconds. */
  memoryBest?: number;
  memoryGames?: number;
};

export const MAX_HEARTS = 5;
const HEART_MINUTES = 30;

const initial: GameState = {
  gems: 0,
  owned: [],
  equipped: {},
  chests: [],
  questChests: [],
  achievements: {},
  days: {},
  hearts: { count: MAX_HEARTS, at: 0 },
  saved: [],
  sprintBest: {},
  boostUntil: 0,
  pending: [],
  courses: [],
  totals: { lessons: 0, perfect: 0, words: 0, mistakes: 0, chests: 0, corrections: 0 },
  flags: {},
  wordStations: [],
  islandCrossings: [],
  lessonHours: [],
  challenges: [],
  dailyChest: { run: 0 },
  claims: [],
  perfectRun: 0,
  records: { bestCombo: 0, bestDayXp: 0, bestPerfectRun: 0 },
  heartProgress: 0,
  levelSeen: 1,
};

const emptyDay: DayLog = { lessons: 0, perfect: 0, words: 0, mistakes: 0, xp: 0, sprints: 0 };

export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Hearts refill by one every 30 minutes up to five. */
export function currentHearts(hearts: GameState['hearts'], now = Date.now()) {
  if (hearts.count >= MAX_HEARTS) return { count: MAX_HEARTS, nextIn: 0 };
  const step = HEART_MINUTES * 60_000;
  const gained = Math.floor((now - hearts.at) / step);
  const count = Math.min(MAX_HEARTS, hearts.count + Math.max(gained, 0));
  const nextIn = count >= MAX_HEARTS ? 0 : step - ((now - hearts.at) % step);
  return { count, nextIn };
}

// ---------- achievements ----------

export type Achievement = { id: string; icon: string; title: string; description: string; done: (s: GameState, streak: number) => boolean };

export const achievements: Achievement[] = [
  { id: 'first-lesson', icon: '🎉', title: 'First steps', description: 'Finish your first lesson.', done: (s) => s.totals.lessons >= 1 },
  { id: 'lessons-25', icon: '📚', title: 'Bookworm', description: 'Finish 25 lessons.', done: (s) => s.totals.lessons >= 25 },
  { id: 'perfect-10', icon: '💯', title: 'Perfectionist', description: 'Finish 10 lessons with 100%.', done: (s) => s.totals.perfect >= 10 },
  { id: 'early-bird', icon: '🌅', title: 'Early bird', description: 'Finish a lesson before 8:00.', done: (s) => !!s.flags.early },
  { id: 'night-owl', icon: '🦉', title: 'Night owl', description: 'Finish a lesson after 22:00.', done: (s) => !!s.flags.night },
  { id: 'words-100', icon: '🧠', title: 'Word collector', description: 'Get 100 words right in the trainer.', done: (s) => s.totals.words >= 100 },
  { id: 'mistakes-20', icon: '🔁', title: 'Comeback', description: 'Fix 20 mistakes in your review.', done: (s) => s.totals.mistakes >= 20 },
  { id: 'streak-7', icon: '🔥', title: 'One week strong', description: 'Reach a 7-day streak.', done: (_s, streak) => streak >= 7 },
  { id: 'streak-30', icon: '🌋', title: 'Unstoppable', description: 'Reach a 30-day streak.', done: (_s, streak) => streak >= 30 },
  { id: 'polyglot', icon: '🌍', title: 'Polyglot', description: 'Start lessons in 3 languages.', done: (s) => s.courses.length >= 3 },
  { id: 'chests-5', icon: '🎁', title: 'Treasure hunter', description: 'Open 5 chests.', done: (s) => s.totals.chests >= 5 },
  { id: 'sprint-20', icon: '⚡', title: 'Speedster', description: 'Score 20 points in a sprint.', done: (s) => Object.values(s.sprintBest).some((score) => score >= 20) },
  { id: 'saved-20', icon: '📒', title: 'Word keeper', description: 'Save 20 words to your dictionary.', done: (s) => s.saved.length >= 20 },
  { id: 'helpful', icon: '✍️', title: 'Helpful', description: 'Correct 10 messages for your partners.', done: (s) => s.totals.corrections >= 10 },
  { id: 'league-gold', icon: '🥇', title: 'Golden week', description: 'Reach the Gold league in a week.', done: (s) => !!s.flags.leagueGold },
  { id: 'combo-10', icon: '🔥', title: 'On fire', description: 'Get 10 answers right in a row.', done: (s) => (s.records?.bestCombo ?? 0) >= 10 },
  { id: 'perfect-run-5', icon: '🎯', title: 'Flawless', description: 'Finish 5 lessons in a row with 100%.', done: (s) => (s.records?.bestPerfectRun ?? 0) >= 5 },
  { id: 'chest-week', icon: '📅', title: 'Regular', description: 'Open the daily chest 7 days in a row.', done: (s) => (s.dailyChest?.run ?? 0) >= 7 },
  { id: 'level-10', icon: '🧭', title: 'Globetrotter', description: 'Reach level 10.', done: (s) => (s.levelSeen ?? 1) >= 10 },
  { id: 'level-25', icon: '🌟', title: 'Language pro', description: 'Reach level 25.', done: (s) => (s.levelSeen ?? 1) >= 25 },
  { id: 'season-10', icon: '🎟️', title: 'Season ticket', description: 'Reach tier 10 in a season.', done: (s) => (s.claims ?? []).some((id) => /^s\d+:(1[0-9]|20)$/.test(id)) },
  { id: 'saved-100', icon: '🗃️', title: 'Archivist', description: 'Save 100 words and sentences.', done: (s) => s.saved.length >= 100 },
  { id: 'hardcore', icon: '⌨️', title: 'Hardcore', description: 'Finish 10 lessons in hard mode.', done: (s) => (s.hardLessons ?? 0) >= 10 },
  { id: 'speedster', icon: '⚡', title: 'Speedster', description: 'Give 8 fast right answers in one lesson.', done: (s) => (s.fastBest ?? 0) >= 8 },
  { id: 'second-chance', icon: '🔁', title: 'Never give up', description: 'Fix 10 mistakes in second-chance rounds.', done: (s) => (s.secondFixed ?? 0) >= 10 },
  { id: 'legendary-1', icon: '🏆', title: 'Legend', description: 'Make a lesson legendary: hard mode with 100%.', done: (s) => (s.legendary ?? []).length >= 1 },
  { id: 'legendary-10', icon: '👑', title: 'Hall of fame', description: 'Make 10 lessons legendary.', done: (s) => (s.legendary ?? []).length >= 10 },
  { id: 'memory-45', icon: '🧠', title: 'Memory master', description: 'Finish the memory game in under 45 seconds.', done: (s) => !!s.memoryBest && s.memoryBest < 45 },
  { id: 'comeback', icon: '🦸', title: 'The comeback', description: 'Come back after 3 days away.', done: (s) => !!s.comeback },
];

const ACHIEVEMENT_GEMS = 20;

/** Adds newly earned achievements, gives gems and celebrates them. */
function withAchievements(state: GameState, streak = 0): GameState {
  let next = state;
  for (const achievement of achievements) {
    if (next.achievements[achievement.id] || !achievement.done(next, streak)) continue;
    next = {
      ...next,
      gems: next.gems + ACHIEVEMENT_GEMS,
      achievements: { ...next.achievements, [achievement.id]: Date.now() },
    };
    celebrate({ icon: achievement.icon, title: 'New badge!', message: achievement.title, gems: ACHIEVEMENT_GEMS });
  }
  return next;
}

// ---------- daily quests ----------

export type Quest = { id: string; icon: string; title: string; goal: number; value: (day: DayLog) => number };

const questPool: Quest[] = [
  { id: 'xp30', icon: '⚡', title: 'Earn 30 XP', goal: 30, value: (d) => d.xp },
  { id: 'words10', icon: '🧠', title: 'Get 10 words right', goal: 10, value: (d) => d.words },
  { id: 'perfect1', icon: '💯', title: 'Finish a lesson with 100%', goal: 1, value: (d) => d.perfect },
  { id: 'mistakes3', icon: '🔁', title: 'Fix 3 mistakes', goal: 3, value: (d) => d.mistakes },
  { id: 'sprint1', icon: '⏱️', title: 'Play a sprint', goal: 1, value: (d) => d.sprints },
];
const lessonQuest: Quest = { id: 'lessons2', icon: '📘', title: 'Finish 2 lessons', goal: 2, value: (d) => d.lessons };

/** Three quests per day: always lessons, plus two that change daily. */
export function questsFor(key: string): Quest[] {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  const first = Math.abs(hash) % questPool.length;
  const second = (first + 1 + (Math.abs(hash >> 3) % (questPool.length - 1))) % questPool.length;
  return [lessonQuest, questPool[first], questPool[second === first ? (first + 1) % questPool.length : second]];
}

export const QUEST_CHEST_GEMS = 30;
export const COMEBACK_GEMS = 30;
export const LEGENDARY_GEMS = 20;
export const HINT_PRICE = 5;

/** True when the last learning day was 3 or more days ago (and a lesson happened before at all). */
export function comebackDue(s: GameState, today = dayKey()) {
  if (s.comeback === today) return false;
  const active = Object.entries(s.days ?? {}).filter(([day, log]) => day < today && (log.lessons > 0 || log.words > 0)).map(([day]) => day).sort();
  const last = active[active.length - 1];
  if (!last || (s.comeback && s.comeback > last)) return false;
  const gap = (Date.parse(today) - Date.parse(last)) / 86_400_000;
  return gap >= 3;
}
export const UNIT_CHEST_GEMS = 20;

// ---------- the hook ----------

export function useGame() {
  const { user } = useSession();
  const { isPlus } = useMyPlus();
  const [stored, write] = useDeviceState<GameState>(user?.id, 'game', initial);
  const state = useMemo<GameState>(() => ({
    ...initial,
    ...stored,
    totals: { ...initial.totals, ...stored.totals },
    flags: { ...initial.flags, ...stored.flags },
    hearts: stored.hearts ?? initial.hearts,
    wordStations: stored.wordStations ?? [],
    islandCrossings: stored.islandCrossings ?? [],
    dailyChest: stored.dailyChest ?? initial.dailyChest,
    claims: stored.claims ?? [],
    records: { ...initial.records, ...stored.records },
  }), [stored]);

  const update = useCallback((change: (state: GameState) => GameState) => {
    write((current) => {
      const base = { ...initial, ...(current ?? {}) } as GameState;
      return change({ ...base, totals: { ...initial.totals, ...base.totals }, flags: { ...initial.flags, ...base.flags } });
    });
  }, [write]);

  const bumpDay = (s: GameState, change: Partial<DayLog>): GameState => {
    const key = dayKey();
    const day = { ...emptyDay, ...s.days[key] };
    for (const [field, amount] of Object.entries(change) as [keyof DayLog, number][]) day[field] += amount;
    // Keep about two months of diary.
    const days = Object.fromEntries(Object.entries({ ...s.days, [key]: day }).sort().slice(-60));
    return { ...s, days };
  };

  const recordLesson = useCallback((info: { courseId: string; score: number; xp: number; streak: number; boostUntil?: number; hard?: boolean }) => {
    update((s) => {
      const hour = new Date().getHours();
      const perfect = info.score === 100;
      // The first lesson of the day gets a small kick-off bonus.
      const firstToday = !(s.days[dayKey()]?.lessons);
      let next = bumpDay(s, { lessons: 1, perfect: perfect ? 1 : 0, xp: info.xp });
      // Gems: double for Plus, double again on gem weekends.
      const weekendBonus = isGemWeekend() ? 2 : 1;
      const perfectRun = perfect ? (s.perfectRun ?? 0) + 1 : 0;
      // Three perfect lessons in a row pay a bonus.
      const runBonus = perfect && perfectRun % 3 === 0 ? 15 : 0;
      if (runBonus) celebrate({ icon: '💯', title: 'Perfect streak!', message: `${perfectRun}× 100%`, gems: runBonus });
      // Variable reward: about one lesson in eight drops a lucky chest.
      const lucky = !runBonus && Math.random() < 0.125 ? 5 + 5 * Math.floor(Math.random() * 5) : 0;
      if (lucky) celebrate({ icon: '🍀', title: 'Lucky chest!', message: 'A surprise for your lesson.', gems: lucky });
      const records = { ...initial.records, ...s.records };
      next = {
        ...next,
        gems: next.gems + (5 + (perfect ? 5 : 0)) * (isPlus ? 2 : 1) * weekendBonus * (info.hard ? 2 : 1) + runBonus + lucky + (firstToday ? 5 : 0),
        hardLessons: (s.hardLessons ?? 0) + (info.hard ? 1 : 0),
        courses: next.courses.includes(info.courseId) ? next.courses : [...next.courses, info.courseId],
        totals: { ...next.totals, lessons: next.totals.lessons + 1, perfect: next.totals.perfect + (perfect ? 1 : 0) },
        flags: { ...next.flags, early: next.flags.early || hour < 8, night: next.flags.night || hour >= 22 },
        boostUntil: info.boostUntil ?? next.boostUntil,
        lessonHours: [...(next.lessonHours ?? []), hour].slice(-20),
        perfectRun,
        records: {
          ...records,
          bestPerfectRun: Math.max(records.bestPerfectRun, perfectRun),
          bestDayXp: Math.max(records.bestDayXp, next.days[dayKey()]?.xp ?? 0),
        },
      };
      return withAchievements(next, info.streak);
    });
  }, [update, isPlus]);

  const recordWord = useCallback((correct: boolean) => {
    if (!correct) return;
    update((s) => {
      // Every 3 words you know earn a heart back.
      const hearts = currentHearts(s.hearts);
      const progress = (s.heartProgress ?? 0) + 1;
      const refill = progress >= 3 && hearts.count < MAX_HEARTS;
      return withAchievements({
        ...bumpDay(s, { words: 1 }),
        totals: { ...s.totals, words: s.totals.words + 1 },
        heartProgress: refill || hearts.count >= MAX_HEARTS ? 0 : progress,
        hearts: refill ? { count: hearts.count + 1, at: Date.now() } : s.hearts,
      });
    });
  }, [update]);

  /** Combo inside a lesson: records and small gem bonuses at 5 and 10 in a row. */
  const recordCombo = useCallback((combo: number) => {
    update((s) => {
      const records = { ...initial.records, ...s.records };
      const bonus = combo === 5 ? 3 : combo === 10 ? 8 : combo === 20 ? 15 : 0;
      if (!bonus && combo <= records.bestCombo) return s;
      return withAchievements({ ...s, gems: s.gems + bonus, records: { ...records, bestCombo: Math.max(records.bestCombo, combo) } });
    });
  }, [update]);

  const claimDailyChest = useCallback(() => {
    update((s) => {
      const chest = dailyChestState(s.dailyChest?.last, s.dailyChest?.run ?? 0);
      if (chest.claimedToday) return s;
      const gems = chest.reward * (isPlus ? 2 : 1);
      celebrate({ icon: chest.day === 7 ? '🏆' : '🎁', title: 'Daily chest', message: `Day ${chest.day}/7`, gems });
      return withAchievements({ ...s, gems: s.gems + gems, dailyChest: { last: chest.todayKey, run: chest.day } });
    });
  }, [update, isPlus]);

  /** One-off rewards (weekly chest, season tiers). Each id pays only once. */
  const claimReward = useCallback((id: string, gems: number, icon: string, title: string) => {
    update((s) => {
      if ((s.claims ?? []).includes(id)) return s;
      celebrate({ icon, title, message: '', gems });
      return withAchievements({ ...s, gems: s.gems + gems, claims: [...(s.claims ?? []), id].slice(-300) });
    });
  }, [update]);

  const markLevelSeen = useCallback((level: number) => {
    update((s) => level <= (s.levelSeen ?? 1) ? s : withAchievements({ ...s, levelSeen: level }));
  }, [update]);

  const recordMistakeFixed = useCallback(() => {
    update((s) => {
      const hearts = currentHearts(s.hearts);
      const next = {
        ...bumpDay(s, { mistakes: 1 }),
        totals: { ...s.totals, mistakes: s.totals.mistakes + 1 },
        // Fixing a mistake refills a heart.
        hearts: { count: Math.min(MAX_HEARTS, hearts.count + 1), at: Date.now() },
      };
      return withAchievements(next);
    });
  }, [update]);

  /** Pays gems for a hint. Returns false when there are not enough. */
  const spendGems = useCallback((amount: number) => {
    if (state.gems < amount) return false;
    update((s) => ({ ...s, gems: Math.max(0, s.gems - amount) }));
    return true;
  }, [update, state.gems]);

  const setHardMode = useCallback((on: boolean) => {
    update((s) => ({ ...s, hardMode: on }));
  }, [update]);

  const recordSecondFixed = useCallback((fixed: number) => {
    if (fixed <= 0) return;
    update((s) => withAchievements({ ...s, secondFixed: (s.secondFixed ?? 0) + fixed }));
  }, [update]);

  /** Hard mode and 100%: the lesson becomes legendary (once). */
  const markLegendary = useCallback((id: string) => {
    update((s) => {
      if ((s.legendary ?? []).includes(id)) return s;
      celebrate({ icon: '🏆', title: 'Legendary!', message: 'Hard mode without a single mistake.', gems: LEGENDARY_GEMS });
      return withAchievements({ ...s, gems: s.gems + LEGENDARY_GEMS, legendary: [...(s.legendary ?? []), id] });
    });
  }, [update]);

  const recordMemory = useCallback((seconds: number) => {
    update((s) => {
      const best = s.memoryBest;
      if (best && seconds < best) celebrate({ icon: '🧠', title: 'New memory record!', message: `${seconds} s` });
      return withAchievements({ ...s, gems: s.gems + 5, memoryGames: (s.memoryGames ?? 0) + 1, memoryBest: best ? Math.min(best, seconds) : seconds });
    });
  }, [update]);

  /** Back after 3+ days away: a welcome-back chest, once per return. */
  const claimComeback = useCallback(() => {
    update((s) => {
      if (!comebackDue(s)) return s;
      celebrate({ icon: '🎁', title: 'Welcome back!', message: 'A chest for your comeback.', gems: COMEBACK_GEMS });
      return withAchievements({ ...s, gems: s.gems + COMEBACK_GEMS, comeback: dayKey() });
    });
  }, [update]);

  /** Counts a new lesson above A1 against today's free lessons. */
  const startFreeLesson = useCallback((id: string) => {
    update((s) => ({ ...s, freeDay: countFreeLesson(s.freeDay, dayKey(), id) }));
  }, [update]);

  /** One extra free lesson today for gems. Returns false when not possible. */
  const buyLessonWithGems = useCallback(() => {
    if (state.gems < GEM_UNLOCK_PRICE) return false;
    const next = buyExtraLesson(state.freeDay, dayKey());
    if (!next) return false;
    update((s) => ({ ...s, gems: s.gems - GEM_UNLOCK_PRICE, freeDay: buyExtraLesson(s.freeDay, dayKey()) ?? s.freeDay }));
    return true;
  }, [update, state.gems, state.freeDay]);

  /** A missed question answered right in the second-chance round gives a heart back. */
  const refundHeart = useCallback(() => {
    if (isPlus) return;
    update((s) => {
      const hearts = currentHearts(s.hearts);
      return { ...s, hearts: { count: Math.min(MAX_HEARTS, hearts.count + 1), at: Date.now() } };
    });
  }, [update, isPlus]);

  const recordFast = useCallback((fast: number) => {
    update((s) => fast <= (s.fastBest ?? 0) ? s : withAchievements({ ...s, fastBest: fast }));
  }, [update]);

  const loseHeart = useCallback(() => {
    // Plus members have unlimited hearts.
    if (isPlus) return;
    update((s) => {
      const hearts = currentHearts(s.hearts);
      return { ...s, hearts: { count: Math.max(0, hearts.count - 1), at: hearts.count >= MAX_HEARTS ? Date.now() : s.hearts.at } };
    });
  }, [update, isPlus]);

  const recordSprint = useCallback((courseId: string, score: number) => {
    update((s) => {
      const best = s.sprintBest[courseId] ?? 0;
      if (score > best && best > 0) celebrate({ icon: '⏱️', title: 'New sprint record!', message: String(score) });
      return withAchievements({ ...bumpDay(s, { sprints: 1 }), sprintBest: { ...s.sprintBest, [courseId]: Math.max(best, score) } });
    });
  }, [update]);

  const passWordStation = useCallback((key: string) => {
    update((s) => ((s.wordStations ?? []).includes(key) ? s : { ...s, gems: s.gems + 5, wordStations: [...(s.wordStations ?? []), key] }));
  }, [update]);

  const stampIslandCrossing = useCallback((key: string) => {
    update((s) => {
      const stamps = s.islandCrossings ?? [];
      return stamps.includes(key) ? s : { ...s, islandCrossings: [...stamps, key] };
    });
  }, [update]);

  const openUnitChest = useCallback((key: string) => {
    update((s) => {
      if (s.chests.includes(key)) return s;
      celebrate({ icon: '🎁', title: 'Chest opened!', message: '', gems: UNIT_CHEST_GEMS });
      return withAchievements({
        ...s,
        gems: s.gems + UNIT_CHEST_GEMS,
        chests: [...s.chests, key],
        totals: { ...s.totals, chests: s.totals.chests + 1 },
      });
    });
  }, [update]);

  const openQuestChest = useCallback(() => {
    const key = dayKey();
    update((s) => {
      if (s.questChests.includes(key)) return s;
      celebrate({ icon: '🏆', title: 'Daily quests done!', message: '', gems: QUEST_CHEST_GEMS });
      return withAchievements({
        ...s,
        gems: s.gems + QUEST_CHEST_GEMS,
        questChests: [...s.questChests.slice(-30), key],
        totals: { ...s.totals, chests: s.totals.chests + 1 },
      });
    });
  }, [update]);

  const buy = useCallback((id: string, price: number, slot: keyof GameState['equipped']) => {
    update((s) => {
      if (s.owned.includes(id)) return { ...s, equipped: { ...s.equipped, [slot]: id } };
      if (s.gems < price) return s;
      celebrate({ icon: '🛍️', title: 'New item for Fabio!', message: '' });
      return { ...s, gems: s.gems - price, owned: [...s.owned, id], equipped: { ...s.equipped, [slot]: id } };
    });
  }, [update]);

  const addGems = useCallback((amount: number) => {
    update((s) => ({ ...s, gems: s.gems + amount }));
  }, [update]);

  const unequip = useCallback((slot: keyof GameState['equipped']) => {
    update((s) => ({ ...s, equipped: { ...s.equipped, [slot]: undefined } }));
  }, [update]);

  const completeChallenge = useCallback((id: string, gems: number) => {
    update((s) => (s.challenges ?? []).includes(id) ? s : { ...s, challenges: [...(s.challenges ?? []), id], gems: s.gems + gems });
  }, [update]);

  const toggleSaved = useCallback((word: SavedWord) => {
    update((s) => {
      const exists = s.saved.some((item) => item.courseId === word.courseId && item.word === word.word);
      const saved = exists
        ? s.saved.filter((item) => !(item.courseId === word.courseId && item.word === word.word))
        : [...s.saved, word];
      return withAchievements({ ...s, saved });
    });
  }, [update]);

  const setCorrections = useCallback((count: number) => {
    update((s) => (s.totals.corrections === count ? s : withAchievements({ ...s, totals: { ...s.totals, corrections: count } })));
  }, [update]);

  const markLeagueGold = useCallback(() => {
    update((s) => (s.flags.leagueGold ? s : withAchievements({ ...s, flags: { ...s.flags, leagueGold: true } })));
  }, [update]);

  const queueResult = useCallback((result: PendingResult) => {
    update((s) => ({ ...s, pending: [...s.pending.filter((item) => item.entryId !== result.entryId), result] }));
  }, [update]);

  const clearPending = useCallback((entryId: string) => {
    update((s) => ({ ...s, pending: s.pending.filter((item) => item.entryId !== entryId) }));
  }, [update]);

  return {
    state,
    today: { ...emptyDay, ...state.days[dayKey()] },
    hearts: isPlus ? { count: MAX_HEARTS, nextIn: 0 } : currentHearts(state.hearts),
    isPlus,
    recordLesson, recordWord, recordMistakeFixed, loseHeart, recordSprint,
    openUnitChest, openQuestChest, buy, unequip, addGems, passWordStation, stampIslandCrossing, toggleSaved, completeChallenge, recordCombo, claimDailyChest, claimReward, markLevelSeen, setCorrections, markLeagueGold,
    queueResult, clearPending, startFreeLesson, buyLessonWithGems, refundHeart, recordFast,
    spendGems, setHardMode, recordSecondFixed, claimComeback, markLegendary, recordMemory,
  };
}
