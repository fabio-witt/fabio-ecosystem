import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useClassActions, useClassDetail, useClassProgress } from '@/features/classes/api';
import { courses, entriesForUnit, findLesson, levelForUnit } from '@/features/learn/catalog';
import { useLearnProgress } from '@/features/learn/progress';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';
import { useSession } from '@/providers/session-provider';

export default function ClassScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, styles } = useThemedStyles(createStyles);
  const { user } = useSession();
  const detail = useClassDetail(id);
  const klass = detail.data?.klass;
  const teacher = !!klass && klass.teacher_id === user?.id;
  const progress = useClassProgress(id, teacher);
  const mine = useLearnProgress();
  const actions = useClassActions();
  const [picking, setPicking] = useState(false);
  const [copied, setCopied] = useState(false);
  const course = courses.find((item) => item.id === klass?.course_id);
  const assignments = detail.data?.assignments ?? [];
  const assigned = new Set(assignments.map((item) => item.entry_id));

  if (detail.isPending) return <Screen><ScreenHeader title={t('Class')} /><LoadingState /></Screen>;
  if (detail.isError) return <Screen><ScreenHeader title={t('Class')} /><ErrorState message={t('Could not load this class.')} onRetry={() => detail.refetch()} /></Screen>;
  if (!klass) return <Screen><ScreenHeader title={t('Class')} /><EmptyState title={t('Class not found')} message={t('It may have been deleted.')} /></Screen>;

  // Student rows grouped: name → entry → score.
  const students = new Map<string, { name: string; scores: Record<string, number | null> }>();
  for (const row of progress.data ?? []) {
    const student = students.get(row.user_id) ?? { name: row.name, scores: {} };
    student.scores[row.entry_id] = row.best_score;
    students.set(row.user_id, student);
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={klass.name} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText color="textSecondary">{course ? `${course.flag} ${t(course.name)}` : klass.course_id}</AppText>
        {teacher ? (
          <Card style={styles.group}>
            <AppText variant="heading">{t('Class code')}</AppText>
            <AppText style={styles.code} selectable>{klass.join_code}</AppText>
            <AppText color="textSecondary">{t('Students open GrammarBay → Classes → Join a class and enter this code.')}</AppText>
            <Button title={copied ? t('Copied') : t('Copy code')} variant="secondary" onPress={() => { void Clipboard.setStringAsync(klass.join_code); setCopied(true); feedback('tap'); }} />
          </Card>
        ) : null}

        <AppText variant="heading">{t('Assigned lessons')}</AppText>
        {assignments.length === 0 ? <AppText color="textSecondary">{teacher ? t('Assign the first lesson below.') : t('Your teacher has not assigned anything yet.')}</AppText> : null}
        {assignments.map((item) => {
          const lesson = findLesson(item.entry_id);
          const score = mine.data?.[item.entry_id];
          return (
            <Card key={item.id} style={styles.assignment}>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{lesson?.entry.title ?? item.entry_id}</AppText>
                {!teacher ? <AppText variant="caption" color={score !== undefined ? 'success' : 'textSecondary'}>{score !== undefined ? t('Done · {n}%', { n: score }) : t('Not started')}</AppText> : null}
              </View>
              {teacher ? <Button title={t('Remove')} size="sm" variant="ghost" onPress={() => actions.unassign.mutate(item.id)} />
                : <Button title={score !== undefined ? t('Repeat') : t('Start')} size="sm" onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: item.entry_id } })} />}
            </Card>
          );
        })}

        {teacher ? (
          <>
            <Button title={picking ? t('Close lesson list') : t('+ Assign a lesson')} variant="secondary" onPress={() => setPicking(!picking)} />
            {picking && course ? course.units.map((unit, index) => (
              <Card key={index} style={styles.group}>
                <AppText variant="caption" color="textSecondary">{levelForUnit(course, index)} · {unit.title}</AppText>
                <View style={styles.wrap}>
                  {entriesForUnit(unit).map((entry) => (
                    <Button key={entry.id} title={(assigned.has(entry.id) ? '✓ ' : '') + entry.title} size="sm"
                      variant={assigned.has(entry.id) ? 'primary' : 'secondary'} disabled={assigned.has(entry.id) || actions.assign.isPending}
                      onPress={() => actions.assign.mutate({ classId: klass.id, entryId: entry.id }, { onSuccess: () => feedback('ok') })} />
                  ))}
                </View>
              </Card>
            )) : null}

            <AppText variant="heading">{t('Progress')}</AppText>
            {progress.isPending ? <LoadingState /> : students.size === 0 ? <AppText color="textSecondary">{t('No students yet – share the class code.')}</AppText> : (
              <Card style={styles.group}>
                {[...students.entries()].map(([studentId, student]) => {
                  const done = assignments.filter((item) => student.scores[item.entry_id] !== null && student.scores[item.entry_id] !== undefined).length;
                  const avg = Math.round(assignments.reduce((sum, item) => sum + (student.scores[item.entry_id] ?? 0), 0) / Math.max(done, 1));
                  return (
                    <View key={studentId} style={styles.studentRow}>
                      <AppText style={styles.flex} numberOfLines={1}>{student.name}</AppText>
                      <AppText variant="caption" color={done === assignments.length && done > 0 ? 'success' : 'textSecondary'}>
                        {t('{done}/{total} done', { done, total: assignments.length })}{done ? ` · Ø ${avg}%` : ''}
                      </AppText>
                      <Button title="✕" size="sm" variant="ghost" accessibilityLabel={t('Remove from class')}
                        onPress={() => actions.leave.mutate({ classId: klass.id, userId: studentId })} />
                    </View>
                  );
                })}
              </Card>
            )}
            <Button title={t('Delete class')} variant="ghost" onPress={() => actions.remove.mutate(klass.id, { onSuccess: () => router.back() })} />
          </>
        ) : (
          <Button title={t('Leave class')} variant="ghost" onPress={() => user && actions.leave.mutate({ classId: klass.id, userId: user.id }, { onSuccess: () => router.back() })} />
        )}
        <View style={{ height: 1, backgroundColor: colors.borderSubtle }} />
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  group: { gap: spacing.sm },
  flex: { flex: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  assignment: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  code: { fontSize: 30, fontWeight: '900', letterSpacing: 4, alignSelf: 'flex-start', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primarySoft, color: colors.primary, overflow: 'hidden' },
});
