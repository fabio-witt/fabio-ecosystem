import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform, ScrollView, Share, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { Flag } from '@/components/flag';
import { showHint } from '@/components/hint';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { celebrate } from '@/features/game/celebrations';
import {
  DAILY_REWARDS, SEASON_TIERS, XP_PER_TIER, currentSeason, dailyChestState, dayKeyOf, divisionFor, isGemWeekend,
  journeyStops, levelFromXp, levelTitle, seasonXp, tierReward, weekKey, weekTotals,
} from '@/features/game/progression';
import { useGame } from '@/features/game/store';
import { useActiveCourse } from '@/features/learn/active-course';
import { entriesForUnit, levelForUnit } from '@/features/learn/catalog';
import { learnKeys, useLearnProgress, useLearnSummary } from '@/features/learn/progress';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

const FREEZE_PRICE = 50;
// Each unit card gets its own picture.
const CARD_ICONS = ['🏛', '🍝', '🚲', '🎨', '🏞', '🎵', '🧭', '🍰', '🌉', '📜', '🎪', '🌋', '🛶', '🏰', '🎻', '🪁', '🗺', '🎭', '🌅', '🧩', '🏮', '🚂', '🌻', '⛵'];
const WEEKLY_CHEST = 60;

/** All rewards in one place: level, chests, division, season pass, records, journey and album. */
export default function RewardsScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const game = useGame();
  const { user } = useSession();
  const client = useQueryClient();
  const summary = useLearnSummary().data;
  const scores = useLearnProgress().data ?? {};
  const { course } = useActiveCourse();
  const level = levelFromXp(summary?.total_xp ?? 0);
  const chest = dailyChestState(game.state.dailyChest?.last, game.state.dailyChest?.run ?? 0);
  const week = weekTotals(game.state.days);
  const division = divisionFor(week.xp);
  const season = currentSeason();
  const sXp = seasonXp(game.state.days, season.start, season.end);
  const tiersReached = Math.min(SEASON_TIERS, Math.floor(sXp / XP_PER_TIER));
  const claims = game.state.claims ?? [];
  const weekId = `week:${weekKey()}`;
  const records = game.state.records;

  // Level-up celebration (once per level).
  const seen = game.state.levelSeen ?? 1;
  useEffect(() => {
    if (!summary || level.level <= seen) return;
    celebrate({ icon: '⬆️', title: t('Level {n}!', { n: level.level }), message: t(levelTitle(level.level)) });
    feedback('levelup');
    game.markLevelSeen(level.level);
  }, [summary, level.level, seen, game]);

  const freeze = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('buy_streak_freeze');
      if (error) throw error;
    },
    onSuccess: () => {
      game.addGems(-FREEZE_PRICE);
      feedback('unlock');
      celebrate({ icon: '🧊', title: t('Streak freeze ready'), message: t('A missed day will not break your streak.') });
      void client.invalidateQueries({ queryKey: learnKeys.summary(user?.id ?? '') });
    },
  });

  async function shareRecap() {
    const text = t('My week on Lingora: {xp} XP, {days} active days, {streak}-day streak 🔥 – {division} division. Learn with me!', {
      xp: week.xp, days: week.active, streak: summary?.streak ?? 0, division: t(division.name),
    });
    feedback('tap');
    if (Platform.OS !== 'web') { await Share.share({ message: text }); return; }
    const nav = navigator as Navigator & { share?: (data: { text: string }) => Promise<void> };
    try { if (nav.share) { await nav.share({ text }); return; } } catch { /* fall back to copying */ }
    await Clipboard.setStringAsync(text);
    showHint('📋', t('Copied'), t('Paste it into a story or chat.'));
  }

  // Streak calendar: the last 8 weeks.
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 7 * 7);
  const calendar = Array.from({ length: 56 }, (_, i) => {
    const day = new Date(start); day.setDate(start.getDate() + i);
    const log = game.state.days[dayKeyOf(day)];
    return { key: dayKeyOf(day), future: day > today, xp: log?.xp ?? 0 };
  });

  // Journey and album for the active course.
  const units = course ? course.units.map((unit, index) => ({ unit, index, level: levelForUnit(course, index), entries: entriesForUnit(unit) })) : [];
  const stops = journeyStops.map((stop) => {
    const entries = units.filter((item) => item.level === stop.level).flatMap((item) => item.entries);
    const done = entries.filter((entry) => scores[entry.id] !== undefined).length;
    return { ...stop, total: entries.length, done };
  }).filter((stop) => stop.total > 0);
  const cards = units.map((item) => ({ ...item, unlocked: item.entries.length > 0 && item.entries.every((entry) => scores[entry.id] !== undefined) }));

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Rewards')} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Level */}
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.levelBadge}><AppText style={styles.levelNumber}>{level.level}</AppText></View>
            <View style={styles.flex}>
              <AppText variant="heading">{t('Level {n} · {title}', { n: level.level, title: t(levelTitle(level.level)) })}</AppText>
              <AppText variant="caption" color="textSecondary">{t('{n} XP to level {next}', { n: level.span - level.into, next: level.level + 1 })}</AppText>
            </View>
          </View>
          <Bar value={level.progress} color="#6554C4" />
        </Card>

        {isGemWeekend() ? (
          <Card style={[styles.card, styles.banner]}>
            <AppText variant="bodyStrong">{t('💎 Gem weekend: double gems for every lesson!')}</AppText>
          </Card>
        ) : null}

        {/* Daily chest */}
        <Card style={styles.card}>
          <AppText variant="heading">{t('🎁 Daily chest')}</AppText>
          <View style={styles.week}>
            {DAILY_REWARDS.map((gems, i) => {
              const day = i + 1;
              const done = chest.claimedToday ? day <= chest.day : day < chest.day;
              const now = !chest.claimedToday && day === chest.day;
              return (
                <View key={day} style={[styles.dayTile, done && styles.dayDone, now && styles.dayNow]}>
                  <AppText variant="small" style={styles.bold}>{t('Day {n}', { n: day })}</AppText>
                  <AppText style={styles.dayIcon}>{done ? '✓' : day === 7 ? '🏆' : '🎁'}</AppText>
                  <AppText variant="small">{gems}💎</AppText>
                </View>
              );
            })}
          </View>
          <Button title={chest.claimedToday ? t('Come back tomorrow') : t('Open chest: +{n} 💎', { n: chest.reward * (game.isPlus ? 2 : 1) })}
            disabled={chest.claimedToday} onPress={() => { feedback('chest'); game.claimDailyChest(); }} />
          <AppText variant="caption" color="textSecondary">{t('Open it every day – day 7 pays the most. Missing a day starts again at day 1.')}</AppText>
        </Card>

        {/* Weekly chest + division */}
        <Card style={styles.card}>
          <View style={styles.row}>
            <AppText style={styles.bigIcon}>{division.icon}</AppText>
            <View style={styles.flex}>
              <AppText variant="heading">{t('{name} division', { name: t(division.name) })}</AppText>
              <AppText variant="caption" color="textSecondary">
                {division.next ? t('{n} XP more this week for {next}', { n: division.toNext, next: t(division.next.name) }) : t('Top division – amazing!')}
              </AppText>
            </View>
          </View>
          <Bar value={division.next ? (week.xp - division.min) / (division.next.min - division.min) : 1} color="#F2B705" />
          <View style={styles.row}>
            <AppText style={styles.flex}>{t('📅 Weekly chest: learn on 5 days ({n}/5)', { n: Math.min(week.active, 5) })}</AppText>
            <Button title={claims.includes(weekId) ? t('✓ Opened') : `+${WEEKLY_CHEST * (game.isPlus ? 2 : 1)} 💎`} size="sm"
              disabled={week.active < 5 || claims.includes(weekId)}
              onPress={() => { feedback('chest'); game.claimReward(weekId, WEEKLY_CHEST * (game.isPlus ? 2 : 1), '📅', t('Weekly chest')); }} />
          </View>
          <Button title={t('📣 Share my week')} variant="ghost" size="sm" onPress={() => void shareRecap()} />
        </Card>

        {/* Season pass */}
        <Card style={styles.card}>
          <View style={styles.row}>
            <AppText variant="heading" style={styles.flex}>{t('🎟️ Season {n}', { n: season.number })}</AppText>
            <AppText variant="caption" color="textSecondary">{t('{n} days left', { n: season.daysLeft })}</AppText>
          </View>
          <AppText variant="caption" color="textSecondary">
            {t('{xp} XP this season · every {per} XP unlocks a tier.', { xp: sXp, per: XP_PER_TIER })} {game.isPlus ? t('Plus: double rewards.') : t('With Plus every reward is doubled.')}
          </AppText>
          <View style={styles.tiers}>
            {Array.from({ length: SEASON_TIERS }, (_, i) => {
              const tier = i + 1;
              const id = `${season.id}:${tier}`;
              const claimed = claims.includes(id);
              const reached = tier <= tiersReached;
              const gems = tierReward(tier, game.isPlus);
              return (
                <Button key={tier} size="sm" variant={claimed ? 'secondary' : reached ? 'primary' : 'ghost'}
                  title={claimed ? `✓ ${tier}` : reached ? `${tier} · +${gems}💎` : `🔒 ${tier}`}
                  disabled={!reached || claimed}
                  onPress={() => { feedback('chest'); game.claimReward(id, gems, tier % 5 === 0 ? '🏆' : '🎟️', t('Season tier {n}', { n: tier })); }} />
              );
            })}
          </View>
        </Card>

        {/* Streak freeze + calendar */}
        <Card style={styles.card}>
          <View style={styles.row}>
            <AppText style={styles.bigIcon}>🧊</AppText>
            <View style={styles.flex}>
              <AppText variant="heading">{t('Streak freeze')}</AppText>
              <AppText variant="caption" color="textSecondary">{t('You hold {n}/2. One freeze saves your streak if you miss a day.', { n: summary?.streak_freezes ?? 0 })}</AppText>
            </View>
          </View>
          <Button title={t('Buy for {n} 💎', { n: FREEZE_PRICE })} variant="secondary"
            disabled={freeze.isPending || game.state.gems < FREEZE_PRICE || (summary?.streak_freezes ?? 0) >= 2}
            onPress={() => freeze.mutate()} />
          {freeze.isError ? <AppText color="danger">{freeze.error.message}</AppText> : null}
          <AppText variant="bodyStrong">{t('🔥 Your last 8 weeks')}</AppText>
          <View style={styles.calendar}>
            {calendar.map((day) => (
              <View key={day.key} accessibilityLabel={`${day.key}: ${day.xp} XP`}
                style={[styles.cell, { backgroundColor: day.future ? 'transparent' : day.xp >= 50 ? '#E8590C' : day.xp >= 20 ? '#F59F00' : day.xp > 0 ? '#FFD8A8' : colors.surfaceMuted }]} />
            ))}
          </View>
        </Card>

        {/* Records */}
        <Card style={styles.card}>
          <AppText variant="heading">{t('🏅 Personal records')}</AppText>
          {([
            ['🔥', t('Longest streak'), `${summary?.longest_streak ?? 0}`],
            ['⚡', t('Most XP in one day'), `${records.bestDayXp}`],
            ['🎯', t('Longest combo'), `${records.bestCombo}`],
            ['💯', t('Perfect lessons in a row'), `${records.bestPerfectRun}`],
          ] as const).map(([icon, label, value]) => (
            <View key={label} style={styles.row}>
              <AppText style={styles.flex}>{icon} {label}</AppText>
              <AppText variant="bodyStrong">{value}</AppText>
            </View>
          ))}
        </Card>

        {/* Journey */}
        {course && stops.length ? (
          <Card style={styles.card}>
            <View style={styles.row}>
              <Flag emoji={course.flag} size={24} />
              <AppText variant="heading" style={styles.flex}>{t("Fabio's journey")}</AppText>
            </View>
            {stops.map((stop) => {
              const complete = stop.done === stop.total;
              return (
                <View key={stop.level} style={styles.stop}>
                  <View style={[styles.stopDot, complete && styles.stopDone]}><AppText>{complete ? '✓' : stop.icon}</AppText></View>
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">{stop.level} · {t(stop.title)}</AppText>
                    <AppText variant="caption" color="textSecondary">{t(stop.text)} · {stop.done}/{stop.total}</AppText>
                    <Bar value={stop.done / stop.total} color={complete ? colors.success : '#6554C4'} />
                  </View>
                </View>
              );
            })}
          </Card>
        ) : null}

        {/* Album */}
        {course ? (
          <Card style={styles.card}>
            <AppText variant="heading">{t('🃏 Collection album')}</AppText>
            <AppText variant="caption" color="textSecondary">{t('Finish every lesson of a unit to collect its card. {n} of {total} collected.', { n: cards.filter((card) => card.unlocked).length, total: cards.length })}</AppText>
            <View style={styles.album}>
              {cards.map((card) => (
                <View key={card.index} style={[styles.albumCard, card.unlocked ? styles.albumOpen : styles.albumLocked]}>
                  <AppText style={styles.albumIcon}>{card.unlocked ? CARD_ICONS[card.index % CARD_ICONS.length] : '❔'}</AppText>
                  <AppText variant="small" numberOfLines={2} align="center" style={styles.bold}>{card.unlocked ? card.unit.title : card.level}</AppText>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        <Button title={t('🏆 All badges')} variant="secondary" onPress={() => router.push('/stats')} />
      </ScrollView>
    </Screen>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  const { styles } = useThemedStyles(createStyles);
  return <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(3, Math.min(100, value * 100))}%`, backgroundColor: color }]} /></View>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  card: { gap: spacing.sm },
  banner: { backgroundColor: '#FFF4D6', borderColor: '#F2B705' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  bold: { fontWeight: '800' },
  bigIcon: { fontSize: 32, lineHeight: 38 },
  levelBadge: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#6554C4', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#F2B705' },
  levelNumber: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  track: { height: 10, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
  week: { flexDirection: 'row', gap: 4 },
  dayTile: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 6, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  dayDone: { backgroundColor: colors.successSoft },
  dayNow: { backgroundColor: '#FFF4D6', borderWidth: 2, borderColor: '#F2B705' },
  dayIcon: { fontSize: 18, lineHeight: 22 },
  tiers: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  calendar: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: '12.4%', aspectRatio: 1, borderRadius: 4 },
  stop: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  stopDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  stopDone: { backgroundColor: colors.successSoft },
  album: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  albumCard: { width: '31.5%', minHeight: 86, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', padding: 6, gap: 4 },
  albumOpen: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
  albumLocked: { backgroundColor: colors.surfaceMuted },
  albumIcon: { fontSize: 26, lineHeight: 32 },
});
