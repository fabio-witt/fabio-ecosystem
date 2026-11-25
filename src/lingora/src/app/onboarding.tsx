import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing, FadeIn, FadeInDown, FadeInUp, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming, ZoomIn,
} from 'react-native-reanimated';

import { Flag } from '@/components/flag';
import { Medved, MedvedSays } from '@/components/medved';
import { AppText, Button, ErrorState, LoadingState, Screen } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useLanguages, type Language } from '@/features/community/api';
import { celebrate } from '@/features/game/celebrations';
import { useActiveCourse } from '@/features/learn/active-course';
import { cefrLevels, cefrNames, entriesForUnit, type CefrLevel } from '@/features/learn/catalog';
import { dailyGoalOptions, useSetDailyGoal } from '@/features/learn/progress';
import { FirstExchange } from '@/features/onboarding/first-exchange';
import { learningGoals } from '@/features/onboarding/goals';
import { PlacementCheck } from '@/features/onboarding/placement-check';
import { placementStages } from '@/features/onboarding/placement';
import { recommendStarter } from '@/features/onboarding/recommendation';
import { skipOnboarding } from '@/features/onboarding/storage';
import { ReminderPrompt } from '@/features/notifications/reminder-prompt';
import { profileKeys } from '@/features/profile/api';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import { track } from '@/lib/insights';

type Step = 'welcome' | 'native' | 'learning' | 'goal' | 'level' | 'done';
const STEPS: Step[] = ['welcome', 'native', 'learning', 'goal', 'level', 'done'];

// Minutes per day shown to learners, mapped to the XP goal the server uses.
const dailyPlans = [
  { minutes: 5, xp: dailyGoalOptions[0], label: 'Casual', icon: '🌱' },
  { minutes: 10, xp: dailyGoalOptions[1], label: 'Regular', icon: '🚶' },
  { minutes: 15, xp: dailyGoalOptions[2], label: 'Serious', icon: '🏃' },
  { minutes: 25, xp: dailyGoalOptions[3], label: 'Intense', icon: '🚀' },
] as const;

const enter = (index = 0) => FadeInDown.delay(80 + index * 70).duration(380).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System);

export default function OnboardingScreen() {
  const { styles } = useThemedStyles(createStyles);
  const { user } = useSession();
  const client = useQueryClient();
  const languages = useLanguages();
  const setDailyGoal = useSetDailyGoal();
  const { choose } = useActiveCourse();

  const [step, setStep] = useState<Step>('welcome');
  const [native, setNative] = useState<Language | null>(null);
  const [learning, setLearning] = useState<Language | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [plan, setPlan] = useState<number>(dailyPlans[1].xp);
  const [level, setLevel] = useState<CefrLevel>('A1');
  const [levelMode, setLevelMode] = useState<'choose' | 'check' | 'pick'>('choose');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const index = STEPS.indexOf(step);

  function skip() {
    if (user) skipOnboarding(user.id);
    router.replace('/');
  }

  async function save(chosen: CefrLevel) {
    if (!user || !native || !learning || native.id === learning.id || saving) return;
    setSaving(true);
    setError(null);
    setLevel(chosen);
    try {
      const rows = [
        { user_id: user.id, language_id: native.id, language_type: 'native', proficiency_level: 'Native' },
        { user_id: user.id, language_id: learning.id, language_type: 'learning', proficiency_level: chosen },
      ];
      for (const row of rows) {
        const { error: insertError } = await supabase.from('user_languages').insert(row);
        // 23505: the language is already on the profile – fine.
        if (insertError && insertError.code !== '23505') throw insertError;
      }
      if (goal) await supabase.from('profiles').update({ learning_goal: goal }).eq('id', user.id);
      setDailyGoal.mutate(plan);
      const course = recommendStarter(learning, chosen)?.course;
      if (course) choose(course.id);
      await client.invalidateQueries({ queryKey: profileKeys.all });
      await client.invalidateQueries({ queryKey: ['partners'] });
      setStep('done');
      track('onboarding_completed', { course: course?.id ?? 'none', level: chosen });
      celebrate({ icon: '🎉', title: 'You are ready!', message: 'Your learning path is set up.' });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('Your answers could not be saved.'));
    } finally {
      setSaving(false);
    }
  }

  if (languages.isPending) return <Screen><LoadingState /></Screen>;
  if (languages.isError) {
    return (
      <Screen>
        <ErrorState title={t("Could not load languages")} onRetry={() => languages.refetch()} />
        <Button title={t("Skip for now")} variant="ghost" onPress={skip} />
      </Screen>
    );
  }
  const list = languages.data;
  const course = learning ? recommendStarter(learning, 'A1')?.course : undefined;
  const stages = course ? placementStages(course) : [];
  const back = index > 0 && step !== 'done' ? () => setStep(STEPS[index - 1]) : undefined;

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.top}>
        {back ? (
          <Pressable onPress={back} accessibilityRole="button" accessibilityLabel={t('Back')} hitSlop={8} style={styles.back}>
            <AppText variant="heading">‹</AppText>
          </Pressable>
        ) : <View style={styles.back} />}
        {step !== 'welcome' && step !== 'done' ? <ProgressBar value={index / (STEPS.length - 2)} /> : <View style={styles.flex} />}
        {step !== 'done' ? <Button title={t("Skip")} variant="ghost" size="sm" onPress={skip} disabled={saving} /> : <View style={styles.back} />}
      </View>

      {/* key = step: every step animates in fresh. */}
      <ScrollView key={step} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'welcome' ? <Welcome onStart={() => { track('onboarding_started'); setStep('native'); }} /> : null}

        {step === 'native' ? (
          <>
            <Animated.View entering={enter(0)}>
              <MedvedSays mood="happy" message={t('Hi! I’m Fabio. Which language do you speak natively?')} />
            </Animated.View>
            <Animated.View entering={enter(1)} style={styles.why}>
              <AppText variant="caption" color="textSecondary">
                {t('Why? We suggest language partners who learn your language while you learn theirs, and we never offer your own language as a course.')}
              </AppText>
            </Animated.View>
            <LanguageTiles languages={list} selected={native} onSelect={(language) => {
              setNative(language);
              if (language.id === learning?.id) setLearning(null);
            }} />
            <StickyContinue disabled={!native} onPress={() => setStep('learning')} />
          </>
        ) : null}

        {step === 'learning' ? (
          <>
            <Animated.View entering={enter(0)}>
              <MedvedSays mood="happy" message={t('Great! Which language do you want to learn?')} />
            </Animated.View>
            <LanguageTiles learning languages={list.filter((language) => language.id !== native?.id && !!recommendStarter(language, 'A1'))} selected={learning}
              onSelect={(language) => { setLearning(language); setLevelMode('choose'); }} />
            <StickyContinue disabled={!learning} onPress={() => setStep('goal')} />
          </>
        ) : null}

        {step === 'goal' && learning ? (
          <>
            <Animated.View entering={enter(0)}>
              <MedvedSays mood="cheer" message={t('Why are you learning {language}?', { language: t(learning.name) })} />
            </Animated.View>
            <View style={styles.goalGrid}>
              {learningGoals.map((item, position) => {
                const selected = goal === item.value;
                return (
                  <Animated.View key={item.value} entering={enter(position + 1)} style={styles.goalCell}>
                    <Pressable onPress={() => setGoal(selected ? null : item.value)} accessibilityRole="radio"
                      accessibilityState={{ checked: selected }} style={({ pressed }) => [styles.goalTile, selected && styles.tileSelected, pressed && styles.pressed]}>
                      <AppText style={styles.goalIcon} accessible={false}>{item.icon}</AppText>
                      <AppText variant="callout" align="center" style={styles.bold}>{t(item.value)}</AppText>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
            <Animated.View entering={enter(4)} style={styles.section}>
              <AppText variant="heading">{t('How much time do you have each day?')}</AppText>
              <View style={styles.planRow} accessibilityRole="radiogroup">
                {dailyPlans.map((option) => {
                  const selected = plan === option.xp;
                  return (
                    <Pressable key={option.xp} onPress={() => setPlan(option.xp)} accessibilityRole="radio"
                      accessibilityState={{ checked: selected }} style={({ pressed }) => [styles.plan, selected && styles.tileSelected, pressed && styles.pressed]}>
                      <AppText style={styles.planIcon} accessible={false}>{option.icon}</AppText>
                      <AppText variant="bodyStrong">{t('{n} min', { n: option.minutes })}</AppText>
                      <AppText variant="small" color="textSecondary">{t(option.label)}</AppText>
                    </Pressable>
                  );
                })}
              </View>
              <AppText variant="caption" color="textSecondary">{t('You can change this any time in Learn.')}</AppText>
            </Animated.View>
            <StickyContinue onPress={() => setStep('level')} />
          </>
        ) : null}

        {step === 'level' && learning ? (
          <>
            <Animated.View entering={enter(0)}>
              <MedvedSays message={t('How well do you know {language} already?', { language: t(learning.name) })} />
            </Animated.View>
            {levelMode === 'check' && stages.length > 0 ? (
              <PlacementCheck key={learning.id} stages={stages} languageName={learning.name}
                onClose={() => setLevelMode('choose')}
                onSelect={(suggested) => void save(suggested)} />
            ) : levelMode === 'pick' ? (
              <View style={styles.section}>
                <AppText variant="heading">{t('Choose your level')}</AppText>
                {cefrLevels.map((code, position) => (
                  <Animated.View key={code} entering={enter(position + 1)}>
                    <Pressable onPress={() => void save(code)} disabled={saving} accessibilityRole="button"
                      style={({ pressed }) => [styles.levelRow, pressed && styles.pressed]}>
                      <View style={styles.levelBadge}><AppText variant="bodyStrong" color="primary">{code}</AppText></View>
                      <AppText variant="bodyStrong" style={styles.flex}>{t(cefrNames[code])}</AppText>
                      <AppText variant="heading" color="primary" accessible={false}>›</AppText>
                    </Pressable>
                  </Animated.View>
                ))}
                <Button title={t('Back')} variant="ghost" onPress={() => setLevelMode('choose')} />
              </View>
            ) : (
              <View style={styles.section}>
                <LevelChoice index={1} icon="🌱" title={t('I’m new to {language}', { language: t(learning.name) })}
                  text={t('Start at the very beginning with the alphabet and first words.')}
                  onPress={() => void save('A1')} disabled={saving} />
                {stages.length > 0 ? (
                  <LevelChoice index={2} icon="🧭" title={t('I know some already')}
                    text={t('Take the 2-minute level check and start at the right place.')}
                    onPress={() => setLevelMode('check')} disabled={saving} />
                ) : null}
                <LevelChoice index={3} icon="🎚️" title={t('I know my level')}
                  text={t('Choose from A1 (beginner) to C2 (proficient).')}
                  onPress={() => setLevelMode('pick')} disabled={saving} />
              </View>
            )}
            {saving ? <AppText color="textSecondary" align="center">{t('Setting up your path…')}</AppText> : null}
            {error ? <AppText color="danger">{error}</AppText> : null}
          </>
        ) : null}

        {step === 'done' && learning ? <Done learning={learning} level={level} plan={plan} /> : null}
      </ScrollView>
    </Screen>
  );
}

/** Animated progress bar for the question steps. */
function ProgressBar({ value }: { value: number }) {
  const { styles } = useThemedStyles(createStyles);
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(Math.min(1, Math.max(0.06, value)), { duration: 450, easing: Easing.out(Easing.cubic) });
  }, [value, width]);
  const fill = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));
  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
      <Animated.View style={[styles.trackFill, fill]} />
    </View>
  );
}

/** First screen: Fabio pops in, then the three promises appear one after another. */
function Welcome({ onStart }: { onStart: () => void }) {
  const { styles } = useThemedStyles(createStyles);
  const promises: [string, string, string][] = [
    ['📘', 'Short lessons that build on each other', 'From the alphabet to fluent sentences, step by step.'],
    ['🔁', 'Smart review', 'Lingora brings back exactly what you are about to forget.'],
    ['🤝', 'Real people', 'Practise with native speakers who learn your language.'],
  ];
  return (
    <View style={styles.welcome}>
      <Animated.View entering={ZoomIn.duration(500).easing(Easing.out(Easing.back(1.6))).reduceMotion(ReduceMotion.System)}>
        <Medved mood="cheer" size={120} />
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(200).duration(450).reduceMotion(ReduceMotion.System)} style={styles.welcomeText}>
        <AppText variant="display" align="center">{t('Welcome to Lingora')}</AppText>
        <AppText align="center" color="textSecondary">{t('Learn languages. Connect cultures.')}</AppText>
      </Animated.View>
      <View style={styles.promises}>
        {promises.map(([icon, title, text], position) => (
          <Animated.View key={title} entering={FadeInDown.delay(450 + position * 140).duration(420).reduceMotion(ReduceMotion.System)} style={styles.promise}>
            <AppText style={styles.promiseIcon} accessible={false}>{icon}</AppText>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{t(title)}</AppText>
              <AppText variant="caption" color="textSecondary">{t(text)}</AppText>
            </View>
          </Animated.View>
        ))}
      </View>
      <Animated.View entering={FadeIn.delay(950).duration(400).reduceMotion(ReduceMotion.System)} style={styles.full}>
        <Button title={t('Let’s go! 🚀')} size="lg" fullWidth onPress={onStart} />
        <AppText variant="small" color="textMuted" align="center" style={styles.welcomeNote}>{t('Takes less than a minute.')}</AppText>
      </Animated.View>
    </View>
  );
}

/** Flag tiles, three per row, popping in one after another. */
function LanguageTiles({ languages, selected, onSelect, learning = false }: {
  languages: Language[]; selected: Language | null; onSelect: (language: Language) => void; learning?: boolean;
}) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.tiles} accessibilityRole="radiogroup">
      {languages.map((language, position) => {
        const isSelected = selected?.id === language.id;
        const course = learning ? recommendStarter(language, 'A1')?.course : undefined;
        const lessons = course ? course.units.flatMap(entriesForUnit).length : 0;
        return (
          <Animated.View key={language.id} entering={FadeInDown.delay(Math.min(position, 14) * 35).duration(320).reduceMotion(ReduceMotion.System)} style={styles.tileCell}>
            <Pressable onPress={() => onSelect(language)} accessibilityRole="radio" accessibilityState={{ checked: isSelected }}
              accessibilityLabel={t(language.name)}
              style={({ pressed }) => [styles.tile, isSelected && styles.tileSelected, pressed && styles.pressed]}>
              {isSelected ? (
                <Animated.View entering={ZoomIn.duration(220).reduceMotion(ReduceMotion.System)} style={styles.check}>
                  <AppText style={styles.checkText}>✓</AppText>
                </Animated.View>
              ) : null}
              <Flag emoji={language.flag_emoji} size={36} />
              <AppText variant="callout" align="center" numberOfLines={1} style={[styles.bold, t(language.name).length > 11 && styles.longName, t(language.name).length > 14 && styles.longerName]}>
                {t(language.name)}
              </AppText>
              {learning ? (
                <AppText variant="small" color="textSecondary" align="center" numberOfLines={2}>
                  {t('{n} lessons', { n: lessons })}
                </AppText>
              ) : null}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

function LevelChoice({ icon, title, text, onPress, disabled, index }: {
  icon: string; title: string; text: string; onPress: () => void; disabled?: boolean; index: number;
}) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <Animated.View entering={enter(index)}>
      <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
        style={({ pressed }) => [styles.levelChoice, pressed && styles.pressed]}>
        <AppText style={styles.levelIcon} accessible={false}>{icon}</AppText>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{title}</AppText>
          <AppText variant="caption" color="textSecondary">{text}</AppText>
        </View>
        <AppText variant="heading" color="primary" accessible={false}>›</AppText>
      </Pressable>
    </Animated.View>
  );
}

function StickyContinue({ disabled, onPress }: { disabled?: boolean; onPress: () => void }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.sticky}>
      <Button title={t('Continue')} size="lg" fullWidth disabled={disabled} onPress={onPress} />
    </View>
  );
}

function Done({ learning, level, plan }: { learning: Language; level: CefrLevel; plan: number }) {
  const { styles } = useThemedStyles(createStyles);
  const starter = recommendStarter(learning, level);
  const minutes = dailyPlans.find((option) => option.xp === plan)?.minutes ?? 10;

  return (
    <View style={styles.section}>
      <Animated.View entering={ZoomIn.duration(500).easing(Easing.out(Easing.back(1.8))).reduceMotion(ReduceMotion.System)} style={styles.doneHero}>
        <Medved mood="cheer" size={120} />
        <AppText variant="title" align="center">{t('Your path is ready!')}</AppText>
      </Animated.View>
      <Animated.View entering={enter(1)} style={styles.summary}>
        <SummaryRow icon={<Flag emoji={learning.flag_emoji} size={26} />} text={t('You learn {language}', { language: t(learning.name) })} />
        <SummaryRow icon={<AppText style={styles.summaryIcon}>🎯</AppText>} text={t('Starting level {level}', { level: starter?.level ?? level })} />
        <SummaryRow icon={<AppText style={styles.summaryIcon}>⏱️</AppText>} text={t('{n} minutes a day', { n: minutes })} />
      </Animated.View>
      {starter ? (
        <Animated.View entering={enter(2)} style={styles.section}>
          <Button title={t('Start my first lesson →')} size="lg" fullWidth onPress={() => router.replace({
            pathname: '/lesson/[id]',
            params: { id: starter.entry.id, exchangeLanguageId: String(learning.id) },
          })} />
          <AppText variant="caption" color="textSecondary" align="center">
            {t('First up: {title}', { title: starter.entry.title })}
          </AppText>
          <Button title={t('Look around first')} variant="ghost" onPress={() => router.replace('/')} />
        </Animated.View>
      ) : <FirstExchange languageId={learning.id} languageName={learning.name} />}
      <Animated.View entering={enter(3)}>
        <ReminderPrompt />
      </Animated.View>
    </View>
  );
}

function SummaryRow({ icon, text }: { icon: ReactNode; text: string }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryIconBox}>{icon}</View>
      <AppText variant="bodyStrong" style={styles.flex}>{text}</AppText>
      <AppText color="success" style={styles.bold}>✓</AppText>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  full: { alignSelf: 'stretch' },
  bold: { fontWeight: '800' },
  longName: { fontSize: 12 },
  longerName: { fontSize: 10.5, letterSpacing: -0.2 },
  pressed: { transform: [{ translateY: 2 }] },
  top: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: screenPadding, paddingVertical: spacing.sm, minHeight: 52,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  track: { flex: 1, height: 12, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.primary },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: screenPadding, gap: spacing.lg, paddingBottom: spacing.xxxl },
  section: { gap: spacing.sm },
  why: { padding: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted },
  welcome: { alignItems: 'center', gap: spacing.md },
  welcomeText: { gap: spacing.xs },
  welcomeNote: { marginTop: spacing.sm },
  promises: { alignSelf: 'stretch', gap: spacing.sm },
  promise: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md,
    borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle,
  },
  promiseIcon: { fontSize: 30, lineHeight: 36 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tileCell: { width: '31.5%' },
  tile: {
    alignItems: 'center', gap: 4, paddingVertical: spacing.md, paddingHorizontal: 2,
    borderRadius: radius.xl, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.borderSubtle, backgroundColor: colors.surface,
  },
  tileSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  check: {
    position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary,
  },
  checkText: { color: '#FFFFFF', fontSize: 12, lineHeight: 14, fontWeight: '900' },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  goalCell: { width: '48.5%' },
  goalTile: {
    alignItems: 'center', gap: 4, padding: spacing.md, minHeight: 108, justifyContent: 'center',
    borderRadius: radius.xl, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.borderSubtle, backgroundColor: colors.surface,
  },
  goalIcon: { fontSize: 28, lineHeight: 34 },
  planRow: { flexDirection: 'row', gap: spacing.xs },
  plan: {
    flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.md,
    borderRadius: radius.xl, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.borderSubtle, backgroundColor: colors.surface,
  },
  planIcon: { fontSize: 24, lineHeight: 30 },
  levelChoice: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg,
    borderRadius: radius.xl, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.borderSubtle, backgroundColor: colors.surface,
  },
  levelIcon: { fontSize: 34, lineHeight: 40 },
  levelRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surface,
  },
  levelBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  // The continue button stays visible at the bottom while the list scrolls (web).
  sticky: Platform.OS === 'web'
    ? { position: 'sticky' as 'relative', bottom: 0, zIndex: 2, paddingVertical: spacing.sm, backgroundColor: colors.background }
    : { paddingTop: spacing.sm },
  doneHero: { alignItems: 'center', gap: spacing.sm },
  summary: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryIconBox: { width: 32, alignItems: 'center' },
  summaryIcon: { fontSize: 22, lineHeight: 28 },
});
