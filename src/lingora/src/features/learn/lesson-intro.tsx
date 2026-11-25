/**
 * The teaching part of a lesson, before the exercises: short "learn cards"
 * that explain the rule step by step, like a good teacher would.
 *
 * 1. The rule and its pattern
 * 2. Examples – hear them, then reveal the meaning (active recall)
 * 3. The table and more details
 * 4. Fabio's tip and the words of this unit
 * 5. A quick check: one question to see if the rule clicked
 *
 * Also: the segmented lesson progress bar and the daily-limit card.
 */
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Medved } from '@/components/medved';
import { AppText, Button, Card } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useGame } from '@/features/game/store';
import { FREE_DAILY_LESSONS, GEM_UNLOCK_PRICE, MAX_GEM_UNLOCKS } from '@/features/plus/limits';
import type { Word } from '@/features/vocabulary/catalog';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';
import { canSpeak, speak, useVoicesReady } from '@/lib/speech';

import type { Lesson } from './catalog';
import { PronunciationCheck } from './pronunciation';

type Page = 'rule' | 'examples' | 'table' | 'tip' | 'check';

function seedOf(text: string) {
  let seed = 0;
  for (let index = 0; index < text.length; index++) seed = (seed * 31 + text.charCodeAt(index)) | 0;
  return Math.abs(seed);
}

/** "Which sentence means …?" from the lesson's own examples. */
function quickCheck(lesson: Lesson) {
  const examples = lesson.examples.filter((example): example is [string, string] => !!example[1] && example[1] !== example[0]);
  const unique = examples.filter(([text], index) => examples.findIndex(([other]) => other === text) === index);
  if (unique.length < 2) return null;
  const pick = unique[seedOf(lesson.id) % unique.length];
  const options = unique.slice(0, 3).some(([text]) => text === pick[0]) ? unique.slice(0, 3) : [pick, ...unique.slice(0, 2)];
  const order = options.map(([text]) => text).sort((a, b) => seedOf(a + lesson.id) - seedOf(b + lesson.id));
  return { meaning: pick[1], answer: pick[0], options: order };
}

export function LearnCards({ lesson, courseId, words, footer }: {
  lesson: Lesson;
  courseId: string;
  /** A few words of this unit's word station. */
  words?: Word[];
  /** Start button or the daily-limit card, shown on the last card. */
  footer: ReactNode;
}) {
  useVoicesReady();
  const { styles } = useThemedStyles(createStyles);
  const check = quickCheck(lesson);
  const pages: Page[] = [
    'rule',
    ...(lesson.examples.length ? ['examples' as const] : []),
    ...(lesson.table || lesson.more ? ['table' as const] : []),
    ...(lesson.tip || words?.length ? ['tip' as const] : []),
    ...(check ? ['check' as const] : []),
  ];
  const [index, setIndex] = useState(0);
  const page = pages[index];
  const last = index === pages.length - 1;

  function go(next: number) {
    feedback('flip');
    setIndex(Math.max(0, Math.min(pages.length - 1, next)));
  }

  return (
    <View style={styles.cards}>
      <View style={styles.dotsRow}>
        <View style={styles.dots} accessibilityLabel={t('Step {n} of {total}', { n: index + 1, total: pages.length })}>
          {pages.map((item, position) => (
            <Pressable key={item} onPress={() => go(position)} accessibilityRole="button" accessibilityLabel={t('Step {n}', { n: position + 1 })}
              style={[styles.dot, position === index && styles.dotActive, position < index && styles.dotDone]} />
          ))}
        </View>
        {!last ? <AppText variant="small" color="primary" onPress={() => go(pages.length - 1)} accessibilityRole="button">{t('Skip to practice ›')}</AppText> : null}
      </View>

      {page === 'rule' ? (
        <Card style={styles.card}>
          <View style={styles.teacher}>
            <Medved mood="happy" size={64} />
            <View style={styles.bubble}>
              <AppText variant="caption" color="textSecondary">{t('Today you learn')}</AppText>
              <AppText variant="heading">{lesson.title}</AppText>
            </View>
          </View>
          <AppText variant="label" color="primary">{t('1 · The rule')}</AppText>
          <AppText style={styles.ruleText}>{lesson.rule}</AppText>
          {lesson.structure ? (
            <View style={styles.pattern}>
              <AppText variant="label" color="primary">{t('Pattern')}</AppText>
              <AppText style={styles.patternText}>{lesson.structure}</AppText>
            </View>
          ) : null}
        </Card>
      ) : page === 'examples' ? (
        <ExamplesCard lesson={lesson} courseId={courseId} />
      ) : page === 'table' ? (
        <Card style={styles.card}>
          <AppText variant="label" color="primary">{t('Overview')}</AppText>
          {lesson.table ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.table}>
                {[lesson.table.head, ...lesson.table.rows].map((row, rowIndex) => (
                  <View key={rowIndex} style={[styles.tableRow, rowIndex === 0 && styles.tableHead]}>
                    {row.map((cell, cellIndex) => (
                      <AppText key={cellIndex} style={styles.cell} variant={rowIndex === 0 ? 'bodyStrong' : 'body'}>{cell}</AppText>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : null}
          {lesson.more ? <AppText>{lesson.more}</AppText> : null}
        </Card>
      ) : page === 'tip' ? (
        <Card style={styles.card}>
          {lesson.tip ? (
            <View style={styles.tip}>
              <AppText style={styles.tipIcon}>💡</AppText>
              <View style={styles.flex}>
                <AppText variant="label" color="primary">{t('Fabio’s tip')}</AppText>
                <AppText>{lesson.tip}</AppText>
              </View>
            </View>
          ) : null}
          {words?.length ? <UnitWords words={words} courseId={courseId} /> : null}
        </Card>
      ) : check ? (
        <QuickCheck key={lesson.id} {...check} courseId={courseId} />
      ) : null}

      {last ? footer : (
        <View style={styles.nav}>
          {index > 0 ? <Button title={t('‹ Back')} variant="secondary" onPress={() => go(index - 1)} style={styles.navBack} /> : null}
          <Button title={t('Next ›')} size="lg" onPress={() => go(index + 1)} style={styles.flex} />
        </View>
      )}
    </View>
  );
}

/** Words of the rule's pattern ("me / te / le + gusta") to highlight in the examples. */
function patternWords(lesson: Lesson) {
  const sources = [lesson.structure, ...(lesson.table?.rows.flat() ?? [])].join(' ');
  return new Set(sources.toLowerCase().split(/[^\p{L}']+/u).filter((word) => word.length > 1));
}

function ExamplesCard({ lesson, courseId }: { lesson: Lesson; courseId: string }) {
  const { styles } = useThemedStyles(createStyles);
  const game = useGame();
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [speaking, setSpeaking] = useState<number | null>(null);
  const audio = canSpeak(courseId);
  const pattern = patternWords(lesson);
  const hidden = lesson.examples.some(([, meaning], index) => meaning && !revealed.has(index));
  return (
    <Card style={styles.card}>
      <AppText variant="label" color="primary">{t('2 · Examples')}</AppText>
      <AppText variant="caption" color="textSecondary">
        {audio ? t('Listen, guess the meaning, then tap to check. Highlighted words show the rule; tap a word to hear it.')
          : t('Read each sentence, guess the meaning, then tap to check. Highlighted words show the rule.')}
      </AppText>
      {lesson.examples.map(([example, meaning], index) => {
        const saved = game.state.saved.some((item) => item.courseId === courseId && item.word === example);
        return (
          <View key={index} style={styles.example}>
            {audio ? (
              <Pressable onPress={() => speak(example, courseId)} accessibilityRole="button" accessibilityLabel={t('Listen')} style={styles.speaker}>
                <AppText>🔊</AppText>
              </Pressable>
            ) : null}
            <View style={styles.flex}>
              <View style={styles.sentence}>
                {example.split(/(\s+)/).map((part, position) => {
                  if (!part.trim()) return <AppText key={position}> </AppText>;
                  const bare = part.toLowerCase().replace(/^[^\p{L}]+|[^\p{L}']+$/gu, '');
                  const key = pattern.has(bare);
                  return (
                    <AppText key={position} variant="bodyStrong" style={key ? styles.patternWord : undefined}
                      onPress={audio ? () => speak(part.replace(/[.,!?;:¿¡"“”«»]/g, ''), courseId, undefined, 0.75) : undefined}>
                      {part}
                    </AppText>
                  );
                })}
              </View>
              {meaning ? (revealed.has(index)
                ? <AppText color="textSecondary">{meaning}</AppText>
                : <AppText variant="small" color="primary" accessibilityRole="button"
                    onPress={() => { feedback('flip'); setRevealed((current) => new Set(current).add(index)); }}>
                    {t('Tap to see the meaning')}
                  </AppText>) : null}
              <View style={styles.exampleTools}>
                {audio ? <AppText variant="small" color="primary" accessibilityRole="button" onPress={() => setSpeaking(speaking === index ? null : index)}>
                  {t('🎤 Say it')}</AppText> : null}
                <AppText variant="small" color="primary" accessibilityRole="button"
                  onPress={() => { feedback('tap'); game.toggleSaved({ courseId, word: example, meaning, at: Date.now() }); }}>
                  {saved ? t('★ Saved') : t('☆ Save')}
                </AppText>
              </View>
              {speaking === index ? <PronunciationCheck text={example} courseId={courseId} /> : null}
            </View>
          </View>
        );
      })}
      {audio ? <Button title={t('▶ Play all')} size="sm" variant="secondary"
        onPress={() => lesson.examples.forEach(([example], index) => setTimeout(() => speak(example, courseId), index * 2600))} /> : null}
      {hidden ? <Button title={t('Show all meanings')} size="sm" variant="ghost"
        onPress={() => setRevealed(new Set(lesson.examples.map((_, index) => index)))} /> : null}
    </Card>
  );
}

function UnitWords({ words, courseId }: { words: Word[]; courseId: string }) {
  const { styles } = useThemedStyles(createStyles);
  const audio = canSpeak(courseId);
  return (
    <View style={styles.words}>
      <AppText variant="label" color="primary">{t('Words for this unit')}</AppText>
      <AppText variant="caption" color="textSecondary">{t('They come up in the word station on your path.')}</AppText>
      <View style={styles.wordGrid}>
        {words.map(([word, meaning]) => (
          <Pressable key={word} disabled={!audio} onPress={() => speak(word, courseId)} accessibilityRole={audio ? 'button' : undefined}
            style={({ pressed }) => [styles.word, pressed && styles.wordPressed]}>
            <AppText variant="bodyStrong" numberOfLines={1}>{audio ? '🔊 ' : ''}{word}</AppText>
            {meaning ? <AppText variant="small" color="textSecondary" numberOfLines={1}>{meaning}</AppText> : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function QuickCheck({ meaning, answer, options, courseId }: { meaning: string; answer: string; options: string[]; courseId: string }) {
  const { styles } = useThemedStyles(createStyles);
  const [picked, setPicked] = useState<string | null>(null);
  const right = picked === answer;
  return (
    <Card style={styles.card}>
      <AppText variant="label" color="primary">{t('Quick check')}</AppText>
      <AppText variant="heading">{t('Which sentence means “{meaning}”?', { meaning })}</AppText>
      {options.map((option) => {
        const isAnswer = picked !== null && option === answer;
        const isWrong = picked === option && !right;
        return (
          <Button key={option} title={(isAnswer ? '✓  ' : isWrong ? '✗  ' : '') + option} disabled={picked !== null}
            variant={isWrong ? 'danger' : picked === option ? 'primary' : 'secondary'}
            style={[styles.option, isAnswer && styles.optionRight]}
            onPress={() => {
              setPicked(option);
              feedback(option === answer ? 'ok' : 'bad');
              if (option === answer && canSpeak(courseId)) speak(answer, courseId);
            }} />
        );
      })}
      {picked !== null ? (
        <View style={styles.teacher}>
          <Medved mood={right ? 'cheer' : 'happy'} size={52} />
          <AppText variant="bodyStrong" color={right ? 'success' : 'text'} style={styles.flex}>
            {right ? t('You got it! Now let’s practise.') : t('Almost! Look at the pattern once more – the exercises will help.')}
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}

/** One segment per exercise: green right, red wrong, purple current. */
export function LessonProgress({ results, current, total }: { results: (boolean | null)[]; current: number; total: number }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.progress} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: results.length }}>
      {Array.from({ length: total }, (_, index) => {
        const result = results[index];
        return (
          <View key={index} style={[styles.segment,
            result === true && styles.segmentRight,
            result === false && styles.segmentWrong,
            result === null && index < results.length && styles.segmentDone,
            index === current && styles.segmentCurrent]} />
        );
      })}
    </View>
  );
}

/** Shown instead of "Start practice" when today's free lessons are used up. */
export function DailyLimitCard({ canBuy }: { canBuy: boolean }) {
  const { styles } = useThemedStyles(createStyles);
  const game = useGame();
  const [message, setMessage] = useState<string | null>(null);
  const affordable = game.state.gems >= GEM_UNLOCK_PRICE;
  return (
    <View style={styles.limit}>
      <Medved mood="happy" size={88} />
      <AppText variant="heading" align="center">{t('You used today’s {n} free lessons', { n: FREE_DAILY_LESSONS })}</AppText>
      <AppText align="center" color="textSecondary">
        {t('Great work! Unlock every level with Plus, use gems for one more lesson, or come back tomorrow. Repeating lessons and reviews stay free.')}
      </AppText>
      <Button title={t('🚀 Learn without limits – try Plus')} size="lg" fullWidth onPress={() => router.push('/plus')} />
      {canBuy ? (
        <Button title={t('💎 One more lesson for {n} gems', { n: GEM_UNLOCK_PRICE })} variant="secondary" fullWidth disabled={!affordable}
          onPress={() => {
            if (game.buyLessonWithGems()) { feedback('unlock'); setMessage(t('Unlocked! Have fun.')); }
          }} />
      ) : (
        <AppText variant="caption" color="textSecondary" align="center">{t('You can unlock up to {n} extra lessons per day with gems.', { n: MAX_GEM_UNLOCKS })}</AppText>
      )}
      {canBuy && !affordable ? <AppText variant="caption" color="textSecondary" align="center">{t('You have {n} 💎. Earn more in reviews, word stations and chests.', { n: game.state.gems })}</AppText> : null}
      {message ? <AppText color="success" variant="bodyStrong">{message}</AppText> : null}
      <Button title={t('🔁 Review mistakes for free')} variant="ghost" onPress={() => router.push('/practice-review')} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  cards: { gap: spacing.md },
  card: { gap: spacing.md, padding: spacing.lg },
  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  dots: { flexDirection: 'row', gap: 6, flex: 1 },
  dot: { flex: 1, maxWidth: 48, height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceMuted },
  dotActive: { backgroundColor: '#8E7CF8' },
  dotDone: { backgroundColor: colors.success },
  teacher: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bubble: { flex: 1, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted, gap: 2 },
  ruleText: { fontSize: 18, lineHeight: 27 },
  pattern: { gap: 4, padding: spacing.md, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed', backgroundColor: colors.primarySoft },
  patternText: { fontSize: 17, lineHeight: 25, fontWeight: '800', color: colors.text },
  example: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  sentence: { flexDirection: 'row', flexWrap: 'wrap' },
  patternWord: { color: '#8E7CF8', textDecorationLine: 'underline' },
  exampleTools: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  speaker: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  table: { borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.borderSubtle },
  tableHead: { backgroundColor: colors.primarySoft },
  cell: { width: 132, padding: spacing.sm },
  tip: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted },
  tipIcon: { fontSize: 28, lineHeight: 34 },
  words: { gap: spacing.xs },
  wordGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  word: { width: '48%', padding: spacing.sm, borderRadius: radius.md, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.borderSubtle, backgroundColor: colors.surface },
  wordPressed: { transform: [{ translateY: 2 }], borderColor: colors.primary },
  option: { height: 'auto', minHeight: 46, paddingVertical: spacing.sm },
  optionRight: { borderColor: colors.success, backgroundColor: colors.successSoft, opacity: 1 },
  nav: { flexDirection: 'row', gap: spacing.sm },
  navBack: { minWidth: 96 },
  progress: { flexDirection: 'row', gap: 4, flex: 1 },
  segment: { flex: 1, height: 10, borderRadius: radius.full, backgroundColor: colors.surfaceMuted },
  segmentRight: { backgroundColor: colors.success },
  segmentWrong: { backgroundColor: colors.danger },
  segmentDone: { backgroundColor: colors.border },
  segmentCurrent: { backgroundColor: '#8E7CF8', transform: [{ scaleY: 1.3 }] },
  limit: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderRadius: radius.xl, borderWidth: 2, borderColor: '#8E7CF8', backgroundColor: colors.primarySoft },
});
