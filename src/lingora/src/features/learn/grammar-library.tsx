import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useBob } from '@/components/motion';
import { AppText } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { t } from '@/lib/i18n';

import { levelColors } from './badges';
import { cefrNames, levelForUnit, type CefrLevel, type Course, type Lesson } from './catalog';
import { starsForScore } from './progress';

const GOLD = '#F2B705';
const GOLD_EDGE = '#B98A00';

type Status = 'new' | 'practised' | 'mastered';

function statusOf(score?: number): Status {
  if (score === undefined) return 'new';
  return starsForScore(score) === 3 ? 'mastered' : 'practised';
}

function openRule(lesson: Lesson) {
  router.push({ pathname: '/lesson/[id]', params: { id: lesson.id, view: 'grammar' } });
}

function practise(lesson: Lesson) {
  router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } });
}

function Stars({ score }: { score?: number }) {
  const { styles } = useThemedStyles(createStyles);
  const stars = score === undefined ? 0 : starsForScore(score);
  return (
    <AppText style={styles.stars} accessibilityLabel={t('{n} of 3 stars', { n: stars })}>
      {'★'.repeat(stars)}<AppText style={styles.starsEmpty}>{'★'.repeat(3 - stars)}</AppText>
    </AppText>
  );
}

/**
 * One grammar rule as a game card: level tile, title, pattern, stars and
 * two actions (read the rule, practise it).
 */
export function RuleCard({ lesson, done, score, level, number }: {
  lesson: Lesson; done?: boolean; score?: number; level?: CefrLevel; number?: number;
}) {
  const { colors, styles } = useThemedStyles(createStyles);
  const status = statusOf(score ?? (done ? 0 : undefined));
  const tint = level ? levelColors[level] : colors.action;
  const statusLabel = status === 'mastered' ? t('Mastered') : status === 'practised' ? t('Practised') : t('New');
  return (
    <View style={[styles.card, status === 'mastered' && styles.cardMastered]}>
      <Pressable onPress={() => openRule(lesson)} style={({ pressed }) => [styles.cardMain, pressed && styles.pressed]}
        accessibilityRole="button" accessibilityLabel={`${lesson.title}. ${statusLabel}. ${t('Open the full explanation.')}`}>
        <View style={[styles.tile, {
          backgroundColor: status === 'mastered' ? GOLD : tint,
          borderBottomColor: status === 'mastered' ? GOLD_EDGE : 'rgba(0,0,0,0.25)',
        }]}>
          <AppText style={styles.tileText}>{status === 'mastered' ? '👑' : status === 'practised' ? '✓' : number ?? '•'}</AppText>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <AppText variant="bodyStrong" style={styles.flex} numberOfLines={2}>{lesson.title}</AppText>
            <View style={[styles.chip, status === 'new' && styles.chipNew, status === 'mastered' && styles.chipMastered]}>
              <AppText variant="small" style={[styles.chipText, status === 'mastered' && styles.chipTextMastered]}>{statusLabel}</AppText>
            </View>
          </View>
          {lesson.structure ? (
            <View style={[styles.pattern, { borderLeftColor: tint }]}>
              <AppText variant="caption" style={styles.patternText} numberOfLines={3}>{lesson.structure}</AppText>
            </View>
          ) : null}
          <AppText variant="caption" color="textSecondary" numberOfLines={2}>{lesson.rule}</AppText>
        </View>
      </Pressable>
      <View style={styles.cardFoot}>
        <Stars score={score} />
        <View style={styles.actions}>
          <Pressable onPress={() => openRule(lesson)} style={({ pressed }) => [styles.action, pressed && styles.pressed]} accessibilityRole="button">
            <AppText variant="caption" color="primary" style={styles.bold}>📖 {t('Rule')}</AppText>
          </Pressable>
          <Pressable onPress={() => practise(lesson)} style={({ pressed }) => [styles.action, styles.actionMain, pressed && styles.pressed]} accessibilityRole="button">
            <AppText variant="caption" style={[styles.bold, styles.onAction]}>✍️ {status === 'mastered' ? t('Again') : t('Practise')}</AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Ring({ share, size = 92 }: { share: number; size?: number }) {
  const { colors } = useThemedStyles(createStyles);
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceMuted} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={GOLD} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - share)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <AppText variant="heading">{Math.round(share * 100)}%</AppText>
    </View>
  );
}

/** Every grammar rule of the course as a small game: mastery, chapters and rule cards. */
export function GrammarLibrary({ course, scores }: { course: Course; scores?: Record<string, number> }) {
  const { styles } = useThemedStyles(createStyles);
  const chapters = course.units
    .map((unit, index) => ({ unit, level: levelForUnit(course, index) }))
    .filter(({ unit }) => unit.lessons.length > 0);
  const rules = chapters.flatMap(({ unit, level }) => unit.lessons.map((lesson) => ({ lesson, level })));
  const scoreOf = (id: string) => scores?.[id];
  const stars = rules.reduce((sum, { lesson }) => {
    const score = scoreOf(lesson.id);
    return sum + (score === undefined ? 0 : starsForScore(score));
  }, 0);
  const mastered = rules.filter(({ lesson }) => statusOf(scoreOf(lesson.id)) === 'mastered').length;
  const practised = rules.filter(({ lesson }) => scoreOf(lesson.id) !== undefined).length;
  const next = rules.find(({ lesson }) => scoreOf(lesson.id) === undefined)
    ?? rules.find(({ lesson }) => statusOf(scoreOf(lesson.id)) !== 'mastered');
  const bob = useBob(!!next, 3, 1600);
  // Running rule number across chapters, shown on new rules.
  const firstNumber = chapters.map((_, index) => chapters.slice(0, index).reduce((sum, item) => sum + item.unit.lessons.length, 0));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Ring share={rules.length ? stars / (rules.length * 3) : 0} />
        <View style={styles.heroStats}>
          <AppText variant="heading">{t('Grammar mastery')}</AppText>
          <AppText variant="callout">⭐ {t('{n} of {total} stars', { n: stars, total: rules.length * 3 })}</AppText>
          <AppText variant="callout">👑 {t('{n} rules mastered', { n: mastered })}</AppText>
          <AppText variant="callout">📘 {t('{n} of {total} rules practised', { n: practised, total: rules.length })}</AppText>
        </View>
      </View>

      {next ? (
        <Animated.View style={bob}>
          <View style={styles.spotlight}>
            <AppText variant="label" style={styles.spotlightLabel}>{t('UP NEXT')}</AppText>
            <AppText variant="heading" style={styles.spotlightTitle}>{next.lesson.title}</AppText>
            {next.lesson.structure ? (
              <AppText variant="caption" style={styles.spotlightText} numberOfLines={2}>{next.lesson.structure}</AppText>
            ) : null}
            <View style={styles.spotlightActions}>
              <Pressable onPress={() => openRule(next.lesson)} style={({ pressed }) => [styles.spotButton, pressed && styles.pressed]} accessibilityRole="button">
                <AppText variant="bodyStrong" style={styles.spotlightTitle}>📖 {t('Read the rule')}</AppText>
              </Pressable>
              <Pressable onPress={() => practise(next.lesson)} style={({ pressed }) => [styles.spotButton, styles.spotButtonMain, pressed && styles.pressed]} accessibilityRole="button">
                <AppText variant="bodyStrong" style={styles.spotMainText}>✍️ {t('Practise')}</AppText>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      ) : (
        <View style={styles.allDone}>
          <AppText variant="heading" align="center">🏆 {t('Every rule mastered. Amazing!')}</AppText>
        </View>
      )}

      {chapters.map(({ unit, level }, chapterIndex) => {
        const done = unit.lessons.filter((lesson) => statusOf(scoreOf(lesson.id)) === 'mastered').length;
        const share = done / unit.lessons.length;
        const tint = levelColors[level];
        return (
          <View key={`${unit.title}-${chapterIndex}`} style={styles.chapter}>
            <View style={styles.chapterHead}>
              <View style={[styles.levelBadge, { backgroundColor: tint }]}>
                <AppText variant="label" style={styles.levelText}>{level}</AppText>
              </View>
              <View style={styles.flex}>
                <AppText variant="subheading" accessibilityRole="header" numberOfLines={2}>{unit.title}</AppText>
                <AppText variant="small" color="textSecondary">
                  {t(cefrNames[level])} · {t('{n} of {total} mastered', { n: done, total: unit.lessons.length })}
                </AppText>
              </View>
              <AppText style={styles.trophy} accessible={false}>{share === 1 ? '🏆' : '🎯'}</AppText>
            </View>
            <View style={styles.chapterTrack}>
              <View style={[styles.chapterFill, { width: `${Math.max(share * 100, 2)}%`, backgroundColor: share === 1 ? GOLD : tint }]} />
            </View>
            {unit.lessons.map((lesson, lessonIndex) => (
              <RuleCard key={lesson.id} lesson={lesson} score={scoreOf(lesson.id)} level={level}
                number={firstNumber[chapterIndex] + lessonIndex + 1} />
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '800' },
  pressed: { opacity: 0.85, transform: [{ translateY: 1 }] },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderSubtle,
  },
  heroStats: { flex: 1, gap: 2 },
  spotlight: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.xxl,
    backgroundColor: colors.action,
    borderBottomWidth: 5,
    borderBottomColor: colors.actionPressed,
  },
  spotlightLabel: { color: GOLD, fontWeight: '800' },
  spotlightTitle: { color: '#FFFFFF' },
  spotlightText: { color: 'rgba(255,255,255,0.85)' },
  spotlightActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  spotButton: {
    flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.lg, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  spotButtonMain: { backgroundColor: GOLD, borderColor: GOLD, borderBottomWidth: 4, borderBottomColor: GOLD_EDGE },
  spotMainText: { color: '#3D2E00' },
  allDone: { padding: spacing.lg, borderRadius: radius.xxl, backgroundColor: `${GOLD}33` },
  chapter: { gap: spacing.sm },
  chapterHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  levelBadge: { minWidth: 42, height: 42, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xs },
  levelText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  trophy: { fontSize: 26, lineHeight: 32 },
  chapterTrack: { height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  chapterFill: { height: '100%', borderRadius: radius.full },
  card: {
    borderRadius: radius.xl,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cardMastered: { borderColor: GOLD, borderBottomColor: GOLD_EDGE },
  cardMain: { flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  tile: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4 },
  tileText: { color: '#FFFFFF', fontWeight: '900', fontSize: 18, lineHeight: 22 },
  cardBody: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.successSoft },
  chipNew: { backgroundColor: colors.primarySoft },
  chipMastered: { backgroundColor: GOLD },
  chipText: { fontWeight: '800', color: colors.text },
  chipTextMastered: { color: '#3D2E00' },
  pattern: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderLeftWidth: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  patternText: { fontWeight: '700', color: colors.text },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  stars: { color: GOLD, fontSize: 18, letterSpacing: 2 },
  starsEmpty: { color: colors.border, fontSize: 18, letterSpacing: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.primarySoft },
  actionMain: { backgroundColor: colors.action },
  onAction: { color: '#FFFFFF' },
});
