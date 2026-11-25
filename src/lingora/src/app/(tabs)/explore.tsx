import { useLanguages } from '@/features/community/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useDeferredValue, useRef, useState, type ComponentRef } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { MedvedSays } from '@/components/medved';
import {
  AppText, Avatar, Button, EmptyState, ErrorState, LoadingState, PressableCard, Screen, Select,
} from '@/components/ui';
import { radius, screenPadding, spacing, typography, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useStartConversation } from '@/features/chats/api';
import { usePartnerSearch, type Partner, type PartnerLanguage } from '@/features/partners/api';
import { usePlusTiers, type PlusTier } from '@/features/plus/api';
import { PlusBadge } from '@/features/plus/plus-badge';
import { cefrLevels } from '@/features/learn/catalog';
import { exchangeFields } from '@/features/profile/exchange-details';
import { useMyProfile, type ProfileLanguage } from '@/features/profile/api';
import { useTabReselect } from '@/hooks/use-tab-reselect';
import { formatLocation } from '@/lib/format';
import { t } from '@/lib/i18n';
import { useIsGuest } from '@/features/guest/guest';
import { GuestGate } from '@/features/guest/guest-gate';
import { track } from '@/lib/insights';

function DiscoverScreenContent() {
  const { colors, styles } = useThemedStyles(createStyles);
  const [query, setQuery] = useState('');
  const { languageId: languageParam, task } = useLocalSearchParams<{ languageId?: string; task?: string }>();
  const german = useLanguages().data?.find(language => language.language_code === 'de')?.id;
  const requestedLanguage = Number(languageParam);
  const languageId = Number.isSafeInteger(requestedLanguage) && requestedLanguage > 0 ? requestedLanguage : languageParam === undefined && (task?.startsWith('swiss-') || task?.startsWith('zurich-')) ? german ?? null : null;
  const setLanguageId = (id: number | null) => router.setParams({ languageId: id === null ? '' : String(id) });
  const [nearMe, setNearMe] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [level, setLevel] = useState<string>();
  const [practice, setPractice] = useState<string>();
  const [availability, setAvailability] = useState<string>();
  const activeFilters = [level, practice, availability].filter(Boolean);
  const list = useRef<ComponentRef<typeof FlatList<Partner>>>(null);

  const myProfile = useMyProfile().data;
  const learning = (myProfile?.languages ?? []).filter((language) => language.type === 'learning');
  const myCountry = myProfile?.profile?.country ?? null;

  const deferredQuery = useDeferredValue(query);
  const search = usePartnerSearch({
    languageId,
    country: nearMe ? myCountry : null,
    query: deferredQuery, level, practice, availability,
  });
  const partners = search.data?.pages.flat() ?? [];
  const plus = usePlusTiers(partners.map((partner) => partner.id));

  function clearFilters() {
    setQuery('');
    setLanguageId(null);
    setNearMe(false);
    setLevel(undefined);
    setPractice(undefined);
    setAvailability(undefined);
  }

  useTabReselect('explore', () => {
    clearFilters();
    setShowFilters(false);
    list.current?.scrollToOffset({ offset: 0, animated: true });
  });

  const header = (
    <View style={styles.header}>
      <AppText variant="label" color="primary">{t("Language partners")}</AppText>
      <AppText variant="display" accessibilityRole="header">{t("Discover")}</AppText>
      <MedvedSays size={64} message={t("I sort people by how well you can help each other learn.")} />
      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder={t("Search by name")}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={t("Search language partners by name")}
        clearButtonMode="while-editing"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label={t("✨ Best match")} selected={languageId === null} onPress={() => setLanguageId(null)} />
        {learning.map((language) => (
          <Chip
            key={language.languageId}
            label={`${language.flagEmoji ?? '🌐'} ${t(language.name)}`}
            selected={languageId === language.languageId}
            onPress={() => setLanguageId(language.languageId)}
          />
        ))}
        {myCountry ? (
          <Chip label={`📍 ${myCountry}`} selected={nearMe} onPress={() => setNearMe(!nearMe)} />
        ) : null}
      </ScrollView>
      <View style={styles.filters}>
        <Button title={showFilters ? t("Hide filters") : `Filters${activeFilters.length ? ` (${activeFilters.length})` : ''}`}
          variant="secondary" onPress={() => setShowFilters(!showFilters)} accessibilityState={{ expanded: showFilters }} />
        {activeFilters.length > 0 && <AppText color="textSecondary">{activeFilters.join(' · ')}</AppText>}
        {showFilters && (
          <>
            <Select label={t("Their level in your language")} options={cefrLevels} value={level ? [level] : []}
              onChange={([value]) => setLevel(value)} placeholder={t("Any level")} />
            <Select label={t("Preferred practice")} options={exchangeFields.find((field) => field.key === 'practice_preference')!.options}
              value={practice ? [practice] : []} onChange={([value]) => setPractice(value)} placeholder={t("Any format")} />
            <Select label={t("Availability")} options={exchangeFields.find((field) => field.key === 'availability')!.options}
              value={availability ? [availability] : []} onChange={([value]) => setAvailability(value)} placeholder={t("Any time")} />
            <Button title={t("Clear filters")} variant="ghost" onPress={clearFilters} />
          </>
        )}
      </View>
      {learning.length === 0 && myProfile ? (
        <PressableCard onPress={() => router.push('/edit-profile')}>
          <AppText variant="bodyStrong">{t("Add the languages you learn")}</AppText>
          <AppText variant="caption" color="textSecondary">
            {t("Then we can show native speakers who want to learn your language.")}
          </AppText>
        </PressableCard>
      ) : null}
    </View>
  );

  return (
    <Screen>
      <FlatList
        ref={list}
        data={partners}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        renderItem={({ item }) => <PartnerCard partner={item} task={task} tier={plus.data?.get(item.id)} ownLanguages={myProfile?.languages ?? []} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (search.hasNextPage && !search.isFetchingNextPage) void search.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={search.isRefetching && !search.isFetchingNextPage}
            onRefresh={() => {
              void search.refetch();
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          search.isPending ? (
            <LoadingState />
          ) : search.isError ? (
            <ErrorState message={search.error.message} onRetry={() => search.refetch()} />
          ) : (
            <EmptyState
              title={t("No partners found")}
              message={t("Try another language or clear your search.")}
              actionLabel={t("Clear filters")} onAction={clearFilters}
            />
          )
        }
        ListFooterComponent={search.isFetchingNextPage ? <LoadingState /> : undefined}
      />
    </Screen>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <AppText variant="caption" color={selected ? 'primary' : 'textSecondary'} style={styles.chipLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

function languageLine(languages: PartnerLanguage[]) {
  return languages.map((language) => `${language.flag ?? '🌐'} ${t(language.name)}`).join('  ');
}

function PartnerCard({ partner, tier, ownLanguages, task }: { partner: Partner; task?: string; tier?: PlusTier; ownLanguages: ProfileLanguage[] }) {
  const speaks = partner.native_languages.find((language) => ownLanguages.some((own) =>
    own.type === 'learning' && own.languageId === language.id));
  const learns = partner.learning_languages.find((language) => ownLanguages.some((own) =>
    own.type === 'native' && own.languageId === language.id));
  const { styles } = useThemedStyles(createStyles);
  const startConversation = useStartConversation();
  const name = partner.full_name || partner.username || 'Lingora user';
  const location = formatLocation(partner.city, partner.country);

  function openProfile() {
    router.push({ pathname: '/user/[id]', params: { id: partner.id } });
  }

  function message() {
    startConversation.mutate(partner.id, {
      onSuccess: (conversationId) => { track('partner_message_started'); router.push({ pathname: '/chat/[id]', params: { id: conversationId, ...(task ? { task } : {}) } }); },
      onError: (error) => Alert.alert(t("Could not start the chat"), error.message),
    });
  }

  return (
    <PressableCard style={styles.card} onPress={openProfile} accessibilityLabel={t('Open profile of {name}', { name: name })}>
      <View style={styles.cardTop}>
        <View>
          <Avatar name={name} uri={partner.avatar_url} size={56} />
          {partner.active_recently ? <View style={styles.activeDot} accessibilityLabel={t("Active this week")} /> : null}
        </View>
        <View style={styles.flex}>
          <View style={styles.nameRow}>
            <AppText variant="bodyStrong" numberOfLines={1} style={styles.shrink}>{name}</AppText>
            <PlusBadge tier={tier} />
          </View>
          {location ? <AppText variant="caption" color="textSecondary" numberOfLines={1}>{location}</AppText> : null}
          <AppText variant="caption" color="textSecondary">
            {partner.review_total > 0 && partner.review_average !== null
              ? `⭐ ${Number(partner.review_average).toFixed(1)} · ${t('{n} reviews', { n: partner.review_total })}`
              : t("No reviews yet")}
          </AppText>
        </View>
        <View style={styles.match} accessibilityLabel={t('{n} percent match', { n: partner.match_score })}>
          <AppText variant="heading" color="primary">{partner.match_score}%</AppText>
          <AppText variant="label" color="textSecondary">{t('match')}</AppText>
        </View>
      </View>

      {speaks || learns ? (
        // Why this person is suggested: reciprocal exchanges are the best matches.
        <View style={[styles.reason, speaks && learns && styles.reasonStrong]}>
          <AppText variant="caption" style={styles.reasonText}>
            {speaks && learns
              ? t('🤝 Perfect exchange: speaks {native}, which you learn, and learns {learning}, which you speak.', { native: t(speaks.name), learning: t(learns.name) })
              : speaks
                ? t('💬 Speaks {language}, the language you learn.', { language: t(speaks.name) })
                : t('🎓 Learns {language}. You can help as a native speaker.', { language: t(learns!.name) })}
          </AppText>
        </View>
      ) : null}
      {partner.native_languages.length > 0 ? (
        <AppText variant="caption" numberOfLines={1}>
          <AppText variant="caption" color="textSecondary">{t("Speaks")} </AppText>
          {languageLine(partner.native_languages)}
        </AppText>
      ) : null}
      {partner.learning_languages.length > 0 ? (
        <AppText variant="caption" numberOfLines={1}>
          <AppText variant="caption" color="textSecondary">{t("Learns")} </AppText>
          {languageLine(partner.learning_languages)}
        </AppText>
      ) : null}
      {partner.bio ? <AppText variant="callout" color="textSecondary" numberOfLines={2}>{partner.bio}</AppText> : null}

      <View style={styles.actions}>
        <Button title={t("View profile")} variant="secondary" size="sm" style={styles.flex} onPress={openProfile} />
        <Button title={t("Say hi 👋")} size="sm" style={styles.flex} loading={startConversation.isPending} onPress={message} />
      </View>
    </PressableCard>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  reason: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  reasonStrong: { backgroundColor: colors.primarySoft },
  reasonText: { fontWeight: '700' },
  filters: { gap: spacing.sm },
  content: { paddingHorizontal: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  header: { gap: spacing.md, paddingTop: spacing.md },
  search: {
    ...typography.body,
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  chips: { gap: spacing.sm },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipLabel: { fontWeight: '700' },
  card: { gap: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  activeDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.success,
  },
  match: { alignItems: 'center', minWidth: 56 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  shrink: { flexShrink: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});

export default function DiscoverScreen() {
  const guest = useIsGuest();
  if (guest) return <GuestGate title={t('Find partners with a free account')} message={t('Meet people who speak the language you learn and want to learn yours.')} />;
  return <DiscoverScreenContent />;
}
