import { router } from 'expo-router';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

import { MedvedSays } from '@/components/medved';
import {
  AppText, Button, EmptyState, ErrorState, LoadingState, PressableCard, Screen, ScreenHeader,
} from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { useClubs, useJoinClub, type Club } from '@/features/clubs/api';
import { t } from '@/lib/i18n';

export default function ClubsScreen() {
  const clubs = useClubs();
  const mine = (clubs.data ?? []).filter((club) => club.isMember);
  const others = (clubs.data ?? []).filter((club) => !club.isMember);

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader
        title={t("Language clubs")}
        right={<Button title={t("＋ New")} size="sm" variant="secondary" onPress={() => router.push('/clubs/create')} />}
      />
      {clubs.isPending ? (
        <LoadingState />
      ) : clubs.isError ? (
        <ErrorState message={clubs.error.message} onRetry={() => clubs.refetch()} />
      ) : (
        <FlatList
          data={[...mine, ...others]}
          keyExtractor={(club) => club.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.header}>
              <MedvedSays size={64} message={t("Clubs are small groups to practise one language together.")} />
              {mine.length > 0 ? <AppText variant="heading">{t("Your clubs")}</AppText> : null}
            </View>
          }
          renderItem={({ item, index }) => (
            <>
              {index === mine.length && others.length > 0 ? (
                <AppText variant="heading" style={styles.section}>{t("Discover clubs")}</AppText>
              ) : null}
              <ClubCard club={item} />
            </>
          )}
          ListEmptyComponent={<EmptyState title={t("No clubs yet")} message={t("Create the first one!")} />}
        />
      )}
    </Screen>
  );
}

function ClubCard({ club }: { club: Club }) {
  const join = useJoinClub();
  return (
    <PressableCard
      style={styles.card}
      onPress={() => router.push({ pathname: '/clubs/[id]', params: { id: club.id } })}
      accessibilityLabel={t('Open {name}', { name: club.name })}
    >
      <AppText style={styles.emoji} accessible={false}>{club.emoji}</AppText>
      <View style={styles.flex}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {club.name}{club.is_official ? ' ✓' : ''}
        </AppText>
        <AppText variant="caption" color="textSecondary" numberOfLines={2}>{club.description}</AppText>
        <AppText variant="small" color="textMuted">
          {t('{n} members', { n: club.member_count })}
          {club.language ? ` · ${club.language.flag_emoji ?? ''} ${club.language.name}` : ''}
        </AppText>
      </View>
      {!club.isMember ? (
        <Button
          title={t("Join")}
          size="sm"
          loading={join.isPending}
          onPress={() => join.mutate({ clubId: club.id, join: true }, {
            onError: (error) => Alert.alert(t("Could not join"), error.message),
          })}
        />
      ) : null}
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.sm },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  section: { marginTop: spacing.lg, marginBottom: spacing.xs },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emoji: { fontSize: 32, lineHeight: 40 },
});
