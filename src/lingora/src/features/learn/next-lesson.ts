import { cefrLevels, courses, courseSections, type Course } from './catalog';

export type LessonDraft = {
  id: string;
  answers: (boolean | null)[];
  /** What the learner entered for each exercise, shown on the results screen. */
  given?: string[];
  writing: string;
  updatedAt: number;
};

export function courseForLanguage(name: string) {
  return courses.find((course) => course.name === name || (name === 'Swiss German' && course.id === 'gsw'));
}

export function nextLesson(course: Course, level?: string | null, scores?: Record<string, number>) {
  const sections = courseSections(course, false).filter(({ data }) => data.length);
  const target = cefrLevels.findIndex((item) => item === level);
  const start = sections.findLastIndex((section) => cefrLevels.indexOf(section.level) <= target);
  return sections.slice(Math.max(start, 0)).flatMap((section) => section.data)
    .find((entry) => scores?.[entry.id] === undefined);
}

export function activityDuration(exercises: { type: string }[]) {
  const minutes = exercises.reduce((sum, item) => sum + (item.type === 'writing' ? 3 : 0.5), 0);
  return Math.max(1, Math.ceil(minutes));
}
