import { router } from 'expo-router';
import { useRef, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Flag } from '@/components/flag';
import { MedvedSays } from '@/components/medved';
import { AppText, Button, Card, PressableCard, Screen } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { courses, entriesForUnit } from '@/features/learn/catalog';
import { CoursePath } from '@/features/learn/course-path';
import { useActiveCourse } from '@/features/learn/active-course';
import {
  dailyGoalOptions, useLearnProgress, useLearnSummary, useSetDailyGoal,
} from '@/features/learn/progress';
import { useMyProfile } from '@/features/profile/api';
import { courseForLanguage } from '@/features/learn/next-lesson';
import { useTabReselect } from '@/hooks/use-tab-reselect';
import { t } from '@/lib/i18n';
import { ReminderPrompt } from '@/features/notifications/reminder-prompt';

export default function LearnScreen() {
  const active = useActiveCourse();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  useTabReselect('learn', () => {
    active.browse(true);
    scroll.current?.scrollTo({ y: 0, animated: true });
  });
  const progress = useLearnProgress();
  const profile = useMyProfile().data;
  const course = active.browsing ? undefined : active.course;

  if (course) {
    const props = {
      course,
      startingLevel: profile?.languages.find((language) => language.type === 'learning' && courseForLanguage(language.name)?.id === course.id)?.level,
      onBack: () => active.browse(true),
      scores: progress.data,
      progressUnavailable: progress.isError,
    };
    return (
      <Screen>
        <CoursePath key={course.id} {...props} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView ref={scroll} contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <AppText variant="label" color="primary">{t("GrammarFirst")}</AppText>
            <AppText variant="display" accessibilityRole="header">{t("Learn")}</AppText>
          </View>
        </View>
        <MedvedSays message={t("Pick a language and I'll guide you, step by step.")} />
        <DailyGoalCard />
        <ReminderPrompt />
        <Button title={t('Review mistakes')} variant="secondary" onPress={() => router.push('/practice-review')} />
        <Button title={t("Review chat corrections")} variant="secondary" onPress={() => router.push('/correction-review')} />
        {progress.isError && (
          <AppText color="danger">{t("Saved progress could not be loaded on this device.")}</AppText>
        )}
        {courses.map((item) => {
          const entries = item.units.flatMap(entriesForUnit);
          const completed = entries.filter(({ id }) => progress.data?.[id] !== undefined).length;
          return (
            <PressableCard key={item.id} onPress={() => active.choose(item.id)}>
              <View style={styles.courseRow}>
                <Flag emoji={item.flag} size={40} />
                <View style={styles.flex}>
                  <AppText variant="heading">{t(item.name)}</AppText>
                  <AppText variant="caption" color="textSecondary">
                    {t('{done} / {total} completed', { done: completed, total: entries.length })}
                  </AppText>
                  <View style={styles.bar}>
                    <View style={[styles.barFill, { width: `${entries.length ? (completed / entries.length) * 100 : 0}%` }]} />
                  </View>
                </View>
                <AppText variant="title" color="primary" accessible={false}>›</AppText>
              </View>
            </PressableCard>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

function DailyGoalCard() {
  const { styles: themed } = useThemedStyles(createGoalStyles);
  const summary = useLearnSummary();
  const setGoal = useSetDailyGoal();
  const data = summary.data;
  const goal = data?.daily_goal_xp ?? 20;

  return (
    <Card style={themed.card}>
      <View style={themed.header}>
        <AppText variant="heading">{t("🎯 Daily goal")}</AppText>
        <AppText variant="caption" color="textSecondary">
          {data ? t('{done} / {goal} XP today', { done: Math.min(data.daily_xp, goal), goal }) : ' '}
        </AppText>
      </View>
      <View style={themed.options} accessibilityRole="radiogroup">
        {dailyGoalOptions.map((option) => {
          const selected = option === goal;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: setGoal.isPending }}
              disabled={setGoal.isPending}
              onPress={() => setGoal.mutate(option)}
              style={[themed.option, selected && themed.optionSelected]}
            >
              <AppText variant="bodyStrong" color={selected ? 'primary' : 'textSecondary'}>{option} XP</AppText>
            </Pressable>
          );
        })}
      </View>
      {data ? (
        <AppText variant="caption" color="textSecondary">
          {t('🔥 {streak}-day streak · 🧊 {freezes} streak freezes (earn one every 7 days)', { streak: data.streak, freezes: data.streak_freezes })}
        </AppText>
      ) : null}
      {setGoal.isError ? <AppText color="danger">{setGoal.error.message}</AppText> : null}
    </Card>
  );
}

const createGoalStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  options: { flexDirection: 'row', gap: spacing.sm },
  option: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
});

const styles = StyleSheet.create({
  content: { padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bar: { height: 8, marginTop: spacing.xs, borderRadius: radius.full, backgroundColor: 'rgba(127,127,127,0.18)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.full, backgroundColor: '#F2B705' },
});
