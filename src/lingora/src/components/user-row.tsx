import { t } from '@/lib/i18n';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, PressableCard } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { displayNameOf, type UserSummary } from '@/features/users/api';

/** List row with avatar and name that opens the user's profile. */
export function UserRow({ user }: { user: UserSummary }) {
  const name = displayNameOf(user);

  return (
    <PressableCard
      style={styles.row}
      onPress={() => router.push({ pathname: '/user/[id]', params: { id: user.id } })}
      accessibilityLabel={t('Open profile of {name}', { name: name })}
    >
      <Avatar name={name} uri={user.avatar_url} size={48} />
      <View style={styles.text}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="small" color="textMuted" numberOfLines={1}>
          {user.username ? `@${user.username}` : ''}
          {user.country ? `${user.username ? ' · ' : ''}${user.country}` : ''}
        </AppText>
      </View>
      <AppText variant="title" color="textMuted">
        ›
      </AppText>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  text: {
    flex: 1,
  },
});
