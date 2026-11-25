import { useCallback } from 'react';

import { useMyProfile } from '@/features/profile/api';
import { useDeviceState } from '@/lib/device-state';
import { useSession } from '@/providers/session-provider';

import { courses, type Course } from './catalog';
import { courseForLanguage } from './next-lesson';

type Stored = { courseId: string | null; browsing: boolean };

/**
 * The course someone is learning right now. Shared by the Learn tab, the
 * language picker on Home and the flag in the top left corner.
 * Without a choice yet, it is the first learning language from the profile.
 */
export function useActiveCourse() {
  const { user } = useSession();
  const [stored, setStored] = useDeviceState<Stored | null>(user?.id, 'active-course', null);
  const languages = useMyProfile().data?.languages;
  const fromProfile = languages
    ?.filter((language) => language.type === 'learning')
    .map((language) => courseForLanguage(language.name))
    .find(Boolean);
  const courseId = stored ? stored.courseId : fromProfile?.id ?? null;
  const course: Course | undefined = courses.find((item) => item.id === courseId);

  const choose = useCallback((id: string) => setStored({ courseId: id, browsing: false }), [setStored]);
  const browse = useCallback((browsing: boolean) => setStored((current) => ({
    courseId: current ? current.courseId : courseId, browsing,
  })), [setStored, courseId]);

  return { course, browsing: stored?.browsing ?? false, choose, browse };
}
