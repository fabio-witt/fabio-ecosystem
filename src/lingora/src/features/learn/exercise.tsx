import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Medved } from '@/components/medved';
import { usePop, useShake } from '@/components/motion';

import { AppText, Button } from '@/components/ui';
import { radius, spacing, typography, useThemedStyles, type ThemeColors } from '@/constants/theme';

import { normalizeAnswer, shuffled, type Exercise } from './catalog';
import { HINT_PRICE, useGame } from '@/features/game/store';
import { feedback } from '@/lib/feedback';
import { canSpeak, speak } from '@/lib/speech';

import { PronunciationCheck } from './pronunciation';
import { t } from '@/lib/i18n';

export type ScoredExercise = Exclude<Exercise, { type: 'writing' }>;

/** Letters that are hard to type on a normal keyboard, per course. */
const ACCENTS: Record<string, string[]> = {
  de: ['ä', 'ö', 'ü', 'ß'], gsw: ['ä', 'ö', 'ü'],
  es: ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'],
  fr: ['é', 'è', 'ê', 'à', 'â', 'ç', 'ô', 'î', 'û', 'ù', 'œ'],
  it: ['à', 'è', 'é', 'ì', 'ò', 'ù'],
  pt: ['ã', 'õ', 'á', 'é', 'í', 'ó', 'ú', 'â', 'ê', 'ô', 'ç'],
  pl: ['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż'],
  ga: ['á', 'é', 'í', 'ó', 'ú'],
  sh: ['č', 'ć', 'š', 'ž', 'đ'],
};

function typoDistance(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    previous = current;
  }
  return previous[b.length];
}

const CHEERS = ['Nice one!', 'Exactly!', 'You nailed it!', 'Spot on!', 'Keep going!'];
const COMFORT = ['Look at the pattern once more.', 'Mistakes help you learn.', 'Next time you have it!'];

const FIXED_PROMPTS = new Set(['Match each sentence with its meaning.', 'Listen and choose the meaning.', 'Listen and write what you hear.']);

/** Prompts made by the app are translated; prompts from the course content stay as written. */
export function promptText(prompt: string) {
  if (FIXED_PROMPTS.has(prompt)) return t(prompt);
  if (prompt.startsWith('Translate: ')) return `${t('Translate:')} ${prompt.slice('Translate: '.length)}`;
  return prompt;
}

export function expectedAnswer(exercise: ScoredExercise): string {
  switch (exercise.type) {
    case 'choice': return exercise.options[exercise.answer];
    case 'build': return exercise.answer;
    case 'type': return exercise.accept.join(' / ');
    case 'match': return exercise.pairs.map(([left, right]) => left + ' → ' + right).join(' · ');
  }
}

export function ExerciseView({
  exercise,
  onContinue,
  onChecked,
  isLast,
  courseId,
  hard = false,
  onHint,
  rule,
  combo = 0,
}: {
  /** The rule's pattern, shown again after a mistake. */
  rule?: string;
  /** Current combo, so right answers sound brighter the longer the run. */
  combo?: number;
  exercise: ScoredExercise;
  /** Hard mode: type the answer of a choice question instead of picking it. */
  hard?: boolean;
  /** Pays for a hint; returns false when the learner cannot afford it. */
  onHint?: () => boolean;
  /** `given` is the learner's answer as text, for the lesson summary. */
  onContinue: (correct: boolean, given: string) => void;
  /** Called the moment an answer is checked (for combos and the speed bonus). */
  onChecked?: (correct: boolean, milliseconds: number) => void;
  isLast: boolean;
  /** Course of the lesson, for read-aloud, pronunciation check and saving sentences. */
  courseId?: string;
}) {
  const { colors, styles } = useThemedStyles(createStyles);
  const [result, setResult] = useState<boolean | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [tokens] = useState(() => exercise.type === 'build'
    ? shuffled([...exercise.answer.split(/\s+/), ...exercise.extra])
    : []);
  const [order, setOrder] = useState<number[]>([]);
  const [rightOrder] = useState(() => exercise.type === 'match'
    ? shuffled(exercise.pairs.map((_, index) => index))
    : []);
  // Shown in random order so the right answer is not always in the same place.
  const [optionOrder] = useState(() => exercise.type === 'choice'
    ? shuffled(exercise.options.map((_, index) => index))
    : []);
  const [activeLeft, setActiveLeft] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const locked = result !== null;

  const [misses, setMisses] = useState(0);
  const shake = useShake(misses);
  const pop = usePop(result);
  const [shownAt] = useState(() => Date.now());
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [hint, setHint] = useState('');
  const [typo, setTypo] = useState<string | null>(null);
  const enter = usePop(exercise.prompt);
  const choiceAnswer = exercise.type === 'choice' ? exercise.options[exercise.answer] : '';
  const typing = hard && exercise.type === 'choice' && !exercise.audio && choiceAnswer.length <= 40;
  const typingAccept = exercise.type === 'choice' ? exercise.accept ?? [choiceAnswer] : [];
  const typeable = typing || exercise.type === 'type';
  const accents = courseId ? ACCENTS[courseId] ?? [] : [];
  const audible = !!exercise.audio && !!courseId && canSpeak(courseId);

  // Listening exercise: play the sentence as soon as it appears.
  useEffect(() => {
    if (!exercise.audio || !courseId || !canSpeak(courseId)) return;
    const timer = setTimeout(() => speak(exercise.audio!, courseId), 350);
    return () => clearTimeout(timer);
  }, [exercise.audio, courseId]);

  function isCorrect() {
    switch (exercise.type) {
      case 'choice':
        if (typing) return typedMatches(typingAccept);
        return choice === exercise.answer;
      case 'build':
        return normalizeAnswer(order.map((index) => tokens[index]).join(' ')) === normalizeAnswer(exercise.answer);
      case 'type':
        return typedMatches(exercise.accept);
      case 'match':
        return exercise.pairs.every(([, right], index) => exercise.pairs[matches[index]]?.[1] === right);
    }
  }

  function givenAnswer() {
    switch (exercise.type) {
      case 'choice':
        if (typing) return typed.trim();
        return choice === null ? '' : exercise.options[choice];
      case 'build':
        return order.map((index) => tokens[index]).join(' ');
      case 'type':
        return typed.trim();
      case 'match':
        return exercise.pairs.map(([left], index) =>
          left + ' → ' + (matches[index] === undefined ? '?' : exercise.pairs[matches[index]][1])).join(' · ');
    }
  }

  /** Exact match, or one small typo in a longer answer (counted right, with a spelling note). */
  function typedMatches(accept: string[]) {
    const given = normalizeAnswer(typed);
    if (accept.some((answer) => normalizeAnswer(answer) === given)) return true;
    const close = accept.find((answer) => {
      const target = normalizeAnswer(answer);
      return target.length >= 5 && typoDistance(target, given) <= 1;
    });
    if (close) { setTypo(close); return true; }
    return false;
  }

  function checkAnswer() {
    const correct = isCorrect();
    if (!correct) setMisses((count) => count + 1);
    setResult(correct);
    feedback(correct ? 'ok' : 'bad', correct ? combo : 0);
    onChecked?.(correct, Date.now() - shownAt);
    // A missed listening question is played again, slowly.
    if (!correct && exercise.audio && courseId && canSpeak(courseId)) setTimeout(() => speak(exercise.audio!, courseId, undefined, 0.6), 700);
  }

  function pick(index: number) {
    feedback('tap');
    setChoice(index);
  }

  function matchRight(right: number) {
    if (activeLeft === null) return;
    feedback('tap');
    setMatches((current) => {
      const next = { ...current };
      for (const index of Object.keys(next).map(Number)) {
        if (next[index] === right) delete next[index];
      }
      next[activeLeft] = right;
      return next;
    });
    setActiveLeft(null);
  }

  const ready = typing ? typed.trim().length > 0
    : exercise.type === 'choice' ? choice !== null
    : exercise.type === 'build' ? order.length > 0
    : exercise.type === 'type' ? typed.trim().length > 0
    : Object.keys(matches).length === exercise.pairs.length;

  /** 💡 50:50 for choices, the next word for sentence building, the first letters when typing. */
  function takeHint() {
    if (locked || !onHint) return;
    if (exercise.type === 'build') {
      const words = exercise.answer.split(/\s+/);
      let prefix = 0;
      while (prefix < order.length && tokens[order[prefix]] === words[prefix]) prefix++;
      if (prefix >= words.length) return;
      const kept = order.slice(0, prefix);
      const nextIndex = tokens.findIndex((word, index) => word === words[prefix] && !kept.includes(index));
      if (nextIndex < 0 || !onHint()) return;
      setOrder([...kept, nextIndex]);
    } else if (typing) {
      const target = typingAccept[0];
      const length = Math.min(target.length, Math.max(hint.length + 2, Math.ceil(target.length / 3)));
      if (length <= hint.length || !onHint()) return;
      setHint(target.slice(0, length));
      setTyped(target.slice(0, length));
    } else if (exercise.type === 'choice') {
      const wrong = exercise.options.map((_, index) => index).filter((index) => index !== exercise.answer && !hidden.has(index));
      const remove = Math.max(1, Math.floor(exercise.options.length / 2) - hidden.size);
      if (wrong.length <= 1 || !onHint()) return;
      const next = new Set(hidden);
      for (const index of wrong.sort((a, b) => (a * 7 + exercise.prompt.length) % 5 - (b * 7 + exercise.prompt.length) % 5).slice(0, remove)) next.add(index);
      if (choice !== null && next.has(choice)) setChoice(null);
      setHidden(next);
    } else return;
    feedback('unlock');
  }
  const hintAvailable = !locked && !!onHint && (exercise.type === 'build'
    || (typing && hint.length < typingAccept[0].length - 1)
    || (exercise.type === 'choice' && !typing && hidden.size === 0 && exercise.options.length >= 3));

  // Keyboard on computers: 1–9 picks an answer, Enter checks and goes on.
  const keys = useRef({ ready, locked, result, checkAnswer, pick, typingMode: typing, hint: () => { if (hintAvailable) takeHint(); }, visible: optionOrder.filter((index) => !hidden.has(index)), next: () => onContinue(!!result, givenAnswer()) });
  useEffect(() => {
    keys.current = { ready, locked, result, checkAnswer, pick, typingMode: typing, hint: () => { if (hintAvailable) takeHint(); }, visible: optionOrder.filter((index) => !hidden.has(index)), next: () => onContinue(!!result, givenAnswer()) };
  });
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      const k = keys.current;
      if (!typing && !k.locked && (event.key === 'h' || event.key === 'H')) { event.preventDefault(); k.hint(); return; }
      if (!typing && (event.key === 'r' || event.key === 'R') && exercise.audio && courseId) { event.preventDefault(); speak(exercise.audio, courseId); return; }
      if (event.key === 'Enter') {
        if (target?.tagName === 'TEXTAREA') return;
        if (k.result !== null) { event.preventDefault(); k.next(); }
        else if (k.ready) { event.preventDefault(); k.checkAnswer(); }
        return;
      }
      if (typing || k.locked || exercise.type !== 'choice' || k.typingMode) return;
      const n = Number(event.key);
      if (n >= 1 && n <= k.visible.length) { event.preventDefault(); k.pick(k.visible[n - 1]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exercise.type, exercise.audio, courseId, optionOrder]);

  return (
    <Animated.View style={[styles.content, enter]}>
      <AppText variant="heading">{promptText(exercise.prompt)}</AppText>
      {exercise.audio ? (
        audible ? (
          <View style={styles.listenRow}>
            <Button title="🔊" size="lg" accessibilityLabel={t('Play again')} onPress={() => speak(exercise.audio!, courseId!)} style={styles.listenButton} />
            <Button title="🐢" size="lg" variant="secondary" accessibilityLabel={t('Play slowly')} onPress={() => speak(exercise.audio!, courseId!, undefined, 0.6)} style={styles.listenButton} />
            {locked ? <AppText variant="bodyStrong" style={styles.flex}>{exercise.audio}</AppText> : null}
          </View>
        ) : <AppText variant="title">{exercise.audio}</AppText>
      ) : null}
      <Animated.View style={[styles.content, shake]}>
      {typing ? (
        <TextInput
          accessibilityLabel={t("Your answer")}
          placeholder={t('⌨️ Hard mode: type the answer')}
          placeholderTextColor={colors.textSecondary}
          value={typed}
          onChangeText={setTyped}
          editable={!locked}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={() => { if (result !== null) onContinue(!!result, givenAnswer()); else if (ready) checkAnswer(); }}
          style={[styles.input, locked && { borderColor: result ? colors.success : colors.danger, borderWidth: 2 }]}
        />
      ) : null}
      {typeable && !locked && accents.length ? (
        <View style={styles.accents} accessibilityLabel={t('Special characters')}>
          {accents.map((char) => (
            <Pressable key={char} onPress={() => { feedback('tap'); setTyped((value) => value + char); }} style={styles.accent} accessibilityRole="button">
              <AppText variant="bodyStrong">{char}</AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
      {exercise.type === 'choice' && !typing && optionOrder.filter((index) => !hidden.has(index)).map((index, position) => {
        const right = locked && index === exercise.answer;
        const wrong = locked && index === choice && !result;
        return (
          <Button key={index} title={(right ? '✓  ' : wrong ? '✗  ' : Platform.OS === 'web' ? `${position + 1}  ` : '') + exercise.options[index]}
            variant={wrong ? 'danger' : index === choice ? 'primary' : 'secondary'}
            accessibilityState={{ selected: index === choice, disabled: locked }}
            disabled={locked} onPress={() => pick(index)} style={[styles.option, right && styles.optionRight]} />
        );
      })}
      {exercise.type === 'type' && (
        <TextInput
          accessibilityLabel={t("Your answer")}
          placeholder={t("Type your answer")}
          placeholderTextColor={colors.textSecondary}
          value={typed}
          onChangeText={setTyped}
          editable={!locked}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => { if (result === null && ready) checkAnswer(); }}
          style={styles.input}
        />
      )}
      {exercise.type === 'build' && (
        <>
          <AppText color="textSecondary">{t("Tap the words in order. Tap a selected word to remove it.")}</AppText>
          <View style={styles.answer}>
            {order.map((index) => (
              <Button key={index} title={tokens[index]} variant="primary" size="sm" disabled={locked}
                onPress={() => { feedback('tap'); setOrder((current) => current.filter((item) => item !== index)); }} />
            ))}
          </View>
          <View style={styles.wrap}>
            {tokens.map((word, index) => (
              <Button key={index} title={word} variant="secondary" size="sm"
                disabled={locked || order.includes(index)}
                onPress={() => { feedback('tap'); setOrder((current) => current.includes(index) ? current : [...current, index]); }} />
            ))}
          </View>
        </>
      )}
      {exercise.type === 'match' && (
        <>
          <AppText color="textSecondary">{t("Select a phrase on the left, then its match on the right.")}</AppText>
          <View style={styles.columns}>
            <View style={styles.column}>
              {exercise.pairs.map(([left], index) => (
                <Button key={index} title={left}
                  variant={activeLeft === index ? 'primary' : 'secondary'} disabled={locked}
                  accessibilityState={{ selected: activeLeft === index, disabled: locked }}
                  onPress={() => { feedback('tap'); setActiveLeft(index); }} style={styles.option} />
              ))}
            </View>
            <View style={styles.column}>
              {rightOrder.map((index) => (
                <Button key={index} title={exercise.pairs[index][1]}
                  variant={Object.values(matches).includes(index) ? 'primary' : 'secondary'}
                  disabled={locked || activeLeft === null} onPress={() => matchRight(index)} style={styles.option} />
              ))}
            </View>
          </View>
          {Object.entries(matches).map(([left, right]) => (
            <AppText key={left} variant="caption">
              {exercise.pairs[Number(left)][0]} → {exercise.pairs[right][1]}
            </AppText>
          ))}
        </>
      )}
      </Animated.View>
      <View style={styles.footer}>
      {result === null ? (
        <View style={styles.checkRow}>
          {hintAvailable ? <Button title={t('💡 {n}', { n: HINT_PRICE })} variant="secondary" size="lg" accessibilityLabel={t('Hint for {n} gems', { n: HINT_PRICE })} onPress={takeHint} /> : null}
          <Button title={t("Check answer")} size="lg" disabled={!ready} onPress={checkAnswer} style={styles.flex} />
        </View>
      ) : (
        <>
          <Animated.View accessibilityLiveRegion="polite" style={[styles.feedback, {
            backgroundColor: result ? colors.successSoft : colors.dangerSoft,
            borderColor: result ? colors.success : colors.danger,
          }, pop]}>
            <View style={styles.feedbackRow}>
              <Medved mood={result ? 'cheer' : 'sad'} size={52} />
              <View style={styles.feedbackText}>
                <AppText variant="bodyStrong" color={result ? 'success' : 'danger'}>
                  {result ? t('🎉 Correct!') : t("Good try!")} <AppText variant="caption" color="textSecondary">{t((result ? CHEERS : COMFORT)[(exercise.prompt.length + misses) % (result ? CHEERS : COMFORT).length])}</AppText>
                </AppText>
                {!result && <AppText>{expectedAnswer(exercise)}</AppText>}
              </View>
            </View>
            {result && typo ? <AppText variant="callout">{t('✏️ Watch the spelling: {answer}', { answer: typo })}</AppText> : null}
            {exercise.explain ? <AppText>{exercise.explain}</AppText> : null}
            {!result && rule && rule !== exercise.explain ? (
              <View style={styles.ruleBox}>
                <AppText variant="small" color="primary" style={styles.ruleLabel}>{t('📖 The pattern')}</AppText>
                <AppText variant="callout">{rule}</AppText>
              </View>
            ) : null}
            {courseId ? <AnswerTools exercise={exercise} courseId={courseId} /> : null}
          </Animated.View>
          <Button title={isLast ? t("See results") : t("Continue")} size="lg" onPress={() => onContinue(result, givenAnswer())} />
        </>
      )}
      {Platform.OS === 'web' && exercise.type === 'choice' && !typing && result === null ? (
        <AppText variant="caption" color="textSecondary" align="center">{t('Keyboard: 1 to {n} to choose, Enter to check', { n: optionOrder.length })}</AppText>
      ) : null}
      </View>
    </Animated.View>
  );
}

/** Under the answer: listen, say it yourself, save the sentence for later. */
function AnswerTools({ exercise, courseId }: { exercise: ScoredExercise; courseId: string }) {
  const { styles } = useThemedStyles(createStyles);
  const game = useGame();
  const target = exercise.type === 'match' ? '' : expectedAnswer(exercise).split(' / ')[0];
  const spoken = exercise.type === 'build' || exercise.type === 'type';
  if (!target) return null;
  const saved = game.state.saved.some((item) => item.courseId === courseId && item.word === target);
  return (
    <View style={styles.tools}>
      <View style={styles.toolRow}>
        {spoken && canSpeak(courseId) ? <Button title={t('🔊 Listen')} size="sm" variant="secondary" onPress={() => speak(target, courseId)} /> : null}
        <Button title={saved ? t('★ Saved') : t('☆ Save')} size="sm" variant="secondary"
          accessibilityState={{ selected: saved }}
          onPress={() => { feedback('tap'); game.toggleSaved({ courseId, word: target, meaning: exercise.prompt.slice(0, 120), at: Date.now() }); }} />
      </View>
      {spoken ? <PronunciationCheck text={target} courseId={courseId} /> : null}
    </View>
  );
}

export function WritingExercise({ exercise, onContinue, isLast, draft, onDraft }: {
  exercise: Extract<Exercise, { type: 'writing' }>;
  draft: string;
  onDraft: (text: string) => void;
  onContinue: () => void;
  isLast: boolean;
}) {
  const { colors, styles } = useThemedStyles(createStyles);
  const [reviewing, setReviewing] = useState(false);

  return (
    <View style={styles.content}>
      <AppText variant="heading">{exercise.prompt}</AppText>
      <AppText color="textSecondary">{t("Write in the target language. Compare your draft with a model answer and check the points below. Your writing is for practice and has no automatic grade.")}</AppText>
      <TextInput
        accessibilityLabel={t("Your draft")}
        placeholder={t("Write your response")}
        placeholderTextColor={colors.textSecondary}
        multiline
        maxLength={1500}
        value={draft}
        onChangeText={onDraft}
        style={[styles.input, styles.draft]}
      />
      {reviewing ? (
        <>
          <View style={styles.feedback}>
            <AppText variant="bodyStrong">{t("Model answer")}</AppText>
            <AppText>{exercise.model}</AppText>
            <AppText variant="bodyStrong">{t("Check your draft")}</AppText>
            {exercise.checklist.map((item) => <AppText key={item}>• {item}</AppText>)}
          </View>
          <Button title={isLast ? t("See results") : t("Continue")} onPress={onContinue} />
        </>
      ) : (
        <Button title={t("Compare with model answer")} disabled={!draft.trim()} onPress={() => setReviewing(true)} />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { gap: spacing.md },
  option: { height: 'auto', minHeight: 46, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
  optionRight: { borderColor: colors.success, backgroundColor: colors.successSoft, opacity: 1 },
  accents: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  accent: { minWidth: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderBottomWidth: 3, borderColor: colors.border, backgroundColor: colors.surface },
  ruleBox: { gap: 2, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface },
  ruleLabel: { fontWeight: '800' },
  checkRow: { flexDirection: 'row', gap: spacing.sm },
  listenRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  listenButton: { minWidth: 64 },
  flex: { flex: 1 },
  input: {
    ...typography.body, color: colors.text, backgroundColor: colors.surface,
    padding: spacing.md, borderRadius: radius.md, borderColor: colors.border, borderWidth: 1,
  },
  draft: { minHeight: 125, textAlignVertical: 'top' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  answer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, backgroundColor: colors.surfaceMuted,
    minHeight: 52, borderRadius: radius.md, padding: spacing.sm },
  columns: { flexDirection: 'row', gap: spacing.sm },
  column: { flex: 1, gap: spacing.sm },
  // On phones the check/continue button stays pinned to the bottom of the screen.
  footer: Platform.OS === 'web'
    ? { position: 'sticky' as 'relative', bottom: 0, zIndex: 2, gap: spacing.sm, paddingVertical: spacing.sm, backgroundColor: colors.background }
    : { gap: spacing.sm },
  feedback: { borderRadius: radius.xl, padding: spacing.md, gap: spacing.xs, borderWidth: 2, borderColor: colors.borderSubtle },
  tools: { gap: spacing.xs, marginTop: spacing.xs },
  toolRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  feedbackText: { flex: 1, gap: 2 },
});
