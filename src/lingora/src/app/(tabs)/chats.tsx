import { useTabReselect } from '@/hooks/use-tab-reselect';
import {
  AppText,
  Avatar,
  EmptyState,
  ErrorState,
  LoadingState,
  PressableCard,
  Screen,
} from '@/components/ui';
import { radius, screenPadding, spacing, typography, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { chatKeys, useChats } from '@/features/chats/api';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { t } from '@/lib/i18n';
import { useIsGuest } from '@/features/guest/guest';
import { GuestGate } from '@/features/guest/guest-gate';

function ChatsScreenContent() {
  const { colors, styles } = useThemedStyles(createStyles);
  const [search, setSearch] = useState('');
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  useTabReselect('chats', () => {
    setSearch('');
    scroll.current?.scrollTo({ y: 0, animated: true });
  });
  const chatsQuery = useChats();
  useRefreshOnFocus(chatKeys.all);

  const chats = chatsQuery.data ?? [];

  function formatTime(dateString: string) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return '';

    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return 'Yesterday';

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });
  }

  const filteredChats = chats.filter((chat) => {
    const query = search.toLowerCase();

    return (
      chat.name.toLowerCase().includes(query) ||
      chat.username.toLowerCase().includes(query) ||
      chat.country.toLowerCase().includes(query)
    );
  });

  if (chatsQuery.isPending) {
    return (
      <Screen>
        <LoadingState message={t("Loading your conversations...")} />
      </Screen>
    );
  }

  if (chatsQuery.isError) {
    return (
      <Screen>
        <ErrorState
          title={t("Could not load your chats")}
          message={chatsQuery.error.message}
          onRetry={() => chatsQuery.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText variant="display" style={styles.title}>
              {t("Messages")}
            </AppText>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
            onPress={() => router.push({ pathname: '/community', params: { section: 'partners' } })}
            accessibilityRole="button"
            accessibilityLabel={t("Find a new language partner")}
          >
            <AppText variant="title" color="onPrimary">
              ＋
            </AppText>
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <AppText variant="heading" color="textMuted">
            ⌕
          </AppText>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("Search conversations...")}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            accessibilityLabel={t("Search conversations")}
          />
        </View>

        <View style={styles.sectionHeader}>
          <AppText variant="heading">{t("Recent conversations")}</AppText>

          <View style={styles.countBadge}>
            <AppText variant="small" color="primary" style={styles.countText}>
              {filteredChats.length}
            </AppText>
          </View>

          <Pressable
            style={styles.refreshButton}
            onPress={() => chatsQuery.refetch()}
            disabled={chatsQuery.isFetching}
            accessibilityRole="button"
            accessibilityLabel={t("Refresh conversations")}
          >
            <AppText variant="title" color="primary">
              ↻
            </AppText>
          </Pressable>
        </View>

        {filteredChats.map((chat) => (
          <PressableCard
            key={chat.id}
            style={styles.chatCard}
            onPress={() =>
              router.push({
                pathname: '/chat/[id]',
                params: { id: chat.id },
              })
            }
            accessibilityLabel={t('Open chat with {name}', { name: chat.name })}
          >
            <Avatar name={chat.name} uri={chat.avatar_url} size={52} />

            <View style={styles.chatContent}>
              <View style={styles.nameRow}>
                <AppText variant="bodyStrong" numberOfLines={1} style={styles.name}>
                  {chat.name}
                </AppText>
                <AppText variant="small" color="textMuted">
                  {formatTime(chat.lastMessageTime)}
                </AppText>
              </View>

              <AppText variant="small" color="textMuted" numberOfLines={1}>
                @{chat.username}
                {chat.country ? ` · ${chat.country}` : ''}
              </AppText>

              <AppText
                variant="caption"
                color={chat.unreadCount > 0 ? 'text' : 'textSecondary'}
                numberOfLines={1}
                style={[styles.lastMessage, chat.unreadCount > 0 && styles.unreadText]}
              >
                {chat.lastMessageMine ? t("You: ") : ''}{chat.lastMessage}
              </AppText>
            </View>

            {chat.unreadCount > 0 ? (
              <View style={styles.unreadBadge} accessibilityLabel={t('{n} unread messages', { n: chat.unreadCount })}>
                <AppText variant="small" color="onPrimary" style={styles.countText}>
                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                </AppText>
              </View>
            ) : (
              <AppText variant="title" color="textMuted">
                ›
              </AppText>
            )}
          </PressableCard>
        ))}

        {filteredChats.length === 0 &&
          (search ? (
            <EmptyState
              title={t("No conversations found")}
              message={t("Try another search.")}
            />
          ) : (
            <EmptyState
              title={t("No conversations yet")}
              message={t("Discover language partners and start your first conversation!")}
              actionLabel={t("Discover people →")}
              onAction={() => router.push({ pathname: '/community', params: { section: 'partners' } })}
            />
          ))}
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    marginTop: spacing.xs,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: colors.actionPressed,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 52,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    ...typography.callout,
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  countBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  countText: {
    fontWeight: '700',
  },
  refreshButton: {
    marginLeft: 'auto',
    paddingHorizontal: spacing.sm,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  chatContent: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
  },
  lastMessage: {
    marginTop: spacing.xs,
  },
  unreadText: {
    fontWeight: '700',
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.action,
  },
});

export default function ChatsScreen() {
  const guest = useIsGuest();
  if (guest) return <GuestGate title={t('Chats need a free account')} message={t('Write with language partners and get your messages corrected.')} />;
  return <ChatsScreenContent />;
}
