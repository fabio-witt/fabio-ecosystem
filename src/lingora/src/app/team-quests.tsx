import { useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Button, Card, EmptyState, LoadingState, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useChats } from '@/features/chats/api';
import { celebrate } from '@/features/game/celebrations';
import { useGame } from '@/features/game/store';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const GOAL = 300;
const REWARD = 50;

function weekId(date = new Date()) {
  const monday = new Date(date); monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return `${monday.getFullYear()}-${monday.getMonth() + 1}-${monday.getDate()}`;
}

/** Team quests: you and a chat partner both collect 300 XP this week. */
export default function TeamQuestsScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const chats = useChats();
  const game = useGame();
  const partners = (chats.data ?? []).slice(0, 12);
  const weeks = useQueries({
    queries: partners.map((chat) => ({
      queryKey: ['friend-week', chat.partnerId],
      queryFn: async () => {
        const { data, error } = await supabase.rpc('friend_week', { p_partner: chat.partnerId });
        if (error) throw error;
        return data?.[0] ?? { my_xp: 0, partner_xp: 0 };
      },
    })),
  });
  const week = weekId();
  const finished = partners.find((chat, index) => {
    const data = weeks[index]?.data;
    return data && data.my_xp >= GOAL && data.partner_xp >= GOAL && !(game.state.challenges ?? []).includes(`${week}:team:${chat.partnerId}`);
  });
  useEffect(() => {
    if (!finished) return;
    game.completeChallenge(`${week}:team:${finished.partnerId}`, REWARD);
    feedback('win');
    celebrate({ icon: '🤝', title: t('Team quest done!'), message: t('You and {name} did it · +{n} gems', { name: finished.name, n: REWARD }) });
  }, [finished, game, week]);

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Team quests')} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText color="textSecondary">{t('Each week: you and a chat partner both reach {goal} XP. Then you each get {n} gems. Learning together keeps you going.', { goal: GOAL, n: REWARD })}</AppText>
        {chats.isPending ? <LoadingState /> : partners.length === 0 ? (
          <EmptyState title={t('No partners yet')} message={t('Start a chat with a language partner to unlock team quests.')} />
        ) : partners.map((chat, index) => {
          const data = weeks[index]?.data;
          const mine = Math.min(100, ((data?.my_xp ?? 0) / GOAL) * 100);
          const theirs = Math.min(100, ((data?.partner_xp ?? 0) / GOAL) * 100);
          const done = (game.state.challenges ?? []).includes(`${week}:team:${chat.partnerId}`);
          return (
            <Card key={chat.id} style={styles.card}>
              <View style={styles.row}>
                <Avatar name={chat.name} uri={chat.avatar_url} size={36} />
                <AppText variant="bodyStrong" style={styles.flex}>{chat.name}</AppText>
                {done ? <AppText color="success" style={styles.bold}>{t('✓ Done')}</AppText>
                  : <Button title={t('Nudge')} size="sm" variant="secondary" onPress={() => router.push({ pathname: '/chat/[id]', params: { id: chat.id } })} />}
              </View>
              {([[t('You'), mine, data?.my_xp ?? 0], [chat.name, theirs, data?.partner_xp ?? 0]] as const).map(([label, percent, xp]) => (
                <View key={label} style={styles.line}>
                  <AppText variant="caption" style={styles.label} numberOfLines={1}>{label}</AppText>
                  <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(percent, 3)}%`, backgroundColor: percent >= 100 ? colors.success : '#F2B705' }]} /></View>
                  <AppText variant="caption" color="textSecondary">{xp}/{GOAL}</AppText>
                </View>
              ))}
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  bold: { fontWeight: '800' },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { width: 80 },
  track: { flex: 1, height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
});
