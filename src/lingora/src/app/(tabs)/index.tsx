import { SocialShortcuts } from '@/features/learn/social-shortcuts';
import { Flag } from '@/components/flag';
import { HintStat } from '@/components/hint';
import { MedvedSays } from '@/components/medved';
import { useCorrectionCards } from '@/features/learn/correction-review';
import { activityDuration, courseForLanguage, nextLesson, type LessonDraft } from '@/features/learn/next-lesson';
import { activityLabel, findLesson } from '@/features/learn/catalog';
import { useDeviceState } from '@/lib/device-state';
import { useLearnProgress, useLearnSummary } from '@/features/learn/progress';
import { useTabReselect } from '@/hooks/use-tab-reselect';
import { useRef, type ComponentRef } from 'react';
import { Redirect, router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  ErrorState,
  LoadingState,
  PressableCard,
  Screen,
} from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { profileKeys, useMyProfile, type ProfileLanguage } from '@/features/profile/api';
import { hasSkippedOnboarding } from '@/features/onboarding/storage';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useSession } from '@/providers/session-provider';
import { getUiLanguage, t } from '@/lib/i18n';
import { medvedPhrases } from '@/features/learn/medved-phrases';
import { QuestsCard } from '@/features/game/quests-card';
import { ChallengesCard } from '@/features/game/challenges-card';
import { RewardsCard } from '@/features/game/rewards-card';
import { DailyCards } from '@/features/game/daily-cards';
import { DiscoverGrid } from '@/features/learn/discover-grid';
import { LeagueCard } from '@/features/game/league-card';
import { useIsGuest } from '@/features/guest/guest';
import { GuestBanner } from '@/features/guest/guest-gate';
import { LanguagePicker } from '@/features/learn/language-picker';
import { useDailyReview } from '@/features/learn/daily-review';

function describeLanguage(language: ProfileLanguage) {
  if (language.type === 'native') return t('Native');
  return language.level ? t('Learning · {level}', { level: language.level }) : t('Learning');
}

export default function HomeScreen() {
  const daily = useDailyReview();
  const guest = useIsGuest();
  const summary = useLearnSummary().data;
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  useTabReselect('index', () => {
    scroll.current?.scrollTo({ y: 0, animated: true });
  });
  const { colors, styles } = useThemedStyles(createStyles);
  const profileQuery = useMyProfile();
  const { user } = useSession();
  useRefreshOnFocus(profileKeys.all);
  const progress = useLearnProgress();
  const review = useCorrectionCards();
  const [drafts] = useDeviceState<Record<string, LessonDraft>>(user?.id, 'lessons', {});
  const recent = Object.values(drafts).sort((a, b) => b.updatedAt - a.updatedAt).find(({ id }) => findLesson(id));
  const due = review.data?.filter((card) => card.due).length ?? 0;

  if (profileQuery.isPending) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (profileQuery.isError) {
    return (
      <Screen>
        <ErrorState
          title={t("Could not load your dashboard")}
          message={profileQuery.error.message}
          onRetry={() => profileQuery.refetch()}
        />
      </Screen>
    );
  }

  const { profile, statistics, languages } = profileQuery.data;

  // New users without languages start with the short onboarding.
  if (languages.length === 0 && user && !hasSkippedOnboarding(user.id)) {
    return <Redirect href="/onboarding" />;
  }
  const displayName = profile?.full_name || profile?.username || 'there';
  const firstName = displayName.split(' ')[0];
  const learning = languages.filter((language) => language.type === 'learning');

  const selected = learning.flatMap((language) => {
    const course = courseForLanguage(language.name);
    const entry = course && nextLesson(course, language.level, progress.data);
    return course && entry ? [{ course, entry }] : [];
  })[0];
  const next = recent ? findLesson(recent.id) : selected;
  const reviewNext = !recent && daily.due > 0 && (!next || summary?.goal_done_today);

  const missingProfileSteps = [
    !profile?.conversation_topics && t('a conversation topic'),
    !profile?.bio && t('a short bio'),
    languages.length === 0 && t('your languages'),
  ].filter(Boolean) as string[];

  return (
    <Screen>
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={profileQuery.isRefetching}
            onRefresh={() => {
              profileQuery.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {guest ? <GuestBanner /> : null}

        {/* Greeting with today's numbers in one line */}
        <View style={styles.greeting}>
          <AppText variant="title">{t('Hi, {name}', { name: firstName })}</AppText>
          <View style={styles.chips}>
            <StatChip icon="🔥" value={summary?.streak ?? 0} label={t("Day streak")}
              hint={t('Your streak: days in a row with your daily goal reached. Learn today so it keeps going.')} />
            <StatChip icon="⭐" value={summary?.total_xp ?? statistics?.total_xp ?? 0} label={t("Total XP")}
              hint={t('All the XP you have earned. Every lesson gives XP, and they also count for the weekly league.')} />
            <StatChip icon="📘" value={summary?.completed_lessons ?? statistics?.completed_lessons ?? 0} label={t("Lessons")}
              hint={t('Lessons you have finished. Each one unlocks the next step on your path.')} />
          </View>
        </View>

        <MedvedSays mood={summary?.goal_done_today ? 'cheer' : 'happy'} message={medvedMessage(summary, medvedPhrases(next?.course.id, getUiLanguage()).hello)} />

        {/* The one thing to do next comes first */}
        <View style={styles.hero}>
          <AppText style={styles.heroLabel}>{reviewNext ? t('Daily review') : next ? `${next.course.flag}  ${t('Continue learning')} · ${t(next.course.name)}` : t('Continue learning')}</AppText>
          {reviewNext ? (
            <AppText style={styles.heroTitle}>{t('{n} questions due', { n: daily.due })}</AppText>
          ) : next ? (
            <>
              <AppText style={styles.heroTitle} numberOfLines={2}>{next.entry.title}</AppText>
              <AppText style={styles.heroMeta}>{t(activityLabel(next.entry))} · {t('about {n} min', { n: activityDuration(next.entry.ex) })}</AppText>
            </>
          ) : null}
          {summary ? (
            <View style={styles.heroGoal}>
              <View style={styles.heroTrack}>
                <View style={[styles.heroFill, { width: `${Math.max(4, Math.min(1, summary.daily_xp / Math.max(1, summary.daily_goal_xp)) * 100)}%` }]} />
              </View>
              <AppText style={styles.heroMeta}>🎯 {Math.min(summary.daily_xp, summary.daily_goal_xp)}/{summary.daily_goal_xp} XP</AppText>
            </View>
          ) : null}
          <Pressable onPress={() => reviewNext ? router.push('/daily-review') : next ? router.push({ pathname: '/lesson/[id]', params: { id: next.entry.id } }) : router.push('/learn')}
            accessibilityRole="button" style={({ pressed }) => [styles.heroButton, pressed && styles.heroPressed]}>
            <AppText style={styles.heroButtonText}>{reviewNext ? t('Daily review') : next ? (recent ? t('▶ Resume lesson') : t('▶ Start next lesson')) : t('Open Learn')}</AppText>
          </Pressable>
        </View>

        <Card style={styles.card}>
          <AppText variant="heading">{t('A day in Zurich')}</AppText>
          <AppText color="textSecondary">{t('Play a branching adventure')}</AppText>
          <Button title={t('Start the Zurich adventure')} onPress={() => router.push('/zurich-adventure')} />
        </Card>
        <Card style={styles.card}>
          <AppText variant="heading">{t('Daily circuit')}</AppText>
          <AppText color="textSecondary">{t('Earn medals with a new vocabulary round')}</AppText>
          <Button title={t('Start practice')} variant="secondary"
            onPress={() => router.push({ pathname: '/daily-circuit', params: next ? { course: next.course.id } : {} })} />
        </Card>
        <SocialShortcuts course={next?.course.id} />

        {(!reviewNext && daily.items.length > 0) || due > 0 ? (
        <Card style={styles.card}>
          {!reviewNext && daily.items.length > 0 ? (
            <Pressable onPress={() => router.push('/daily-review')} accessibilityRole="button" style={styles.dailyReview}>
              <AppText style={styles.dailyIcon} accessible={false}>🔁</AppText>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{t('Daily review')}</AppText>
                <AppText variant="caption" color="textSecondary">
                  {daily.due > 0
                    ? t('{n} due · about {m} min', { n: daily.due, m: Math.max(2, Math.ceil(daily.items.length / 2)) })
                    : t('{n} new words · about {m} min', { n: daily.items.length, m: Math.max(2, Math.ceil(daily.items.length / 2)) })}
                </AppText>
              </View>
              <AppText variant="heading" color="primary" accessible={false}>›</AppText>
            </Pressable>
          ) : null}
          {due > 0 ? (
            <Button title={due === 1 ? t('Review 1 correction') : t('Review {n} corrections', { n: due })} size="sm" variant="secondary"
              onPress={() => router.push('/correction-review')} />
          ) : null}
        </Card>
        ) : null}

        <DailyCards />
        <RewardsCard />
        <QuestsCard />
        <Card style={styles.card}>
          <LanguagePicker />
        </Card>
        <ChallengesCard />
        <LeagueCard compact />
        <DiscoverGrid />

        {/* Complete profile */}
        {missingProfileSteps.length > 0 ? (
          <PressableCard
            style={styles.completeCard}
            onPress={() => router.push('/edit-profile')}
            accessibilityLabel={t("Complete your profile")}
          >
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{t("Complete your profile")}</AppText>
              <AppText variant="caption" color="textSecondary" numberOfLines={2}>
                {t('Add {steps} to get better matches.', { steps: missingProfileSteps.join(', ') })}
              </AppText>
            </View>
            <AppText variant="title" color="textMuted">›</AppText>
          </PressableCard>
        ) : null}

        {/* Languages */}
        <View style={styles.sectionHeader}>
          <AppText variant="heading">{t("My languages")}</AppText>
          <Pressable onPress={() => router.push('/edit-profile')} accessibilityRole="button" hitSlop={8}>
            <AppText variant="caption" color="primary" style={styles.bold}>{t("Manage")}</AppText>
          </Pressable>
        </View>

        {languages.length === 0 ? (
          <Card style={styles.emptyLanguages}>
            <AppText variant="callout" color="textSecondary" align="center">
              {t("Add the languages you speak and want to learn, so we can match you with the right partners.")}
            </AppText>
            <Button title={t("Add languages")} variant="secondary" size="sm" onPress={() => router.push('/edit-profile')} />
          </Card>
        ) : (
          <View style={styles.languageGrid}>
            {languages.map((language) => (
              <View key={`${language.languageId}-${language.type}`} style={styles.languageChip}>
                <Flag emoji={language.flagEmoji} size={24} />
                <View style={styles.flex}>
                  <AppText variant="callout" style={styles.bold} numberOfLines={1}>{t(language.name)}</AppText>
                  <AppText variant="small" color="textSecondary" numberOfLines={1}>{describeLanguage(language)}</AppText>
                </View>
              </View>
            ))}
          </View>
        )}
        <Button title={t("Find a partner")} variant="secondary" onPress={() => router.push('/explore')} />
      </ScrollView>
    </Screen>
  );
}

function medvedMessage(
  summary: { daily_xp: number; daily_goal_xp: number; goal_done_today: boolean; streak: number } | undefined,
  hello: string,
) {
  if (!summary) return t("{hello} I'm Fabio. Let's learn something today.", { hello });
  if (summary.goal_done_today) return t("Daily goal done! {n}-day streak. I'm proud of you!", { n: summary.streak });
  const left = Math.max(summary.daily_goal_xp - summary.daily_xp, 0);
  return summary.daily_xp > 0
    ? t("Only {n} XP left to reach today's goal!", { n: left })
    : summary.streak > 0
      ? t('Keep your {n}-day streak alive with one lesson!', { n: summary.streak })
      : t("{hello} I'm Fabio. One short lesson starts your streak.", { hello });
}

function StatChip({ icon, value, label, hint }: { icon: string; value: number; label: string; hint: string }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <HintStat icon={icon} value={value} title={label} text={hint} style={styles.chip}>
      <AppText style={styles.chipIcon} accessible={false}>{icon}</AppText>
      <AppText variant="bodyStrong">{value.toLocaleString('en-GB')}</AppText>
    </HintStat>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  flex: { flex: 1 },
  bold: { fontWeight: '800' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bell: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
  bellIcon: { fontSize: 18, lineHeight: 22 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoIcon: {
    width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.action,
    alignItems: 'center', justifyContent: 'center',
  },
  greeting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  chips: { flexDirection: 'row', gap: spacing.xs },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.full, backgroundColor: colors.surfaceMuted,
  },
  chipIcon: { fontSize: 14, lineHeight: 18 },
  card: { gap: spacing.sm },
  hero: {
    gap: spacing.sm, padding: spacing.lg, borderRadius: radius.xxl,
    backgroundColor: '#4B3FB8', borderBottomWidth: 6, borderBottomColor: '#352B8A',
  },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 18, fontWeight: '800', letterSpacing: 0.5 },
  heroTitle: { color: '#FFFFFF', fontSize: 26, lineHeight: 32, fontWeight: '900' },
  heroMeta: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 18, fontWeight: '700' },
  heroGoal: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroTrack: { flex: 1, height: 10, borderRadius: radius.full, backgroundColor: 'rgba(0,0,0,0.25)', overflow: 'hidden' },
  heroFill: { height: '100%', borderRadius: radius.full, backgroundColor: '#F2B705' },
  heroButton: {
    alignItems: 'center', justifyContent: 'center', minHeight: 54, marginTop: spacing.xs, borderRadius: radius.xl,
    backgroundColor: '#FFFFFF', borderBottomWidth: 5, borderBottomColor: '#C9C2F5',
  },
  heroPressed: { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
  heroButtonText: { color: '#352B8A', fontSize: 17, lineHeight: 22, fontWeight: '900' },
  completeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dailyReview: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md,
    borderRadius: radius.lg, backgroundColor: colors.primarySoft,
  },
  dailyIcon: { fontSize: 26, lineHeight: 32 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  emptyLanguages: { alignItems: 'center', gap: spacing.md },
  languageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  languageChip: {
    flexGrow: 1, flexBasis: '45%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.borderSubtle,
  },
});
