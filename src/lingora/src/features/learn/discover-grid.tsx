import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, PressableCard } from '@/components/ui';
import { spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { t } from '@/lib/i18n';

const ITEMS: [string, string, string, Href][] = [
  ['🚋', 'A day in Zurich', 'Play a branching adventure', '/zurich-adventure'],
  ['✍️', 'Language studio', 'Practise for tomorrow', '/language-studio'],
  ['🇨🇭', 'Swiss everyday missions', 'Practise real-life situations', '/swiss-missions'],
  ['🛠️', 'My mistake workshop', 'Learn from lessons and chat corrections', '/mistake-workshop'],
  ['🎁', 'Rewards', 'Chests, season pass, records', '/rewards'],
  ['🧠', 'Memory', 'Match words and meanings', '/memory'],
  ['🎯', 'Placement test', 'Find your level in 10 minutes', '/placement'],
  ['⭐', 'Word bank', 'Your saved words and sentences', '/word-bank'],
  ['📄', 'Cheat sheets', 'All rules of a level on one page', '/cheatsheet'],
  ['📊', 'Weekly report', 'Progress and weak spots', '/report'],
  ['🤖', 'AI conversation', 'Role-play real situations', '/ai-partner'],
  ['🗣', 'Forum', 'Ask native speakers', '/forum'],
  ['🎥', 'Live rooms', 'Small video groups by level', '/meetups'],
  ['🤝', 'Team quests', 'Reach your goal with a partner', '/team-quests'],
  ['🏫', 'Classes', 'For teachers, schools, families', '/classes'],
  ['🎁', 'Invite friends', 'A week of Plus for both', '/invite'],
];

/** Quick access to the learning and community tools. */
export function DiscoverGrid() {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <AppText variant="heading">{t('Discover more')}</AppText>
      <View style={styles.grid}>
        {ITEMS.map(([icon, title, sub, href]) => (
          <PressableCard key={title} style={styles.card} onPress={() => router.push(href)} accessibilityLabel={t(title)}>
            <AppText style={styles.icon} accessible={false}>{icon}</AppText>
            <AppText variant="bodyStrong" numberOfLines={1}>{t(title)}</AppText>
            <AppText variant="caption" color="textSecondary" numberOfLines={2}>{t(sub)}</AppText>
          </PressableCard>
        ))}
      </View>
    </View>
  );
}

const createStyles = (_colors: ThemeColors) => StyleSheet.create({
  wrap: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { flexBasis: '47%', flexGrow: 1, gap: 2, minHeight: 104 },
  icon: { fontSize: 24, lineHeight: 30 },
});
