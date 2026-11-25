import { router, useLocalSearchParams } from 'expo-router';

import { AppText, Screen } from '@/components/ui';
import { celebrate } from '@/features/game/celebrations';
import { useGame } from '@/features/game/store';
import { courses } from '@/features/learn/catalog';
import { wordStationKey, wordStations } from '@/features/learn/exams';
import { VocabularyTrainer } from '@/features/vocabulary/vocabulary-trainer';
import { t } from '@/lib/i18n';
import { track } from '@/lib/insights';

/** A vocabulary stop on the learning path: 10 questions on one theme. */
export default function WordStationScreen() {
  const params = useLocalSearchParams<{ course?: string; unit?: string }>();
  const course = courses.find((item) => item.id === params.course);
  const unitIndex = Number(params.unit);
  const game = useGame();
  const topic = course ? wordStations(course).get(unitIndex) : undefined;

  if (!course || !topic) {
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <AppText style={{ padding: 24 }}>{t('This word station does not exist.')}</AppText>
      </Screen>
    );
  }
  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <VocabularyTrainer
        courseId={course.id}
        topics={[topic]}
        backLabel={t('‹ Path')}
        onBack={() => router.back()}
        onFinish={(correct, total) => {
          // 7 of 10 right passes the station.
          if (correct >= Math.ceil(total * 0.7)) {
            game.passWordStation(wordStationKey(course.id, unitIndex));
            track('word_station_passed', { course: course.id });
            celebrate({ icon: '🗂', title: 'Word station passed!', gems: 5 });
          }
        }}
      />
    </Screen>
  );
}
