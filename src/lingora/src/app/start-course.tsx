import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { AppText, Button, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { startAsGuest } from '@/features/guest/guest';
import { useActiveCourse } from '@/features/learn/active-course';
import { courses, findLesson } from '@/features/learn/catalog';
import { rememberCourse } from '@/features/learn/course-entry';
import { t } from '@/lib/i18n';
import { useSession } from '@/providers/session-provider';

export default function StartCourse() {
  const { course: id, lesson: requestedLesson } = useLocalSearchParams<{ course?: string; lesson?: string }>();
  const course = courses.find(item => item.id === id);
  const lesson = requestedLesson && findLesson(requestedLesson);
  const lessonId = lesson && lesson.course.id === course?.id ? lesson.entry.id : undefined;
  const { user } = useSession();
  const { choose } = useActiveCourse();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <Screen>
      <ScreenHeader title={t('Open Learn')} />
      <ScrollView contentContainerStyle={{ padding: screenPadding, gap: spacing.md }}>
        {course ? <>
          <AppText variant="title">{course.flag} {t(course.name)}</AppText>
          {lessonId && lesson && <AppText>{lesson.entry.title}</AppText>}
          <Button title={user ? t('Open Learn') : t('🐻 Start as a guest')} loading={loading} onPress={async () => {
            if (user) {
              choose(course.id);
              router.replace(lessonId ? { pathname: '/lesson/[id]', params: { id: lessonId } } : '/learn');
              return;
            }
            rememberCourse(course.id, lessonId);
            setLoading(true);
            setError(undefined);
            const problem = await startAsGuest();
            setLoading(false);
            if (problem) setError(problem);
          }} />
          {!user && <Button title={t('Log in')} variant="secondary" onPress={() => {
            rememberCourse(course.id, lessonId);
            router.push('/login');
          }} />}
          {error && <AppText color="danger" accessibilityLiveRegion="polite">{error}</AppText>}
        </> : <Button title={t('Open Learn')} onPress={() => router.replace(user ? '/learn' : '/login')} />}
      </ScrollView>
    </Screen>
  );
}
