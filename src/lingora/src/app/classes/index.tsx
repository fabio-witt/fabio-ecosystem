import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Card, LoadingState, PressableCard, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useClassActions, useMyClasses } from '@/features/classes/api';
import { Chip } from '@/features/forum/ui';
import { GuestGate } from '@/features/guest/guest-gate';
import { useIsGuest } from '@/features/guest/guest';
import { useActiveCourse } from '@/features/learn/active-course';
import { courses } from '@/features/learn/catalog';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';
import { useSession } from '@/providers/session-provider';

/** Classes for teachers, schools and families: share a code, assign lessons, see progress. */
export default function ClassesScreen() {
  const guest = useIsGuest();
  if (guest) return <GuestGate title={t('Classes')} message={t('Create a free account to join or teach a class.')} />;
  return <Classes />;
}

function Classes() {
  const { colors, styles } = useThemedStyles(createStyles);
  const { user } = useSession();
  const classes = useMyClasses();
  const actions = useClassActions();
  const { course } = useActiveCourse();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState(course?.id ?? 'de');
  const teaching = (classes.data ?? []).filter((item) => item.teacher_id === user?.id);
  const learning = (classes.data ?? []).filter((item) => item.teacher_id !== user?.id);

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Classes')} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText color="textSecondary">{t('For teachers, schools and families: the teacher assigns lessons, everyone learns in their own account, progress is visible at a glance.')}</AppText>
        <Card style={styles.group}>
          <AppText variant="heading">{t('Join a class')}</AppText>
          <View style={styles.row}>
            <TextInput value={code} onChangeText={setCode} autoCapitalize="characters" autoCorrect={false} maxLength={6}
              placeholder={t('6-letter code')} placeholderTextColor={colors.textMuted} style={styles.input} accessibilityLabel={t('Class code')} />
            <Button title={t('Join')} disabled={code.trim().length < 6 || actions.join.isPending}
              onPress={() => actions.join.mutate(code, { onSuccess: (id) => { feedback('ok'); setCode(''); router.push({ pathname: '/classes/[id]', params: { id } }); } })} />
          </View>
          {actions.join.isError ? <AppText color="danger">{actions.join.error.message}</AppText> : null}
        </Card>
        {classes.isPending ? <LoadingState /> : null}
        {learning.length ? <AppText variant="heading">{t('My classes')}</AppText> : null}
        {learning.map((item) => <ClassCard key={item.id} id={item.id} name={item.name} courseId={item.course_id} />)}
        {teaching.length ? <AppText variant="heading">{t('Classes I teach')}</AppText> : null}
        {teaching.map((item) => <ClassCard key={item.id} id={item.id} name={item.name} courseId={item.course_id} code={item.join_code} />)}
        <Card style={styles.group}>
          <AppText variant="heading">{t('Create a class')}</AppText>
          <TextInput value={name} onChangeText={setName} maxLength={80} placeholder={t('e.g. German A1 – Monday group')}
            placeholderTextColor={colors.textMuted} style={styles.input} accessibilityLabel={t('Class name')} />
          <View style={styles.wrap}>{courses.map((item) => (
            <Chip key={item.id} label={`${item.flag} ${t(item.name)}`} active={courseId === item.id} onPress={() => setCourseId(item.id)} />
          ))}</View>
          {actions.create.isError ? <AppText color="danger">{actions.create.error.message}</AppText> : null}
          <Button title={t('Create class')} disabled={name.trim().length < 3 || actions.create.isPending}
            onPress={() => actions.create.mutate({ name, courseId }, { onSuccess: (id) => { feedback('ok'); setName(''); router.push({ pathname: '/classes/[id]', params: { id } }); } })} />
        </Card>
      </ScrollView>
    </Screen>
  );
}

function ClassCard({ id, name, courseId, code }: { id: string; name: string; courseId: string; code?: string }) {
  const { styles } = useThemedStyles(createStyles);
  const course = courses.find((item) => item.id === courseId);
  return (
    <PressableCard onPress={() => router.push({ pathname: '/classes/[id]', params: { id } })} style={styles.group}>
      <AppText variant="bodyStrong">{course?.flag} {name}</AppText>
      <AppText variant="caption" color="textSecondary">{t(course?.name ?? courseId)}{code ? ` · ${t('Code: {code}', { code })}` : ''}</AppText>
    </PressableCard>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  group: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, borderRadius: radius.md, paddingHorizontal: spacing.md, minHeight: 46, fontSize: 16 },
});
