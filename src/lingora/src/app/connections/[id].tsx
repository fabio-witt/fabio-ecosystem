import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { UserRow } from '@/components/user-row';
import {
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useConnections, type ConnectionType } from '@/features/users/api';
import { t } from '@/lib/i18n';

const TABS: { type: ConnectionType; label: string }[] = [
  { type: 'followers', label: 'Followers' },
  { type: 'following', label: 'Following' },
];

export default function ConnectionsScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{ id: string; type?: string; name?: string }>();
  const type: ConnectionType = params.type === 'following' ? 'following' : 'followers';
  const connectionsQuery = useConnections(params.id, type);

  function switchTab(next: ConnectionType) {
    if (next !== type) router.setParams({ type: next });
  }

  return (
    <Screen>
      <ScreenHeader title={params.name ?? 'Connections'} />

      <View style={styles.tabs} accessibilityRole="tablist">
        {TABS.map((tab) => {
          const active = tab.type === type;
          return (
            <Pressable
              key={tab.type}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => switchTab(tab.type)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <AppText variant="caption" color={active ? 'primary' : 'textSecondary'} style={styles.tabText}>
                {t(tab.label)}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {connectionsQuery.isPending ? (
        <LoadingState />
      ) : connectionsQuery.isError ? (
        <ErrorState
          message={connectionsQuery.error.message}
          onRetry={() => connectionsQuery.refetch()}
        />
      ) : (
        <FlatList
          data={connectionsQuery.data}
          keyExtractor={(user) => user.id}
          renderItem={({ item }) => <UserRow user={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={connectionsQuery.isRefetching}
              onRefresh={() => {
                connectionsQuery.refetch();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              emoji={type === 'followers' ? '👋' : '🔭'}
              title={type === 'followers' ? t("No followers yet") : t("Not following anyone yet")}
              message={
                type === 'followers'
                  ? t("When people follow this profile, they will show up here.")
                  : t("People this profile follows will show up here.")
              }
            />
          }
        />
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    marginHorizontal: screenPadding,
    marginBottom: spacing.md,
    padding: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    fontWeight: '700',
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: screenPadding,
    paddingBottom: spacing.xxxl,
  },
});
