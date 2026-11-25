import { recallRound } from '@/features/learn/recall-round';
import { SocialShortcuts } from '@/features/learn/social-shortcuts';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { canSpeak, speak, useVoicesReady } from '@/lib/speech';

import Animated from 'react-native-reanimated';

import { Confetti } from '@/components/confetti';
import { Medved } from '@/components/medved';
import { usePop, useShake } from '@/components/motion';
import { showHint } from '@/components/hint';
import { AppText, Button, Card, EmptyState, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { activityLabel, entriesForUnit, findLesson, type CefrLevel, type Course, type Exercise, type Lesson, type Reading } from '@/features/learn/catalog';
import { ExerciseView, WritingExercise, expectedAnswer, promptText } from '@/features/learn/exercise';
import { ListeningPassage } from '@/features/learn/listening-passage';
import { RegisterListening } from '@/features/learn/register-listening';
import { usePracticeReview } from '@/features/learn/practice-review';
import { useCompleteLesson, useCompletions, useLearnProgress, useLearnSummary, type LessonResult } from '@/features/learn/progress';
import { DailyLimitCard, LearnCards, LessonProgress } from '@/features/learn/lesson-intro';
import { practiceSet } from '@/features/learn/practice-set';
import { wordStations } from '@/features/learn/exams';
import { paywallActive } from '@/features/plus/config';
import { lessonAccess } from '@/features/plus/limits';
import { useAddCourseLanguage } from '@/features/profile/learning-language';
import { celebrate } from '@/features/game/celebrations';
import { dayKey, HINT_PRICE, LEGENDARY_GEMS, MAX_HEARTS, useGame } from '@/features/game/store';
import { crownsFor, levelFromXp, levelTitle } from '@/features/game/progression';
import { useDeviceState } from '@/lib/device-state';
import { useSession } from '@/providers/session-provider';
import { activityDuration, type LessonDraft } from '@/features/learn/next-lesson';
import { feedback, setSoundEnabled, useSoundEnabled } from '@/lib/feedback';
import { getUiLanguage, t } from '@/lib/i18n';
import { medvedPhrases } from '@/features/learn/medved-phrases';
import { letterPair } from '@/features/learn/content/alphabets';
import { track } from '@/lib/insights';

export default function LessonScreen() {
  const { id, view, exchangeLanguageId } = useLocalSearchParams<{ id: string; view?: string; exchangeLanguageId?: string }>();
  const lesson = typeof id === 'string' ? findLesson(id) : undefined;
  if (!lesson || (view === 'grammar' && 'text' in lesson.entry)) {
    return (
      <Screen>
        <ScreenHeader title={t("GrammarFirst")} />
        <EmptyState title={t("Lesson not found")} actionLabel={t("Go to Learn")} onAction={() => router.replace('/learn')} />
      </Screen>
    );
  }

  if (view === 'grammar') {
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <ScreenHeader title={t(lesson.course.name) + ' · ' + t('Grammar')} />
        <GrammarReference entry={lesson.entry} level={lesson.level} />
      </Screen>
    );
  }

  const languageId = Number(exchangeLanguageId);
  return <LessonSession key={lesson.entry.id} entry={lesson.entry} course={lesson.course} level={lesson.level}
    exchangeLanguageId={Number.isSafeInteger(languageId) && languageId > 0 ? languageId : undefined} />;
}

function LessonSession({ entry, course, level, exchangeLanguageId }: {
  entry: Lesson | Reading; course: Course; level: CefrLevel; exchangeLanguageId?: number;
}) {
  const { styles } = useThemedStyles(createStyles);
  const addCourseLanguage = useAddCourseLanguage();
  const game = useGame();
  const { user } = useSession();
  const [drafts, writeDrafts] = useDeviceState<Record<string, LessonDraft>>(user?.id, 'lessons', {});
  const stored = drafts[entry.id];
  const dictation = !!game.state.hardMode && canSpeak(course.id);
  const items = useMemo(() => practiceSet(entry, { dictation }), [entry, dictation]);
  const exercises = useMemo(() => items.map((item) => item.exercise), [items]);
  const [answers, setAnswers] = useState<(boolean | null)[]>(() =>
    stored?.answers.slice(0, exercises.length) ?? []);
  const [given, setGiven] = useState<string[]>(() => stored?.given?.slice(0, exercises.length) ?? []);
  const [writing, setWriting] = useState(stored?.writing ?? '');
  const [started, setStarted] = useState(!!stored);
  const [retry, setRetry] = useState<{ indices: number[]; answers: boolean[]; second?: boolean }>();
  const [secondChance, setSecondChance] = useState<{ fixed: number; total: number }>();
  const save = useCompleteLesson(entry.id);
  const review = usePracticeReview();
  const retryStep = retry?.answers.length ?? 0;
  const step = !started ? -1 : retry ? retry.indices[retryStep] ?? exercises.length : answers.length;
  const finished = step === exercises.length;
  const scoredTotal = exercises.filter(({ type }) => type !== 'writing').length;
  const correctCount = answers.filter(Boolean).length;
  const score = Math.round(correctCount * 100 / Math.max(scoredTotal, 1));
  const exercise = exercises[step];
  const isLast = retry ? retryStep + 1 === retry.indices.length : step + 1 === exercises.length;
  const listening = 'text' in entry && entry.listening;
  const workshop = scoredTotal < exercises.length;
  const missed = answers.flatMap((answer, index) => answer === false ? [index] : []);
  const next = entryAfter(course, entry.id);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [fast, setFast] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [ruleOpen, setRuleOpen] = useState(false);
  const comboPop = usePop(combo >= 3 ? combo : 0);
  const [heartsLost, setHeartsLost] = useState(0);
  const heartShake = useShake(heartsLost);
  // Hard mode is switched on the start card, so it holds for the whole lesson (also after a reload).
  const hardRun = !!game.state.hardMode;
  const sound = useSoundEnabled();
  const completions = useCompletions();
  const best = useLearnProgress().data?.[entry.id];
  const progress = useLearnProgress();
  const access = lessonAccess({
    id: entry.id, level, completed: progress.data?.[entry.id] !== undefined, isPlus: game.isPlus,
    enforced: paywallActive, freeDay: game.state.freeDay, today: dayKey(),
  });
  const unitIndex = course.units.findIndex((unit) => entriesForUnit(unit).some((item) => item.id === entry.id));
  const unitWords = useMemo(() => wordStations(course).get(unitIndex)?.words.filter(([, meaning]) => meaning).slice(0, 6), [course, unitIndex]);

  // A short tune when the lesson is done, like finishing a level in a game,
  // and the speed bonus: one gem per fast right answer (up to 8).
  const celebrating = finished && !retry && started;
  const rewarded = useRef(false);
  useEffect(() => {
    if (!celebrating) return;
    feedback(score === 100 ? 'perfect' : 'win');
    if (!rewarded.current && fast >= 3) {
      rewarded.current = true;
      game.addGems(Math.min(fast, 8));
      game.recordFast(fast);
    }
  }, [celebrating]); // eslint-disable-line react-hooks/exhaustive-deps

  function checked(correct: boolean, milliseconds: number) {
    const nextCombo = correct ? combo + 1 : 0;
    setCombo(nextCombo);
    setBestCombo((best) => Math.max(best, nextCombo));
    const quick = exercise && (exercise.type === 'choice' ? 6000 : 12000);
    if (correct && !retry && quick && milliseconds < quick) setFast((count) => count + 1);
    if (nextCombo > 0) game.recordCombo(nextCombo);
    if ([3, 5, 10, 15, 20].includes(nextCombo)) setTimeout(() => feedback('combo'), 220);
    if (!correct && !retry && !game.isPlus) setTimeout(() => feedback('heart'), 380);
  }

  function persist(next: (boolean | null)[], text = '', nextGiven = given) {
    writeDrafts((current) => ({
      ...current,
      [entry.id]: { id: entry.id, answers: next, given: nextGiven, writing: text, updatedAt: Date.now() },
    }));
  }

  function saveResult(result: number) {
    void save.mutateAsync(result).then((data) => {
      writeDrafts((current) => {
        const remaining = { ...current };
        delete remaining[entry.id];
        return remaining;
      });
      game.clearPending(entry.id);
      track('lesson_completed', { course: course.id, score: result });
      game.recordLesson({
        courseId: course.id,
        score: result,
        xp: data.earned_xp,
        streak: data.streak,
        boostUntil: data.boost_until ? Date.parse(data.boost_until) : undefined,
        hard: hardRun,
      });
      if (hardRun && result === 100) game.markLegendary(entry.id);
      // One celebration, the biggest moment wins.
      if (data.goal_reached && [7, 14, 30, 50, 100, 200, 365].includes(data.streak)) {
        celebrate({ icon: '🔥', title: t('{n}-day streak!', { n: data.streak }), message: t('Amazing! Keep it going.') });
      } else if (data.goal_reached) {
        celebrate({ icon: '🎯', title: t('Daily goal reached!'), message: t('Your streak is now {n} days.', { n: data.streak }) });
      } else if (result === 100) {
        celebrate({ icon: '💯', title: t('Perfect!'), message: data.boost_until && !data.boosted ? t('⚡ Double XP for the next 15 minutes!') : t('Every answer was right.') });
      }
    }).catch((error: unknown) => {
      // Offline: keep the result and send it when the connection is back.
      const message = error instanceof Error ? error.message : String(error);
      const offline = (typeof navigator !== 'undefined' && navigator.onLine === false) || /fetch|network|connection/i.test(message);
      if (offline) game.queueResult({ entryId: entry.id, score: result, at: Date.now() });
    });
  }

  /** Reading-only lessons (the alphabet): mark them done and go straight on. */
  function finishReading() {
    void addCourseLanguage(course, level);
    saveResult(100);
    if (next) openNext();
    else router.replace('/learn');
  }

  function begin() {
    // Starting a course puts its language on the profile.
    void addCourseLanguage(course, level);
    save.reset();
    setRetry(undefined);
    setAnswers([]);
    setGiven([]);
    setWriting('');
    setStarted(true);
    setCombo(0);
    setBestCombo(0);
    setFast(0);
    setSecondChance(undefined);
    rewarded.current = false;
    setStartedAt(Date.now());
    if (access.allowed && access.reason === 'daily') game.startFreeLesson(entry.id);
    feedback('whoosh');
    persist([], '', []);
  }

  function advance(correct: boolean | null, answer = '') {
    const source = items[step]?.source;
    if (correct !== null && source !== undefined) review.recordAnswer(entry.id, source, entry.ex[source], correct);
    if (correct === false && !retry) { game.loseHeart(); if (!game.isPlus) setHeartsLost((count) => count + 1); }
    if (retry) {
      const retryAnswers = [...retry.answers, correct === true];
      // Second chance: every fixed mistake gives the heart back.
      if (retry.second && correct) { game.refundHeart(); setTimeout(() => feedback('refund'), 300); }
      if (retry.second && retryAnswers.length === retry.indices.length) {
        setSecondChance({ fixed: retryAnswers.filter(Boolean).length, total: retry.indices.length });
        game.recordSecondFixed(retryAnswers.filter(Boolean).length);
        setRetry(undefined);
        return;
      }
      setRetry({ ...retry, answers: retryAnswers });
      return;
    }
    const nextAnswers = [...answers, correct];
    const nextGiven = [...given, answer];
    setAnswers(nextAnswers);
    setGiven(nextGiven);
    setWriting('');
    persist(nextAnswers, '', nextGiven);
    if (isLast) {
      setSeconds(Math.round((Date.now() - (startedAt || Date.now())) / 1000));
      saveResult(Math.round(nextAnswers.filter(Boolean).length * 100 / Math.max(scoredTotal, 1)));
      // Missed questions come back once more before the results.
      const wrong = nextAnswers.flatMap((value, index) => value === false ? [index] : []);
      if (wrong.length > 0 && !workshop) setRetry({ indices: wrong, answers: [], second: true });
    }
  }

  function openNext() {
    if (!next) return;
    router.replace({ pathname: '/lesson/[id]', params: { id: next.id } });
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t(course.name) + ' · GrammarFirst'} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView key={retry ? `retry-${retryStep}` : step} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <AppText variant="title" accessibilityRole="header">{entry.title}</AppText>
          {step < 0 ? (
            <>
              {'alphabet' in entry && entry.alphabet && entry.ex.length === 0 ? (
                <>
                  <LessonContent entry={entry} />
                  <View style={styles.stickyFooter}>
                    <Button title={next ? t('Continue to the next lesson →') : t('Back to Learn')} size="lg" fullWidth onPress={finishReading} />
                  </View>
                </>
              ) : !('text' in entry) && !entry.alphabet ? (
                <LearnCards lesson={entry} courseId={course.id} words={unitWords}
                  footer={<StartFooter access={access} hearts={game.hearts} total={exercises.length} onStart={begin} best={best} crowns={crownsFor(completions.data?.[entry.id] ?? 0)} />} />
              ) : (
                <>
                  {listening ? <ListeningPassage text={entry.text} courseId={course.id} /> : <LessonContent entry={entry} />}
                  {listening && <RegisterListening entryId={entry.id} />}
                  <StartFooter access={access} hearts={game.hearts} total={exercises.length} onStart={begin} best={best} crowns={crownsFor(completions.data?.[entry.id] ?? 0)} />
                </>
              )}
            </>
          ) : finished && retry && !retry.second ? (
            <Card style={styles.group}>
              <AppText variant="heading">{t("Review complete")}</AppText>
              <AppText>{t('{correct} of {total} correct', { correct: retry.answers.filter(Boolean).length, total: retry.indices.length })}</AppText>
              <Button title={t("Back to results")} onPress={() => setRetry(undefined)} />
            </Card>
          ) : finished ? (
            <>
              <LessonCelebration
                courseId={course.id}
                score={score}
                correct={correctCount}
                total={scoredTotal}
                bestCombo={bestCombo}
                fast={fast}
                seconds={seconds}
                secondChance={secondChance}
                result={save.data}
                saving={save.isPending}
                error={save.isError ? save.error.message : null}
              />
              {!hardRun && score >= 80 && !('text' in entry) && !game.state.legendary?.includes(entry.id) ? (
                <AppText variant="callout" align="center" color="textSecondary">
                  {t('🏆 Next level: repeat this lesson in hard mode with 100% to make it legendary (+{n} 💎).', { n: LEGENDARY_GEMS })}
                </AppText>
              ) : null}
              {next ? (
                <View style={styles.upNext}>
                  <AppText variant="label" color="primary">{t("UP NEXT")}</AppText>
                  <AppText variant="heading">{next.title}</AppText>
                  <AppText variant="caption" color="textSecondary">
                    {t(activityLabel(next))} · {t('about {n} min', { n: activityDuration(next.ex) })}
                  </AppText>
                  <Button title={t("Continue to the next lesson →")} size="lg" fullWidth
                    disabled={save.isPending} onPress={openNext} style={styles.upNextButton} />
                </View>
              ) : (
                <View style={styles.upNext}>
                  <AppText variant="heading" align="center">{t("🎉 You finished the last lesson of this course!")}</AppText>
                  <Button title={t("Back to Learn")} size="lg" fullWidth disabled={save.isPending}
                    onPress={() => router.replace('/learn')} />
                </View>
              )}
              {!save.isSuccess && !save.isPending && (
                <Button title={t("Save results")} variant="secondary" onPress={() => saveResult(score)} />
              )}
              {'examples' in entry && recallRound(entry.examples).length > 0 && (
                <Button title={t('Recall round')} variant="secondary"
                  onPress={() => router.push({ pathname: '/lesson-recall', params: { lesson: entry.id } })} />
              )}
              <SocialShortcuts course={course.id} />
              <View style={styles.resultActions}>
                <Button title={t('📣 Share')} size="sm" variant="secondary" onPress={() => void shareResult(course.name, entry.title, score)} />
                {missed.length > 0 ? <Button title={t('🔁 Practise my mistakes')} size="sm" variant="secondary" onPress={() => router.push('/practice-review')} /> : null}
                <Button title={t('⚑ Report a problem')} size="sm" variant="ghost"
                  onPress={() => router.push({ pathname: '/feedback', params: { topic: 'Lesson content', about: `${course.id} · ${entry.id} · ${entry.title}` } })} />
              </View>
              <AnswerReview exercises={exercises} answers={answers} given={given} />
              {missed.length > 0 && (
                <Button title={missed.length === 1 ? t('Retry 1 missed question') : t('Retry {n} missed questions', { n: missed.length })} variant="secondary"
                  disabled={save.isPending} onPress={() => setRetry({ indices: missed, answers: [] })} />
              )}
            </>
          ) : (
            <>
              <View style={styles.heartRow}>
                {retry ? (
                  <AppText variant="label" color="primary">
                    {retry.second ? t('🔁 Second chance {n} of {total} – win your hearts back', { n: retryStep + 1, total: retry.indices.length })
                      : t('Review {n} of {total}', { n: retryStep + 1, total: retry.indices.length })}
                  </AppText>
                ) : <LessonProgress results={answers} current={step} total={exercises.length} />}
                {combo >= 3 ? (
                  <Animated.View style={[styles.combo, { backgroundColor: comboTier(combo).color }, comboPop]} accessibilityLabel={t('{n} right in a row', { n: combo })}>
                    <AppText style={styles.comboText}>{t(comboTier(combo).label, { n: combo })}</AppText>
                  </Animated.View>
                ) : null}
                <Animated.View style={heartShake}>
                  <AppText variant="bodyStrong" accessibilityLabel={t('{n} hearts left', { n: game.hearts.count })}>
                    {game.isPlus ? '❤️ ∞' : `${'❤️'.repeat(game.hearts.count)}${'🤍'.repeat(MAX_HEARTS - game.hearts.count)}`}
                  </AppText>
                </Animated.View>
                <Pressable onPress={() => setSoundEnabled(!sound)} accessibilityRole="button" hitSlop={8}
                  accessibilityLabel={sound ? t('Sound off') : t('Sound on')}>
                  <AppText>{sound ? '🔊' : '🔇'}</AppText>
                </Pressable>
              </View>
              {!('text' in entry) ? (
                <>
                  <Button title={ruleOpen ? t('Hide the rule') : t('📖 Show the rule again')} size="sm" variant="ghost"
                    onPress={() => setRuleOpen(!ruleOpen)} />
                  {ruleOpen ? <Card><LessonContent entry={entry} /></Card> : null}
                </>
              ) : null}
              {listening ? <ListeningPassage text={entry.text} courseId={course.id} />
                : 'text' in entry && (workshop
                  ? <ReviewPassage text={entry.text} />
                  : <AppText>{entry.text.replace(/\*\*/g, '')}</AppText>)}
              {exercise.type === 'writing' ? (
                <WritingExercise exercise={exercise} draft={writing}
                  onDraft={(text) => { setWriting(text); persist(answers, text); }}
                  onContinue={() => advance(null, writing)} isLast={isLast} />
              ) : <ExerciseView exercise={exercise} onContinue={advance} onChecked={checked} isLast={isLast} courseId={course.id}
                  hard={hardRun} combo={combo} rule={'structure' in entry ? entry.structure : undefined} onHint={() => {
                    if (game.spendGems(HINT_PRICE)) return true;
                    showHint('💎', t('Not enough gems'), t('A hint costs {n} gems. Earn gems with lessons, chests and word stations.', { n: HINT_PRICE }));
                    return false;
                  }} />}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {celebrating && score >= 50 ? <Confetti /> : null}
    </Screen>
  );
}

/** "Start practice" – or why it is not possible right now (no hearts, daily limit). */
function StartFooter({ access, hearts, total, onStart, best, crowns }: {
  access: ReturnType<typeof lessonAccess>; hearts: { count: number; nextIn: number }; total: number; onStart: () => void;
  best?: number | null; crowns: number;
}) {
  const { styles } = useThemedStyles(createStyles);
  const game = useGame();
  if (!access.allowed) return <DailyLimitCard canBuy={access.canBuy} />;
  if (hearts.count <= 0) return <OutOfHearts nextIn={hearts.nextIn} />;
  const hard = !!game.state.hardMode;
  const gems = (10 + 5) * (game.isPlus ? 2 : 1) * (hard ? 2 : 1);
  return (
    <View style={styles.stickyFooter}>
      <View style={styles.metaRow}>
        <AppText variant="small" style={styles.metaChip}>{t('⏱ about {n} min', { n: Math.max(2, Math.round(total * 0.4)) })}</AppText>
        <AppText variant="small" style={styles.metaChip}>{t('💎 up to {n}', { n: gems })}</AppText>
        {best !== undefined && best !== null ? <AppText variant="small" style={styles.metaChip}>{t('🏅 best {n}%', { n: best })}{crowns ? ` · 👑${crowns}` : ''}</AppText> : null}
      </View>
      <Pressable onPress={() => { feedback('flip'); game.setHardMode(!hard); }} accessibilityRole="switch" accessibilityState={{ checked: hard }}
        style={[styles.hardToggle, hard && styles.hardOn]}>
        <AppText style={styles.flex} variant="callout">
          <AppText variant="bodyStrong">{t('⌨️ Hard mode')}</AppText> · {t('type answers instead of choosing, double gems')}
        </AppText>
        <View style={[styles.switch, hard && styles.switchOn]}><View style={[styles.knob, hard && styles.knobOn]} /></View>
      </Pressable>
      {access.reason === 'daily' ? (
        <AppText variant="caption" color="textSecondary" align="center" style={styles.freeNote}>
          {t('🎟 Free lesson · {n} left today', { n: access.left - 1 })}
        </AppText>
      ) : null}
      <Button title={t('Start practice · {n} exercises', { n: total })} size="lg" fullWidth onPress={onStart} />
    </View>
  );
}

/** Shown instead of "Start practice" when all hearts are used up. */
function OutOfHearts({ nextIn }: { nextIn: number }) {
  const { styles } = useThemedStyles(createStyles);
  const minutes = Math.max(1, Math.ceil(nextIn / 60_000));
  return (
    <View style={styles.hearts}>
      <AppText style={styles.heartsIcon}>💔</AppText>
      <AppText variant="heading" align="center">{t('Out of hearts')}</AppText>
      <AppText align="center" color="textSecondary">
        {t('Fix a mistake from your review to get a heart back, or wait {n} min for the next one.', { n: minutes })}
      </AppText>
      <Button title={t('🔁 Review mistakes')} size="lg" fullWidth onPress={() => router.push('/practice-review')} />
      <Button title={t('♾️ Unlimited hearts with Plus')} variant="secondary" fullWidth onPress={() => router.push('/plus')} />
    </View>
  );
}

/** Native share sheet, the browser share dialog, or the clipboard as a fallback. */
async function shareResult(courseName: string, title: string, score: number) {
  const message = t('I just finished “{title}” in {course} on Lingora with {score}%! 🎉', { title, course: t(courseName), score });
  try {
    if (Platform.OS === 'web') {
      const nav = typeof navigator !== 'undefined' ? navigator as Navigator & { share?: (data: { text: string }) => Promise<void> } : undefined;
      if (nav?.share) await nav.share({ text: message });
      else { await nav?.clipboard?.writeText(message); showHint('📋', t('Copied'), t('Paste it wherever you like.')); }
    } else await Share.share({ message });
  } catch { /* Cancelled. */ }
}

/** The combo badge gets hotter the longer the run. */
function comboTier(combo: number) {
  if (combo >= 10) return { label: '💜 {n} unstoppable!', color: '#7C4DFF' };
  if (combo >= 5) return { label: '🔥 {n} on fire!', color: '#E5383B' };
  return { label: '🔥 {n} in a row', color: '#FF7A00' };
}

/** The entry that follows `id` on the course path, crossing into the next unit. */
function entryAfter(course: Course, id: string) {
  const all = course.units.flatMap(entriesForUnit);
  const index = all.findIndex((item) => item.id === id);
  return index >= 0 ? all[index + 1] : undefined;
}

/** Every exercise of the attempt with the learner's answer and whether it was right. */
function AnswerReview({ exercises, answers, given }: {
  exercises: Exercise[];
  answers: (boolean | null)[];
  given: string[];
}) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <Card style={styles.group}>
      <AppText variant="heading" accessibilityRole="header">{t("Your answers")}</AppText>
      {exercises.map((item, index) => {
        const correct = answers[index];
        const answer = given[index]?.trim();
        const writing = item.type === 'writing';
        const tone = writing || correct === null ? styles.reviewNeutral : correct ? styles.reviewRight : styles.reviewWrong;
        const status = writing ? t('Writing practice, not graded') : correct ? t('Correct') : t('Wrong');
        return (
          <View key={index} style={[styles.reviewItem, tone]}
            accessible accessibilityLabel={`Question ${index + 1}. ${status}. ${item.prompt}. Your answer: ${answer || 'none'}.${!writing && !correct ? ` Correct answer: ${expectedAnswer(item)}.` : ''}`}>
            <View style={styles.reviewHead}>
              <AppText variant="bodyStrong" color={writing ? 'textSecondary' : correct ? 'success' : 'danger'}>
                {writing ? '✎' : correct ? '✓' : '✗'}
              </AppText>
              <AppText variant="bodyStrong" style={styles.flex}>{promptText(item.prompt)}</AppText>
            </View>
            {item.audio ? <AppText variant="callout" color="textSecondary">🔊 {item.audio}</AppText> : null}
            <AppText variant="callout">
              <AppText variant="callout" color="textSecondary">{t("Your answer:")} </AppText>
              {answer || '—'}
            </AppText>
            {!writing && correct === false ? (
              <AppText variant="callout">
                <AppText variant="callout" color="textSecondary">{t("Correct answer:")} </AppText>
                <AppText variant="callout" color="success" style={styles.bold}>{expectedAnswer(item)}</AppText>
              </AppText>
            ) : null}
            {!writing && item.explain ? <AppText variant="caption" color="textSecondary">{item.explain}</AppText> : null}
          </View>
        );
      })}
    </Card>
  );
}

function ReviewPassage({ text }: { text: string }) {
  const { styles } = useThemedStyles(createStyles);
  const [expanded, setExpanded] = useState(false);
  return (
    <Card style={styles.group}>
      <Button title={expanded ? t("Hide reading passage") : t("Show reading passage")} variant="ghost"
        accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} />
      {expanded && <AppText>{text}</AppText>}
    </Card>
  );
}

function LessonCelebration({ courseId, score, correct, total, result, saving, error, bestCombo, fast, seconds, secondChance }: {
  courseId: string;
  score: number;
  correct: number;
  total: number;
  bestCombo: number;
  fast: number;
  seconds: number;
  secondChance?: { fixed: number; total: number };
  result?: LessonResult;
  saving: boolean;
  error: string | null;
}) {
  const { styles } = useThemedStyles(createStyles);
  const stars = score === 100 ? 3 : score >= 80 ? 2 : 1;
  const mood = score >= 80 ? 'cheer' : score >= 50 ? 'happy' : 'sad';
  const phrases = medvedPhrases(courseId, getUiLanguage());
  const headline = score === 100 ? `${t('Perfect!')} ${phrases.perfect}` : score >= 80 ? `${t('Great job!')} ${phrases.praise}` : score >= 50 ? t('Lesson complete!') : t('Good effort, keep practising!');
  const goalProgress = result ? Math.min(result.daily_xp / result.daily_goal_xp, 1) : 0;
  // Stars pop in one after the other, each with a chime; XP counts up.
  const [shownStars, setShownStars] = useState(0);
  useEffect(() => {
    const timers = Array.from({ length: stars }, (_, index) => setTimeout(() => {
      setShownStars(index + 1);
      feedback('star');
    }, 450 + index * 380));
    return () => timers.forEach(clearTimeout);
  }, [stars]);
  const xp = useCountUp(result?.earned_xp ?? 0);
  const time = seconds > 0 ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : '–';

  return (
    <Card style={styles.celebration}>
      <Medved mood={mood} size={128} />
      <AppText variant="title" align="center" accessibilityRole="header">{headline}</AppText>
      <View style={styles.starRow} accessibilityLabel={t('{n} of 3 stars', { n: stars })}>
        {[0, 1, 2].map((index) => <PopStar key={index} on={index < shownStars} />)}
      </View>
      <View style={styles.statRow}>
        <Stat icon="🎯" value={`${score}%`} label={t('{correct} of {total} correct', { correct, total })} />
        <Stat icon="🔥" value={String(bestCombo)} label={t('best combo')} />
        <Stat icon="⏱" value={time} label={t('time')} />
      </View>
      {fast >= 3 ? <AppText variant="bodyStrong" align="center">{t('⚡ Speed bonus: {n} fast answers · +{gems} 💎', { n: fast, gems: Math.min(fast, 8) })}</AppText> : null}
      {secondChance ? (
        <AppText variant="callout" align="center" color={secondChance.fixed === secondChance.total ? 'success' : 'textSecondary'}>
          {t('🔁 Second chance: fixed {fixed} of {total} – one heart back for each', secondChance)}
        </AppText>
      ) : null}

      {saving ? <AppText align="center">{t("Saving your progress…")}</AppText> : null}
      {error ? <AppText align="center" color="danger">{error}</AppText> : null}

      {result ? (
        <View style={styles.rewards}>
          <View style={styles.rewardRow}>
            <Reward icon={result.boosted ? '⚡' : '💎'} value={`+${xp} XP${result.boosted ? ' ×2' : ''}`} />
            <Reward icon="🔥" value={result.streak === 1 ? t('1 day') : t('{n} days', { n: result.streak })} />
          </View>
          {result.earned_xp === 0 ? (
            <AppText variant="caption" align="center" color="textSecondary">
              {t("You already practised this lesson today. Try a new one for more XP.")}
            </AppText>
          ) : null}
          {result.new_best && !result.first_completion ? (
            <AppText variant="bodyStrong" align="center" color="success">{t("New best score!")}</AppText>
          ) : null}

          <View style={styles.goal}>
            <View style={styles.goalLabel}>
              <AppText variant="caption" color="textSecondary">{t("🎯 Daily goal")}</AppText>
              <AppText variant="caption" color="textSecondary">
                {Math.min(result.daily_xp, result.daily_goal_xp)} / {result.daily_goal_xp} XP
              </AppText>
            </View>
            <View style={styles.goalTrack} accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: result.daily_goal_xp, now: Math.min(result.daily_xp, result.daily_goal_xp) }}>
              <View style={[styles.goalFill, { width: `${goalProgress * 100}%` }]} />
            </View>
          </View>

          <LevelBar />
          {result.goal_reached ? (
            <AppText variant="bodyStrong" align="center" color="success">
              {t('Daily goal reached! Your streak is now {n} days 🔥', { n: result.streak })}
            </AppText>
          ) : null}
          {result.freeze_used ? (
            <AppText variant="caption" align="center">{t("🧊 A streak freeze saved your streak.")}</AppText>
          ) : null}
          {result.freeze_earned ? (
            <AppText variant="caption" align="center">{t("🧊 You earned a streak freeze for a missed day.")}</AppText>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

/** Player level after this lesson. */
function LevelBar() {
  const { styles } = useThemedStyles(createStyles);
  const summary = useLearnSummary().data;
  if (!summary) return null;
  const level = levelFromXp(summary.total_xp ?? 0);
  return (
    <View style={styles.goal}>
      <View style={styles.goalLabel}>
        <AppText variant="caption" color="textSecondary">{t('⭐ Level {n} · {title}', { n: level.level, title: t(levelTitle(level.level)) })}</AppText>
        <AppText variant="caption" color="textSecondary">{t('{n} XP to level {next}', { n: level.span - level.into, next: level.level + 1 })}</AppText>
      </View>
      <View style={styles.goalTrack}>
        <View style={[styles.goalFill, styles.levelFill, { width: `${Math.max(3, level.progress * 100)}%` }]} />
      </View>
    </View>
  );
}

function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    const started = Date.now();
    const timer = setInterval(() => {
      const share = Math.min(1, (Date.now() - started) / 900);
      setValue(Math.round(target * (1 - Math.pow(1 - share, 3))));
      if (share >= 1) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return target ? value : 0;
}

function PopStar({ on }: { on: boolean }) {
  const { styles } = useThemedStyles(createStyles);
  const pop = usePop(on ? 1 : null);
  return <Animated.Text style={[styles.bigStar, !on && styles.starOff, pop]}>★</Animated.Text>;
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.stat}>
      <AppText variant="heading">{icon} {value}</AppText>
      <AppText variant="small" color="textSecondary" align="center">{label}</AppText>
    </View>
  );
}

function Reward({ icon, value }: { icon: string; value: string }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.reward}>
      <AppText variant="heading">{icon} {value}</AppText>
    </View>
  );
}

function GrammarReference({ entry, level }: { entry: Lesson | Reading; level: CefrLevel }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <AppText variant="label" color="primary">{level} · {t('Grammar reference')}</AppText>
      <AppText variant="title" accessibilityRole="header">{entry.title}</AppText>
      <LessonContent entry={entry} />
      <View style={styles.practiseBox}>
        <AppText variant="heading">{t('Ready to try it?')}</AppText>
        <AppText variant="callout" color="textSecondary">{t('Practise this rule with a few short exercises.')}</AppText>
        <Button title={t('✍️ Practise this rule →')} size="lg" fullWidth
          onPress={() => router.replace({ pathname: '/lesson/[id]', params: { id: entry.id } })} />
      </View>
    </ScrollView>
  );
}

function LessonContent({ entry }: { entry: Lesson | Reading }) {
  const { styles } = useThemedStyles(createStyles);
  if ('text' in entry) {
    return (
      <Card style={styles.group}>
        <AppText>{entry.text.replace(/\*\*/g, '')}</AppText>
        {entry.tr && (
          <>
            <AppText variant="label" color="primary">{t("English translation")}</AppText>
            <AppText color="textSecondary">{entry.tr}</AppText>
          </>
        )}
      </Card>
    );
  }

  return (
    <>
      <Card style={styles.group}>
        <AppText variant="heading">{t("The rule")}</AppText>
        <AppText>{entry.rule}</AppText>
        {entry.structure ? <AppText variant="bodyStrong">{entry.structure}</AppText> : null}
        {entry.tip ? <AppText color="textSecondary">{entry.tip}</AppText> : null}
      </Card>
      {entry.examples.length > 0 && (
        <Card style={styles.group}>
          <AppText variant="heading">{t("Examples")}</AppText>
          {entry.examples.map(([example, translation], index) => (
            <View key={index}>
              <AppText variant="bodyStrong">{example}</AppText>
              {translation && <AppText color="textSecondary">{translation}</AppText>}
            </View>
          ))}
        </Card>
      )}
      {entry.alphabet ? <AlphabetGrid letters={entry.alphabet} courseId={findLesson(entry.id)?.course.id ?? ''} /> : null}
      {entry.more ? <AppText>{entry.more}</AppText> : null}
      {entry.table && (
        <ScrollView horizontal>
          <View>
            {[entry.table.head, ...entry.table.rows].map((row, index) => (
              <View key={index} style={styles.row}>
                {row.map((cell, cellIndex) => (
                  <AppText key={cellIndex} style={styles.cell} variant={index === 0 ? 'bodyStrong' : 'body'}>{cell}</AppText>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </>
  );
}

/** Alphabet tiles: tap a letter to hear it and its example word. */
function AlphabetGrid({ letters, courseId }: { letters: NonNullable<Lesson['alphabet']>; courseId: string }) {
  useVoicesReady();
  const { styles } = useThemedStyles(createStyles);
  const audio = canSpeak(courseId);
  return (
    <Card style={styles.group}>
      <AppText variant="heading">{t('The alphabet')}</AppText>
      <AppText variant="caption" color="textSecondary">
        {audio ? t('Tap a letter to hear it with an example word.') : t('Read each letter with its sound and an example word.')}
      </AppText>
      <View style={styles.letters}>
        {letters.map((item) => (
          <Pressable
            key={item.letter}
            disabled={!audio}
            onPress={() => speak(`${item.letter.toLocaleUpperCase()}. ${item.example}`, courseId, undefined, 0.8)}
            accessibilityRole={audio ? 'button' : undefined}
            accessibilityLabel={`${letterPair(item.letter)}. ${item.sound}. ${item.example}${item.meaning ? `, ${item.meaning}` : ''}`}
            style={({ pressed }) => [styles.letterTile, pressed && styles.letterPressed]}
          >
            <AppText style={styles.letterText}>{letterPair(item.letter)}</AppText>
            <AppText variant="small" color="primary" align="center" style={styles.letterSound}>{item.sound}</AppText>
            <AppText variant="small" align="center" style={styles.bold} numberOfLines={1}>
              {audio ? '🔊 ' : ''}{item.example}
            </AppText>
            {item.meaning ? <AppText variant="small" color="textSecondary" align="center" numberOfLines={1}>{item.meaning}</AppText> : null}
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  stickyFooter: Platform.OS === 'web'
    ? { position: 'sticky' as 'relative', bottom: 0, zIndex: 2, paddingVertical: spacing.sm, backgroundColor: colors.background }
    : {},
  flex: { flex: 1 },
  content: { padding: screenPadding, gap: spacing.lg, paddingBottom: spacing.xxxl },
  group: { gap: spacing.sm },
  bold: { fontWeight: '700' },
  letters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  letterTile: {
    width: '31.5%', alignItems: 'center', gap: 2, paddingVertical: spacing.sm, paddingHorizontal: 4,
    borderRadius: radius.lg, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.borderSubtle, backgroundColor: colors.surface,
  },
  letterPressed: { transform: [{ translateY: 2 }], borderColor: colors.primary },
  letterText: { fontSize: 26, lineHeight: 32, fontWeight: '900', color: colors.text },
  letterSound: { fontSize: 11, lineHeight: 14 },
  upNext: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  upNextButton: { marginTop: spacing.sm },
  hearts: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.dangerSoft },
  heartsIcon: { fontSize: 44, lineHeight: 52 },
  heartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  combo: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full, backgroundColor: '#FF7A00' },
  comboText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, lineHeight: 18 },
  practiseBox: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  reviewItem: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.lg, borderLeftWidth: 4 },
  reviewHead: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  reviewRight: { backgroundColor: colors.successSoft, borderLeftColor: colors.success },
  reviewWrong: { backgroundColor: colors.dangerSoft, borderLeftColor: colors.danger },
  reviewNeutral: { backgroundColor: colors.surfaceMuted, borderLeftColor: colors.border },
  celebration: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  bigStars: { fontSize: 36, lineHeight: 44, letterSpacing: 6, color: '#F5B700' },
  starRow: { flexDirection: 'row', gap: spacing.sm },
  bigStar: { fontSize: 48, lineHeight: 56, color: '#F5B700' },
  starOff: { color: colors.surfaceMuted },
  statRow: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'stretch' },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted },
  freeNote: { marginBottom: spacing.xs },
  resultActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' },
  levelFill: { backgroundColor: '#8E7CF8' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center', marginBottom: spacing.xs },
  metaChip: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, color: colors.textSecondary, overflow: 'hidden' },
  hardToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, marginBottom: spacing.sm, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.borderSubtle, backgroundColor: colors.surface },
  hardOn: { borderColor: '#8E7CF8', backgroundColor: colors.primarySoft },
  switch: { width: 42, height: 24, borderRadius: 12, padding: 3, backgroundColor: colors.surfaceMuted },
  switchOn: { backgroundColor: '#8E7CF8' },
  knob: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF' },
  knobOn: { transform: [{ translateX: 18 }] },
  rewards: { alignSelf: 'stretch', gap: spacing.md, marginTop: spacing.sm },
  rewardRow: { flexDirection: 'row', gap: spacing.sm },
  reward: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  goal: { gap: spacing.xs },
  goalLabel: { flexDirection: 'row', justifyContent: 'space-between' },
  goalTrack: { height: 12, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.success },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.border },
  cell: { width: 136, padding: spacing.sm },
});
