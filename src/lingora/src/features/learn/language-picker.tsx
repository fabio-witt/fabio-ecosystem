import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Flag } from '@/components/flag';
import { AppText } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { t } from '@/lib/i18n';

import { useActiveCourse } from './active-course';
import { courses, entriesForUnit } from './catalog';
import { useLearnProgress } from './progress';

/** Grid of all courses with flags and progress, as in GrammarFirst. */
export function LanguagePicker({ onPicked, title = true }: { onPicked?: () => void; title?: boolean }) {
  const { styles } = useThemedStyles(createStyles);
  const progress = useLearnProgress().data;
  const { course: active, choose } = useActiveCourse();

  return (
    <View style={styles.box}>
      {title ? <AppText variant="heading" align="center">{t('Which language do you want to learn?')}</AppText> : null}
      <View style={styles.grid} accessibilityRole="radiogroup">
        {courses.map((course) => {
          const entries = course.units.flatMap(entriesForUnit);
          const done = entries.filter(({ id }) => progress?.[id] !== undefined).length;
          const selected = active?.id === course.id;
          return (
            <Pressable
              key={course.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${t(course.name)}, ${t('{done}/{total} lessons', { done, total: entries.length })}`}
              onPress={() => {
                choose(course.id);
                onPicked?.();
                router.navigate('/learn');
              }}
              style={({ pressed }) => [styles.tile, selected && styles.tileSelected, pressed && styles.pressed]}
            >
              <Flag emoji={course.flag} size={40} />
              <AppText variant="callout" align="center" numberOfLines={1}
                style={[styles.name, t(course.name).length > 11 && styles.nameLong]}>{t(course.name)}</AppText>
              <AppText variant="small" color="textSecondary" align="center" numberOfLines={1} style={styles.count}>
                {t('{done}/{total} lessons', { done, total: entries.length })}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** The picker as a pop-up, opened from the flag in the top left corner. */
export function LanguagePickerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('Close')}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            <LanguagePicker onPicked={onClose} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  box: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '31.5%', alignItems: 'center', gap: 4,
    paddingVertical: spacing.md, paddingHorizontal: 2,
    borderRadius: radius.xl, borderWidth: 2, borderBottomWidth: 4,
    borderColor: colors.borderSubtle, backgroundColor: colors.surface,
  },
  tileSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  name: { fontWeight: '800', fontSize: 14, lineHeight: 18 },
  nameLong: { fontSize: 12, letterSpacing: -0.2 },
  count: { fontSize: 11, lineHeight: 14 },
  pressed: { transform: [{ translateY: 2 }] },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-start', padding: spacing.md, paddingTop: 64 },
  sheet: {
    width: '100%', maxWidth: 560, maxHeight: '85%', alignSelf: 'center',
    borderRadius: radius.xxl, backgroundColor: colors.background, overflow: 'hidden',
  },
  sheetContent: { padding: spacing.lg },
});
