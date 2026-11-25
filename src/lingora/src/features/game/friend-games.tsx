import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { courseForLanguage } from '@/features/learn/next-lesson';
import { courses } from '@/features/learn/catalog';
import { useMyProfile } from '@/features/profile/api';
import { t } from '@/lib/i18n';

import { useSharedStreak } from './social';

/** The course a duel uses: the challenger's first learning language. */
export function useDuelCourse() {
  const languages = useMyProfile().data?.languages ?? [];
  const learning = languages.filter((language) => language.type === 'learning');
  return learning.map((language) => courseForLanguage(language.name)).find(Boolean) ?? courses[0];
}

/** Shared streak and duel challenge on another person's profile. */
export function FriendGames({ userId, name }: { userId: string; name: string }) {
  const { styles } = useThemedStyles(createStyles);
  const streak = useSharedStreak(userId).data ?? 0;
  const course = useDuelCourse();
  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <AppText style={styles.icon} accessible={false}>{streak > 0 ? '🔥' : '🤝'}</AppText>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">
            {streak > 0 ? t('{n}-day streak together', { n: streak }) : t('Learn together')}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {streak > 0
              ? t('You and {name} both learned on these days. Keep it going!', { name })
              : t('Follow each other and both finish a lesson every day to build a shared streak.')}
          </AppText>
        </View>
      </View>
      <Button
        title={t('⚔️ Challenge to a duel')}
        variant="secondary"
        fullWidth
        onPress={() => router.push({ pathname: '/duel', params: { opponent: userId, name, course: course.id } })}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  box: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.primarySoft },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { fontSize: 30, lineHeight: 36 },
  flex: { flex: 1, gap: 2 },
});
