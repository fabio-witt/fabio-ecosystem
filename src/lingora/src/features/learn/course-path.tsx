import { router } from 'expo-router';
import { Fragment, useEffect, useState } from 'react';
import type React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Flag } from '@/components/flag';
import { HintStat } from '@/components/hint';
import { crownsFor } from '@/features/game/progression';
import { Medved, MedvedSays } from '@/components/medved';
import { useBob, useWiggle } from '@/components/motion';
import { dayKey, useGame } from '@/features/game/store';
import { AppText } from '@/components/ui';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';

import { activityLabel, cefrNames, entriesForUnit, levelForUnit, type CefrLevel, type Course, type CourseEntry } from './catalog';
import { GrammarLibrary, RuleCard } from './grammar-library';
import { CourseVocabulary } from '@/features/vocabulary/course-vocabulary';
import { activityDuration, nextLesson } from './next-lesson';
import { starsForScore, useCompletions, useLearnSummary } from './progress';
import { getUiLanguage, t } from '@/lib/i18n';
import { medvedPhrases } from './medved-phrases';
import { CourseStories } from './stories';
import { EXAM_PASS, examId, lastUnitOfLevel, levelBelow, wordStationKey, wordStations } from './exams';
import { levelColors } from './badges';
import { GameHelp } from '@/features/game/game-help';
import { paywallActive } from '@/features/plus/config';
import { FREE_DAILY_LESSONS, lessonsLeft } from '@/features/plus/limits';

type Props = {
  course: Course;
  onBack: () => void;
  startingLevel?: string | null;
  scores?: Record<string, number>;
  progressUnavailable: boolean;
};

type NodeState = 'done' | 'current' | 'available' | 'locked';

const tabs = [
  { id: 'path', label: 'Path', icon: '🗺' },
  { id: 'grammar', label: 'Grammar', icon: '📘' },
  { id: 'words', label: 'Words', icon: '🗂' },
  { id: 'stories', label: 'Stories', icon: '📖' },
] as const;
type Tab = typeof tabs[number]['id'];

// Horizontal offsets that make the lesson path wind left and right.
const zigzag = [0, 44, 64, 44, 0, -44, -64, -44];
const NODE_SIZE = 70;
// Finished lessons turn gold, as in GrammarFirst.
const GOLD = '#F2B705';
const GOLD_EDGE = '#B98A00';

/** Every unit gets its own color, icon and scenery, so the path feels like a journey. */
type UnitTheme = { main: string; edge: string; icon: string; deco: [string, string] };
const UNIT_THEMES: UnitTheme[] = [
  { main: '#16B39B', edge: '#0E8A77', icon: '🌱', deco: ['🌿', '🍃'] },
  { main: '#7C5CFF', edge: '#5B3FD6', icon: '🗣️', deco: ['💬', '✨'] },
  { main: '#FF8A00', edge: '#C96A00', icon: '🏠', deco: ['🌻', '🏡'] },
  { main: '#2D8CFF', edge: '#1C64C2', icon: '🧭', deco: ['🌊', '⛵'] },
  { main: '#E2457A', edge: '#B12E5C', icon: '⏰', deco: ['🌸', '🎈'] },
  { main: '#0FA3B1', edge: '#0A7782', icon: '🗺️', deco: ['🏝️', '🐚'] },
  { main: '#8E5CD9', edge: '#6A3FB0', icon: '⏳', deco: ['🌙', '⭐'] },
  { main: '#E8590C', edge: '#B04306', icon: '🚀', deco: ['🪐', '☄️'] },
  { main: '#2F9E44', edge: '#237A34', icon: '🏔️', deco: ['🌲', '🦌'] },
  { main: '#D6336C', edge: '#A61E4D', icon: '🎭', deco: ['🎶', '🎨'] },
  { main: '#1971C2', edge: '#124F8A', icon: '🏛️', deco: ['📜', '🏺'] },
  { main: '#C08A00', edge: '#8F6700', icon: '👑', deco: ['💎', '🏆'] },
];

type PathItem = { key: string; offset: number; done: boolean; node: React.ReactNode };

function openEntry(entry: CourseEntry) {
  router.push({ pathname: '/lesson/[id]', params: { id: entry.id } });
}

/** Duolingo-style path: one winding column of lesson nodes per unit. */
export function CoursePath({ course, onBack, startingLevel, scores, progressUnavailable }: Props) {
  const { styles } = useThemedStyles(createStyles);
  const scroll = useScrollPosition(`course-path:${course.id}`);
  const summary = useLearnSummary().data;
  const game = useGame();
  const completions = useCompletions();
  const phrases = medvedPhrases(course.id, getUiLanguage());
  const [tab, setTab] = useState<Tab>('path');
  const [openUnits, setOpenUnits] = useState<Set<number>>(() => new Set());
  const [help, setHelp] = useState(false);

  function toggleUnit(index: number) {
    setOpenUnits((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const units = course.units.map((unit, index) => ({
    unit,
    level: levelForUnit(course, index),
    entries: entriesForUnit(unit),
  }));
  const allEntries = units.flatMap(({ entries }) => entries);
  const isDone = (entry: CourseEntry) => scores?.[entry.id] !== undefined;
  const current = nextLesson(course, startingLevel, scores);
  const currentIndex = allEntries.findIndex((entry) => entry.id === current?.id);
  const completed = allEntries.filter(isDone).length;
  const percent = allEntries.length ? Math.round((completed / allEntries.length) * 100) : 0;

  function stateOf(entry: CourseEntry, position: number): NodeState {
    if (isDone(entry)) return 'done';
    if (currentIndex < 0 || position < currentIndex) return 'available';
    return position === currentIndex ? 'current' : 'locked';
  }

  const stations = wordStations(course);
  const levelEnds = lastUnitOfLevel(course);
  let position = 0;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.statsRow}>
          <Stat icon={streakIcon(summary?.streak ?? 0)} value={summary?.streak ?? 0} label={t("Day streak")}
            hint={t('Your streak: days in a row with your daily goal reached. Learn today so it keeps going.')} />
          <Stat icon="💎" value={game.state.gems} label={t('Gems')}
            hint={t('You earn gems with lessons, chests and challenges. Spend them in the shop on outfits for Fabio.')} />
          <Stat icon="❤️" value={game.isPlus ? '∞' : game.hearts.count} label={t('Hearts')}
            hint={game.isPlus ? t('With Plus your hearts never run out.') : t('Hearts are your lives. Every mistake in a lesson costs one; one comes back every 30 minutes.')} />
          <Stat
            icon="🎯"
            value={`${Math.min(summary?.daily_xp ?? 0, summary?.daily_goal_xp ?? 20)}/${summary?.daily_goal_xp ?? 20}`}
            label={t("Daily goal")}
            hint={t('XP you collected today towards your daily goal. Reach it and the day counts for your streak.')}
          />
          {paywallActive && !game.isPlus ? (
            <Stat icon="🎟" value={lessonsLeft(game.state.freeDay, dayKey())} label={t('Free lessons')}
              hint={t('A1 is always free. From A2 on you can start {n} new lessons per day for free, repeats do not count. Plus removes the limit.', { n: FREE_DAILY_LESSONS })} />
          ) : null}
          <Pressable onPress={() => setHelp(true)} accessibilityRole="button" accessibilityLabel={t('What do the symbols mean?')} hitSlop={8} style={styles.helpDot}>
            <AppText variant="small" style={styles.bold}>?</AppText>
          </Pressable>
        </View>
      </View>
      <GameHelp visible={help} onClose={() => setHelp(false)} />

      <View style={styles.tabs} accessibilityRole="tablist">
        {tabs.map((item) => {
          const selected = tab === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setTab(item.id)}
              style={({ pressed }) => [styles.tab, selected && styles.tabActive, pressed && styles.tabPressed]}
            >
              <AppText style={styles.tabIcon} accessible={false}>{item.icon}</AppText>
              <AppText variant="small" numberOfLines={1} style={styles.bold} color={selected ? 'primary' : 'textSecondary'}>
                {t(item.label)}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {tab === 'grammar' ? <GrammarLibrary course={course} scores={scores} /> : null}
      {tab === 'words' ? <CourseVocabulary course={course} /> : null}
      {tab === 'stories' ? <CourseStories course={course} scores={scores ?? {}} /> : null}

      {tab === 'path' ? (
      <ScrollView {...scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.courseCard}>
          <View style={styles.courseTitleRow}>
            <Flag emoji={course.flag} size={44} />
            <View style={styles.flex}>
              <AppText variant="heading" color="onPrimary" accessibilityRole="header">{t(course.name)}</AppText>
              <AppText variant="caption" color="onPrimary" style={styles.courseMeta}>
                {t('{done} of {total} lessons · {percent}% complete', { done: completed, total: allEntries.length, percent })}
              </AppText>
            </View>
          </View>
          <View style={styles.courseTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }}>
            <View style={[styles.courseFill, { width: `${Math.max(3, percent)}%` }]} />
          </View>
          <View style={styles.courseActions}>
            {current ? (
              <Pressable
                onPress={() => openEntry(current)}
                accessibilityRole="button"
                accessibilityLabel={t('Start {title}', { title: current.title })}
                style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
              >
                <AppText variant="caption" style={[styles.bold, styles.onSuccess]}>{t("Start")}</AppText>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => router.push({ pathname: '/course-search', params: { courseId: course.id } })}
              accessibilityRole="button"
              accessibilityLabel={t("Search this course")}
              style={({ pressed }) => [styles.changeButton, pressed && styles.pressed]}
            >
              <AppText variant="caption" color="onPrimary">🔍</AppText>
            </Pressable>
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel={t("Change language")}
              style={({ pressed }) => [styles.changeButton, pressed && styles.pressed]}
            >
              <AppText variant="caption" color="onPrimary">{t("Change")}</AppText>
            </Pressable>
          </View>
        </View>

        <MedvedSays
          mood={summary?.goal_done_today ? 'cheer' : 'happy'}
          message={summary?.goal_done_today
            ? t("Daily goal done! Want to keep going?")
            : current
              ? t('{hello} Ready for “{title}”?', { hello: phrases.hello, title: current.title })
              : t('You finished this course. {praise}', { praise: phrases.praise })}
        />
        {progressUnavailable ? (
          <AppText color="danger">{t("Saved progress could not be loaded on this device.")}</AppText>
        ) : null}

        {units.map(({ unit, level, entries }, unitIndex) => {
          const theme = UNIT_THEMES[unitIndex % UNIT_THEMES.length];
          const newLevel = unitIndex === 0 || units[unitIndex - 1].level !== level;
          const station = stations.get(unitIndex);
          const stationDone = game.state.wordStations.includes(wordStationKey(course.id, unitIndex));
          const items: PathItem[] = [];
          entries.forEach((entry, entryIndex) => {
            const state = stateOf(entry, position++);
            const offset = zigzag[entryIndex % zigzag.length];
            const lessonItem: PathItem = {
              key: entry.id, offset, done: state === 'done',
              node: (
                <PathNode key={entry.id} entry={entry} state={state} number={entryIndex + 1} offset={offset} theme={theme}
                  score={scores?.[entry.id]} crowns={crownsFor(completions.data?.[entry.id])}
                  legendary={!!game.state.legendary?.includes(entry.id)} />
              ),
            };
            // The word station comes after the grammar lessons, right before the story.
            const isStationSpot = station && ('text' in entry || (entryIndex === entries.length - 1 && !unit.reading));
            const stationItem: PathItem | null = isStationSpot ? {
              key: `${entry.id}-words`, offset: 0, done: stationDone,
              node: (
                <WordStation key={`${entry.id}-words`} title={station.title} done={stationDone} locked={!entries.some(isDone)}
                  onOpen={() => router.push({ pathname: '/word-station', params: { course: course.id, unit: String(unitIndex) } })} />
              ),
            } : null;
            if (stationItem && 'text' in entry) items.push(stationItem, lessonItem);
            else items.push(lessonItem, ...(stationItem ? [stationItem] : []));
          });
          if (entries.length > 0) {
            const opened = game.state.chests.includes(`${course.id}:${unitIndex}`);
            items.push({
              key: `chest-${unitIndex}`, offset: 0, done: opened,
              node: <UnitChest ready={entries.every(isDone)} opened={opened} onOpen={() => game.openUnitChest(`${course.id}:${unitIndex}`)} />,
            });
          }
          if (levelEnds.has(unitIndex)) {
            const examLevel = levelEnds.get(unitIndex)!;
            const levelEntries = units.filter((item) => item.level === examLevel).flatMap((item) => item.entries);
            const best = scores?.[examId(course.id, examLevel)];
            const ready = levelEntries.every(isDone) || (!!startingLevel && levelBelow(examLevel, startingLevel as CefrLevel));
            items.push({
              key: `exam-${examLevel}`, offset: 0, done: best !== undefined && best >= EXAM_PASS,
              node: <ExamNode level={examLevel} best={best} ready={ready} done={levelEntries.filter(isDone).length} total={levelEntries.length}
                onOpen={() => router.push({ pathname: '/exam', params: { course: course.id, level: examLevel } })} />,
            });
          }
          const doneCount = entries.filter(isDone).length;
          return (
            <Fragment key={`${unit.title}-${unitIndex}`}>
              {newLevel ? <LevelDivider level={level} /> : null}
              <View style={[styles.banner, { backgroundColor: theme.main, borderBottomColor: theme.edge }]}>
                <View style={styles.bannerRow}>
                  <View style={styles.flex}>
                    <AppText style={styles.bannerLabel}>{t('Unit {n} · {level}', { n: unitIndex + 1, level })}</AppText>
                    <AppText style={styles.bannerTitle} accessibilityRole="header">{unit.title}</AppText>
                  </View>
                  <View style={[styles.bannerIconWrap, { backgroundColor: theme.edge }]}>
                    <AppText style={styles.bannerIcon}>{doneCount === entries.length && entries.length ? '🏅' : theme.icon}</AppText>
                  </View>
                </View>
                <View style={styles.bannerTrack}>
                  <View style={[styles.bannerFill, { width: `${entries.length ? Math.max(4, (doneCount / entries.length) * 100) : 0}%` }]} />
                </View>
                <View style={styles.bannerRow}>
                  <AppText style={[styles.bannerMeta, styles.flex]}>{t('{done} of {total} done', { done: doneCount, total: entries.length })}</AppText>
                  {unit.lessons.length ? (
                    <Pressable onPress={() => toggleUnit(unitIndex)} accessibilityRole="button"
                      accessibilityState={{ expanded: openUnits.has(unitIndex) }}
                      accessibilityLabel={t('Grammar of {title}, {n} rules', { title: unit.title, n: unit.lessons.length })}
                      style={({ pressed }) => [styles.guide, { borderBottomColor: theme.edge }, pressed && styles.pressed]}>
                      <AppText style={[styles.guideText, { color: theme.edge }]}>📖 {t('Guide')} {openUnits.has(unitIndex) ? '▴' : '▾'}</AppText>
                    </Pressable>
                  ) : null}
                </View>
              </View>
              {openUnits.has(unitIndex) ? (
                <View style={styles.unitRules}>
                  {unit.lessons.map((lesson) => (
                    <RuleCard key={lesson.id} lesson={lesson} score={scores?.[lesson.id]} level={level} />
                  ))}
                </View>
              ) : null}
              <View style={styles.path}>
                <AppText style={[styles.deco, styles.decoLeft]} accessible={false}>{theme.deco[0]}</AppText>
                <AppText style={[styles.deco, styles.decoRight]} accessible={false}>{theme.deco[1]}</AppText>
                {items.map((item, index) => (
                  <Fragment key={item.key}>
                    {index > 0 ? <Trail from={items[index - 1].offset} to={item.offset} done={items[index - 1].done} color={theme.main} /> : null}
                    {item.node}
                  </Fragment>
                ))}
              </View>
            </Fragment>
          );
        })}

        {current === undefined && allEntries.length > 0 ? (
          <AppText variant="heading" align="center">{t("🎉 Course complete!")}</AppText>
        ) : null}
      </ScrollView>
      ) : null}
    </View>
  );
}

/** Dotted trail between two path stops, colored once you walked it. */
function Trail({ from, to, done, color }: { from: number; to: number; done: boolean; color: string }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.trail} accessible={false}>
      {[0.2, 0.5, 0.8].map((share) => (
        <View key={share} style={[styles.trailDot, done && { backgroundColor: color, opacity: 0.9 },
          { transform: [{ translateX: from + (to - from) * share }] }]} />
      ))}
    </View>
  );
}

/** Milestone between CEFR levels: A1 Beginner → A2 Elementary … */
function LevelDivider({ level }: { level: CefrLevel }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.levelDivider} accessibilityRole="header">
      <View style={[styles.levelLine, { backgroundColor: levelColors[level] }]} />
      <View style={[styles.levelPill, { backgroundColor: levelColors[level] }]}>
        <AppText style={styles.levelPillText}>{level} · {t(cefrNames[level])}</AppText>
      </View>
      <View style={[styles.levelLine, { backgroundColor: levelColors[level] }]} />
    </View>
  );
}

/** Soft ring that keeps pulsing around the next lesson. */
function Pulse({ color }: { color: string }) {
  const { styles } = useThemedStyles(createStyles);
  const reduced = useReducedMotion();
  const value = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    value.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false);
  }, [reduced, value]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.55 * (1 - value.value), transform: [{ scale: 1 + value.value * 0.55 }] }));
  return <Animated.View pointerEvents="none" style={[styles.pulse, { backgroundColor: color }, ring]} />;
}

/** The flame grows with the streak: a spark, a fire, a comet, a volcano. */
function streakIcon(streak: number) {
  return streak >= 100 ? '🌋' : streak >= 30 ? '☄️' : streak >= 1 ? '🔥' : '✨';
}

/** Vocabulary stop between the grammar lessons and the story of a unit. */
function WordStation({ title, done, locked, onOpen }: { title: string; done: boolean; locked: boolean; onOpen: () => void }) {
  const { styles } = useThemedStyles(createStyles);
  const frequent = title.match(/^Frequent words (\d+)$/);
  const label = frequent ? t('Frequent words {n}', { n: frequent[1] }) : t(title === 'Home' ? 'Home vocabulary' : title);
  return (
    <View style={styles.nodeWrap}>
      <Pressable disabled={locked} onPress={onOpen} accessibilityRole="button"
        accessibilityLabel={t('Word station: {title}. {status}', { title: label, status: done ? t('Passed') : locked ? t('Locked') : t('Open') })}
        style={({ pressed }) => [styles.station, done && styles.stationDone, locked && styles.nodeLocked, pressed && styles.nodePressed]}>
        <AppText style={styles.stationIcon}>{locked ? '🔒' : done ? '✓' : '🗂'}</AppText>
      </Pressable>
      <AppText variant="caption" align="center" style={styles.nodeTitle} numberOfLines={2}>{t('Words: {title}', { title: label })}</AppText>
    </View>
  );
}

/** Final exam at the end of each CEFR level. */
function ExamNode({ level, best, ready, done, total, onOpen }: {
  level: CefrLevel; best?: number; ready: boolean; done: number; total: number; onOpen: () => void;
}) {
  const { styles } = useThemedStyles(createStyles);
  const passed = best !== undefined && best >= EXAM_PASS;
  const glow = useWiggle(ready && !passed);
  return (
    <View style={styles.examWrap}>
      <Animated.View style={glow}>
        <Pressable disabled={!ready && !passed} onPress={onOpen} accessibilityRole="button"
          accessibilityLabel={passed ? t('Level {level} passed. View the exam', { level }) : ready ? t('Take the {level} final exam', { level }) : t('{level} final exam. Finish the lessons first.', { level })}
          style={({ pressed }) => [styles.exam, { borderColor: levelColors[level] }, passed && { backgroundColor: levelColors[level] }, !ready && !passed && styles.nodeLocked, pressed && styles.nodePressed]}>
          <AppText style={styles.examIcon}>{passed ? '🏆' : ready ? '🎓' : '🔒'}</AppText>
          <AppText variant="bodyStrong" style={passed ? styles.onLevel : undefined}>{t('{level} final exam', { level })}</AppText>
        </Pressable>
      </Animated.View>
      <AppText variant="caption" align="center" color="textSecondary" style={styles.nodeTitle}>
        {passed ? t('Passed with {n}% · badge and certificate earned', { n: best })
          : ready ? t('Pass with {n}% to earn the {level} badge', { n: EXAM_PASS, level })
            : t('{done} of {total} lessons done', { done, total })}
      </AppText>
    </View>
  );
}

/** Treasure chest at the end of each unit: locked until every entry is done. */
function UnitChest({ ready, opened, onOpen }: { ready: boolean; opened: boolean; onOpen: () => void }) {
  const { styles } = useThemedStyles(createStyles);
  const wiggle = useWiggle(ready && !opened);
  return (
    <View style={styles.nodeWrap}>
      <Animated.View style={wiggle}>
        <Pressable
          disabled={!ready || opened}
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={opened ? t('Chest opened') : ready ? t('Open the chest') : t('Finish the unit to open this chest')}
          style={({ pressed }) => [styles.chest, ready && !opened && styles.chestReady, opened && styles.chestOpened, pressed && styles.nodePressed]}
        >
          <AppText style={[styles.chestIcon, !ready && styles.chestLocked]}>{opened ? '📭' : '🎁'}</AppText>
        </Pressable>
      </Animated.View>
      <AppText variant="caption" align="center" style={styles.nodeTitle}>
        {opened ? t('Chest opened') : ready ? t('Open the chest!') : t('Unit chest')}
      </AppText>
    </View>
  );
}

function Stat({ icon, value, label, hint }: { icon: string; value: number | string; label: string; hint: string }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <HintStat icon={icon} value={value} title={label} text={hint} style={styles.stat}>
      <AppText variant="bodyStrong">{icon} {typeof value === 'number' ? value.toLocaleString('en-GB') : value}</AppText>
    </HintStat>
  );
}

function PathNode({ entry, state, number, offset, score, crowns = 0, legendary = false, theme }: {
  legendary?: boolean;
  theme: UnitTheme;
  entry: CourseEntry;
  state: NodeState;
  number: number;
  offset: number;
  score?: number;
  /** Mastery 1–5 from how often the lesson was repeated. */
  crowns?: number;
}) {
  const { styles } = useThemedStyles(createStyles);
  const duration = activityDuration(entry.ex);
  const isReading = 'text' in entry;
  const locked = state === 'locked';
  const symbol = locked ? '🔒' : state === 'done' ? '✓' : isReading ? (entry.listening ? '🎧' : '📖') : number === 1 ? '★' : String(number);
  const status = locked ? t('Locked') : state === 'done' ? t('Completed, best score {score}%', { score: score ?? 0 }) + (crowns >= 2 ? `, ${t('{n} crowns', { n: crowns })}` : '') : state === 'current' ? t('Next lesson') : t('Available for practice');
  const bob = useBob(state === 'current');
  const stars = score !== undefined ? starsForScore(score) : 0;

  return (
    <View style={[styles.nodeWrap, { transform: [{ translateX: offset }] }]}>
      {state === 'current' ? (
        <View style={[styles.mascot, offset > 0 ? styles.mascotLeft : styles.mascotRight]} pointerEvents="none">
          <Medved mood="happy" size={58} />
        </View>
      ) : null}
      <Animated.View style={[styles.nodeStack, bob]}>
      {state === 'current' ? (
        <View style={[styles.startBubble, { borderColor: theme.main }]}>
          <AppText variant="label" style={{ color: theme.main }}>{t("START")}</AppText>
          <View style={[styles.startTail, { borderColor: theme.main }]} />
        </View>
      ) : null}
      <View>
      {state === 'current' ? <Pulse color={theme.main} /> : null}
      <Pressable
        disabled={locked}
        onPress={() => openEntry(entry)}
        accessibilityRole="button"
        accessibilityLabel={t('{title}. {activity}. About {n} minutes. {status}', { title: entry.title, activity: activityLabel(entry), n: duration, status })}
        accessibilityState={{ disabled: locked }}
        style={({ pressed }) => [
          styles.node,
          { backgroundColor: theme.main, borderBottomColor: theme.edge },
          state === 'done' && styles.nodeDone,
          state === 'current' && styles.nodeCurrent,
          locked && styles.nodeLocked,
          locked && { backgroundColor: `${theme.main}33`, borderBottomColor: `${theme.edge}66` },
          pressed && styles.nodePressed,
        ]}
      >
        <AppText
          variant="title"
          color={locked ? 'textMuted' : 'onPrimary'}
          style={locked ? styles.lockIcon : state === 'done' ? styles.onGold : undefined}
        >
          {symbol}
        </AppText>
        {state === 'done' && score !== undefined ? (
          <View style={styles.starBadge} accessible={false}>
            <AppText variant="small" style={styles.stars}>
              {'★'.repeat(stars)}{'☆'.repeat(3 - stars)}
            </AppText>
          </View>
        ) : null}
        {legendary ? (
          <View style={[styles.crownBadge, styles.legendBadge]} accessible={false}>
            <AppText variant="small" style={styles.crownText}>🏆</AppText>
          </View>
        ) : crowns >= 2 ? (
          <View style={styles.crownBadge} accessible={false}>
            <AppText variant="small" style={styles.crownText}>👑{crowns}</AppText>
          </View>
        ) : null}
      </Pressable>
      </View>
      </Animated.View>
      <AppText
        variant="caption"
        color={locked ? 'textMuted' : 'text'}
        align="center"
        numberOfLines={2}
        style={styles.nodeTitle}
      >
        {entry.title}
      </AppText>
      <AppText variant="small" color="textSecondary" align="center">
        {activityLabel(entry)}{entry.ex.some(({ type }) => type === 'writing') ? ' + ' + t('Writing') : ''} · {t('about {n} min', { n: duration })}
      </AppText>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  pressed: { opacity: 0.8 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: screenPadding,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  stat: { minHeight: 36, justifyContent: 'center' },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  courseCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xxl,
    backgroundColor: colors.action,
    borderBottomWidth: 6,
    borderBottomColor: colors.actionPressed,
  },
  courseFlag: { fontSize: 36, lineHeight: 44 },
  courseMeta: { opacity: 0.85 },
  courseTrack: { height: 12, borderRadius: radius.full, backgroundColor: 'rgba(0,0,0,0.2)', overflow: 'hidden' },
  courseFill: { height: '100%', borderRadius: radius.full, backgroundColor: GOLD },
  courseTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  courseActions: { flexDirection: 'row', gap: spacing.sm },
  // Readable on the success color in both light and dark mode.
  onSuccess: { color: colors.successSoft },
  startButton: {
    flex: 1,
    alignItems: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
  changeButton: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: screenPadding,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statsRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  helpDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
  station: {
    width: 62, height: 62, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#3C6FD1', borderBottomWidth: 5, borderBottomColor: '#2A4F99', transform: [{ rotate: '45deg' }],
  },
  stationDone: { backgroundColor: '#F2B705', borderBottomColor: '#B98A00' },
  stationIcon: { fontSize: 24, lineHeight: 30, color: '#FFFFFF', transform: [{ rotate: '-45deg' }] },
  examWrap: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg, marginBottom: spacing.md },
  exam: {
    alignItems: 'center', gap: 4, paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    borderRadius: radius.xl, borderWidth: 3, borderBottomWidth: 6, backgroundColor: colors.surface,
  },
  examIcon: { fontSize: 34, lineHeight: 40 },
  onLevel: { color: '#FFFFFF' },
  tabActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  tabIcon: { fontSize: 18, lineHeight: 22 },
  tabPressed: { opacity: 0.8 },
  unitTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grammarToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  unitRules: { gap: spacing.sm },
  unitHeader: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  levelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  path: { alignItems: 'center', paddingVertical: spacing.md, position: 'relative' },
  trail: { height: 38, justifyContent: 'space-evenly', alignItems: 'center' },
  trailDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.border, opacity: 0.8 },
  deco: { position: 'absolute', fontSize: 40, lineHeight: 48, opacity: 0.22 },
  decoLeft: { left: 4, top: 40 },
  decoRight: { right: 4, bottom: 70 },
  banner: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.xl, borderBottomWidth: 6, marginTop: spacing.sm },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bannerLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 16, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  bannerTitle: { color: '#FFFFFF', fontSize: 21, lineHeight: 27, fontWeight: '900' },
  bannerIconWrap: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  bannerIcon: { fontSize: 30, lineHeight: 36 },
  bannerTrack: { height: 10, borderRadius: radius.full, backgroundColor: 'rgba(0,0,0,0.18)', overflow: 'hidden' },
  bannerFill: { height: '100%', borderRadius: radius.full, backgroundColor: '#FFFFFF' },
  bannerMeta: { color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 18, fontWeight: '700' },
  guide: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.full, backgroundColor: '#FFFFFF', borderBottomWidth: 3 },
  guideText: { fontSize: 13, lineHeight: 17, fontWeight: '900' },
  levelDivider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  levelLine: { flex: 1, height: 3, borderRadius: 2, opacity: 0.5 },
  levelPill: { paddingHorizontal: spacing.lg, paddingVertical: 8, borderRadius: radius.full },
  levelPillText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14, lineHeight: 18, letterSpacing: 0.5 },
  pulse: { position: 'absolute', left: 0, top: 0, width: NODE_SIZE + 4, height: NODE_SIZE, borderRadius: NODE_SIZE / 2 },
  mascot: { position: 'absolute', top: 30, zIndex: 2 },
  mascotLeft: { right: '100%', marginRight: -8 },
  mascotRight: { left: '100%', marginLeft: -8 },
  nodeWrap: { alignItems: 'center', width: 150, position: 'relative' },
  nodeStack: { alignItems: 'center' },
  startBubble: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  startTail: {
    position: 'absolute',
    bottom: -7,
    alignSelf: 'center',
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }],
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  // Round "keys" like GrammarFirst: a darker bottom edge the node sinks into.
  node: {
    width: NODE_SIZE + 4,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.action,
    borderBottomWidth: 6,
    borderBottomColor: colors.actionPressed,
  },
  nodeDone: { backgroundColor: GOLD, borderBottomColor: GOLD_EDGE },
  nodeCurrent: {
    boxShadow: '0 0 0 6px rgba(255,255,255,0.18)',
  },
  nodeLocked: { backgroundColor: colors.surfaceMuted, borderBottomColor: colors.border },
  nodePressed: { borderBottomWidth: 2, transform: [{ translateY: 4 }] },
  lockIcon: { opacity: 0.6 },
  onGold: { color: '#5C4300' },
  chest: {
    width: 66, height: 60, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceMuted, borderBottomWidth: 5, borderBottomColor: colors.border,
  },
  chestReady: { backgroundColor: '#FFF3C4', borderBottomColor: '#B98A00', boxShadow: '0 0 0 4px rgba(242,183,5,0.45)' },
  chestOpened: { opacity: 0.7 },
  chestIcon: { fontSize: 32, lineHeight: 38 },
  chestLocked: { opacity: 0.45 },
  nodeTitle: { marginTop: spacing.sm, fontWeight: '700' },
  legendBadge: { backgroundColor: '#F2B705' },
  crownBadge: { position: 'absolute', top: -6, right: -10, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 10, backgroundColor: '#FFF4D6', borderWidth: 1, borderColor: '#F2B705' },
  crownText: { fontSize: 11, lineHeight: 14, fontWeight: '800', color: '#8A5A00' },
  starBadge: {
    position: 'absolute',
    bottom: -12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  stars: { color: GOLD_EDGE, letterSpacing: 1, fontSize: 11, lineHeight: 14 },
});
