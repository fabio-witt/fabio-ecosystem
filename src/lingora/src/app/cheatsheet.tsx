import { router, useLocalSearchParams } from 'expo-router';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useActiveCourse } from '@/features/learn/active-course';
import { cefrLevels, cefrNames, courses, entriesForUnit, levelForUnit, type CefrLevel, type Lesson } from '@/features/learn/catalog';
import { t } from '@/lib/i18n';

/** One printable page per level: every grammar rule with its pattern and an example. */
export default function CheatSheetScreen() {
  const { styles } = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{ course?: string; level?: string }>();
  const active = useActiveCourse();
  const course = courses.find((item) => item.id === params.course) ?? active.course;
  const level = (cefrLevels.includes(params.level as CefrLevel) ? params.level : 'A1') as CefrLevel;
  const lessons: Lesson[] = course ? course.units.flatMap((unit, index) => levelForUnit(course, index) === level
    ? entriesForUnit(unit).filter((entry): entry is Lesson => 'rule' in entry && !(entry as Lesson).alphabet)
    : []) : [];

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Cheat sheet')} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title">{course ? `${course.flag} ${t(course.name)} · ${level}` : t('Choose a course first.')}</AppText>
        <AppText color="textSecondary">{t(cefrNames[level])} · {t('{n} rules on one page', { n: lessons.length })}</AppText>
        <View style={styles.levels}>
          {cefrLevels.map((item) => (
            <Button key={item} title={item} size="sm" variant={item === level ? 'primary' : 'secondary'}
              onPress={() => router.setParams({ level: item })} />
          ))}
        </View>
        {Platform.OS === 'web' ? <Button title={t('🖨 Print or save as PDF')} variant="secondary" onPress={() => window.print()} /> : null}
        {lessons.map((lesson, index) => (
          <Card key={lesson.id} style={styles.rule}>
            <AppText variant="bodyStrong">{index + 1}. {lesson.title}</AppText>
            <AppText>{lesson.rule}</AppText>
            {lesson.structure ? <AppText style={styles.pattern}>{lesson.structure}</AppText> : null}
            {lesson.examples[0] ? (
              <AppText color="textSecondary">„{lesson.examples[0][0]}“{lesson.examples[0][1] ? ` – ${lesson.examples[0][1]}` : ''}</AppText>
            ) : null}
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.sm },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  rule: { gap: 6 },
  pattern: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: colors.primary, fontWeight: '700' },
});
