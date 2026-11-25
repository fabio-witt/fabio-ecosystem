import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Medved } from '@/components/medved';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useGame } from '@/features/game/store';
import { useActiveCourse } from '@/features/learn/active-course';
import type { Course } from '@/features/learn/catalog';
import { vocabularyFor } from '@/features/vocabulary/catalog';
import { useNow } from '@/hooks/use-now';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';
import { canSpeak, speak } from '@/lib/speech';

const PAIRS = 6;
type Tile = { id: number; pair: number; text: string; side: 'word' | 'meaning' };

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

/** Six word pairs from the course, shuffled into twelve face-down tiles. */
function deal(course: Course): Tile[] {
  const catalog = vocabularyFor(course);
  const seen = new Set<string>();
  const words = shuffle([...catalog.categories.flatMap((topic) => topic.words), ...catalog.frequency.words.slice(0, 400)]
    .filter(([word, meaning]) => meaning && meaning !== word && word.length <= 18 && meaning.length <= 22))
    .filter(([word, meaning]) => {
      const key = `${word.toLowerCase()}|${meaning!.toLowerCase()}`;
      if (seen.has(word.toLowerCase()) || seen.has(meaning!.toLowerCase()) || seen.has(key)) return false;
      seen.add(word.toLowerCase()); seen.add(meaning!.toLowerCase()); seen.add(key);
      return true;
    })
    .slice(0, PAIRS);
  return shuffle(words.flatMap(([word, meaning], pair) => [
    { id: pair * 2, pair, text: word, side: 'word' as const },
    { id: pair * 2 + 1, pair, text: meaning!, side: 'meaning' as const },
  ]));
}

/** Memory: find the word and its meaning. Fast games earn a record and gems. */
export default function MemoryScreen() {
  const { styles } = useThemedStyles(createStyles);
  const { course } = useActiveCourse();
  const game = useGame();
  const now = useNow(1000);
  const [tiles, setTiles] = useState<Tile[]>(() => (course ? deal(course) : []));
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [seconds, setSeconds] = useState<number | null>(null);
  const done = tiles.length > 0 && found.size === tiles.length / 2;


  function flip(tile: Tile) {
    if (!course || done || open.length === 2 || open.includes(tile.id) || found.has(tile.pair)) return;
    if (!startedAt) setStartedAt(now);
    feedback('flip');
    if (tile.side === 'word' && canSpeak(course.id)) speak(tile.text, course.id);
    const next = [...open, tile.id];
    setOpen(next);
    if (next.length < 2) return;
    setMoves((count) => count + 1);
    const [a, b] = next.map((id) => tiles.find((item) => item.id === id)!);
    if (a.pair === b.pair) {
      const nextFound = new Set(found).add(a.pair);
      setTimeout(() => {
        setFound(nextFound);
        setOpen([]);
        if (nextFound.size === tiles.length / 2) {
          const time = Math.max(1, Math.round((Date.now() - (startedAt || Date.now())) / 1000));
          setSeconds(time);
          feedback('win');
          game.recordMemory(time);
        } else feedback('ok', nextFound.size);
      }, 250);
    } else {
      setTimeout(() => { feedback('bad'); setOpen([]); }, 850);
    }
  }

  function restart() {
    if (!course) return;
    setTiles(deal(course));
    setOpen([]); setFound(new Set()); setMoves(0); setStartedAt(0); setSeconds(null);
    feedback('whoosh');
  }

  if (!course) {
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <ScreenHeader title={t('Memory')} />
        <View style={styles.content}><AppText>{t('Choose a course first.')}</AppText><Button title={t('Open Learn')} onPress={() => router.replace('/learn')} /></View>
      </Screen>
    );
  }
  const elapsed = seconds ?? (startedAt ? Math.round((now - startedAt) / 1000) : 0);
  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={`${course.flag} ${t('Memory')}`} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText color="textSecondary">{t('Find each word and its meaning. Words are read aloud when you flip them.')}</AppText>
        <View style={styles.stats}>
          <AppText variant="bodyStrong">⏱ {Math.max(0, elapsed)} s</AppText>
          <AppText variant="bodyStrong">🔁 {t('{n} moves', { n: moves })}</AppText>
          <AppText variant="bodyStrong">✅ {found.size}/{tiles.length / 2}</AppText>
          {game.state.memoryBest ? <AppText variant="bodyStrong">🏅 {game.state.memoryBest} s</AppText> : null}
        </View>
        <View style={styles.grid}>
          {tiles.map((tile) => {
            const shown = open.includes(tile.id) || found.has(tile.pair);
            const matched = found.has(tile.pair);
            return (
              <Pressable key={tile.id} onPress={() => flip(tile)} accessibilityRole="button"
                accessibilityLabel={shown ? tile.text : t('Hidden card')}
                style={({ pressed }) => [styles.tile, shown && styles.tileOpen, matched && styles.tileFound, tile.side === 'word' && shown && styles.tileWord, pressed && styles.pressed]}>
                <AppText variant={shown ? 'bodyStrong' : 'title'} align="center" numberOfLines={3} style={shown ? undefined : styles.back}>
                  {shown ? tile.text : '?'}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        {tiles.length === 0 ? <Button title={t('Start')} size="lg" fullWidth onPress={restart} /> : null}
        {done ? (
          <Card style={styles.result}>
            <Medved mood="cheer" size={90} />
            <AppText variant="title" align="center">{t('All pairs found!')}</AppText>
            <AppText align="center" color="textSecondary">{t('{s} seconds · {n} moves · +5 💎', { s: seconds ?? elapsed, n: moves })}</AppText>
            <Button title={t('Play again')} size="lg" fullWidth onPress={restart} />
          </Card>
        ) : tiles.length > 0 ? (
          <Button title={t('New cards')} variant="ghost" onPress={restart} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: screenPadding, gap: spacing.md, paddingBottom: spacing.xxxl },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  tile: {
    width: '31%', minHeight: 92, alignItems: 'center', justifyContent: 'center', padding: spacing.sm,
    borderRadius: radius.lg, borderWidth: 2, borderBottomWidth: 5, borderColor: '#352B8A', backgroundColor: '#4B3FB8',
  },
  tileOpen: { backgroundColor: colors.surface, borderColor: colors.border },
  tileWord: { borderColor: colors.primary },
  tileFound: { backgroundColor: colors.successSoft, borderColor: colors.success },
  pressed: { transform: [{ translateY: 2 }] },
  back: { color: '#FFFFFF' },
  result: { alignItems: 'center', gap: spacing.sm },
});
