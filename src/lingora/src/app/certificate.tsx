import { router, useLocalSearchParams } from 'expo-router';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { BrandIcon } from '@/components/brand-logo';
import { Flag } from '@/components/flag';
import { AppText, Button, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { levelColors } from '@/features/learn/badges';
import { cefrLevels, cefrNames, courses, type CefrLevel } from '@/features/learn/catalog';
import { EXAM_PASS, examId } from '@/features/learn/exams';
import { useLearnProgress } from '@/features/learn/progress';
import { useMyProfile } from '@/features/profile/api';
import { getUiLanguage, t } from '@/lib/i18n';

/** Certificate for a passed level exam. Can be printed or saved as PDF on the web. */
export default function CertificateScreen() {
  const params = useLocalSearchParams<{ course?: string; level?: string }>();
  const course = courses.find((item) => item.id === params.course);
  const level = cefrLevels.includes(params.level as CefrLevel) ? (params.level as CefrLevel) : 'A1';
  const progress = useLearnProgress();
  const profile = useMyProfile().data?.profile;
  const score = course ? progress.data?.[examId(course.id, level)] : undefined;
  const passed = score !== undefined && score >= EXAM_PASS;
  const name = profile?.full_name || profile?.username || t('Lingora learner');
  const date = new Date().toLocaleDateString(getUiLanguage() === 'de' ? 'de-CH' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Certificate')} />
      <ScrollView contentContainerStyle={styles.content}>
        {!course || (!passed && !progress.isPending) ? (
          <View style={styles.missing}>
            <AppText variant="heading" align="center">{t('No certificate yet')}</AppText>
            <AppText color="textSecondary" align="center">{t('Pass the level exam with at least {n}% to receive your certificate.', { n: EXAM_PASS })}</AppText>
            {course ? <Button title={t('Go to the exam')} onPress={() => router.replace({ pathname: '/exam', params: { course: course.id, level } })} /> : null}
          </View>
        ) : (
          <>
            <View style={styles.certificate} accessible accessibilityLabel={t('Certificate: {name} passed {course} level {level}', { name, course: t(course.name), level })}>
              <View style={[styles.band, { backgroundColor: levelColors[level] }]} />
              <View style={styles.header}>
                <BrandIcon size={44} />
                <AppText style={styles.brand}>Lingora</AppText>
              </View>
              <AppText style={styles.kicker}>{t('CERTIFICATE OF ACHIEVEMENT')}</AppText>
              <AppText style={styles.small}>{t('This certifies that')}</AppText>
              <AppText style={styles.name}>{name}</AppText>
              <AppText style={styles.small}>{t('has successfully passed the final exam of level')}</AppText>
              <View style={styles.levelRow}>
                <Flag emoji={course.flag} size={40} />
                <View style={[styles.seal, { backgroundColor: levelColors[level] }]}>
                  <AppText style={styles.sealText}>{level}</AppText>
                </View>
              </View>
              <AppText style={styles.course}>{t(course.name)} · {t(cefrNames[level])}</AppText>
              <AppText style={styles.small}>{t('Result: {n}%', { n: score ?? 0 })} · {date}</AppText>
              <AppText style={styles.footnote}>{t('Level according to the Common European Framework of Reference (CEFR), as taught in the Lingora course.')}</AppText>
            </View>
            {Platform.OS === 'web' ? (
              <Button title={t('🖨️ Print or save as PDF')} size="lg" fullWidth onPress={() => window.print()} />
            ) : null}
            <Button title={t('Back to the path')} variant="ghost" onPress={() => router.back()} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

// The certificate itself is always light, like paper, also in dark mode.
const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  missing: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  certificate: {
    alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24, overflow: 'hidden',
    borderRadius: 18, backgroundColor: '#FFFDF6', borderWidth: 3, borderColor: '#D9B44A',
  },
  band: { position: 'absolute', top: 0, left: 0, right: 0, height: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontSize: 26, lineHeight: 32, fontWeight: '900', color: '#111111' },
  kicker: { marginTop: 6, fontSize: 13, letterSpacing: 2, fontWeight: '800', color: '#8A6D1F', textAlign: 'center' },
  small: { fontSize: 14, color: '#4A4A4A', textAlign: 'center' },
  name: { fontSize: 30, lineHeight: 38, fontWeight: '900', color: '#111111', textAlign: 'center' },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 4 },
  seal: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#D9B44A' },
  sealText: { color: '#FFFFFF', fontSize: 26, lineHeight: 32, fontWeight: '900' },
  course: { fontSize: 20, lineHeight: 26, fontWeight: '800', color: '#111111', textAlign: 'center' },
  footnote: { marginTop: 8, fontSize: 11, color: '#7A7A7A', textAlign: 'center' },
});
