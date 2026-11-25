import { cefrLevels, courseSections, courses, type CefrLevel } from '@/features/learn/catalog';

const aliases: Record<string, string> = { 'Swiss German': 'gsw' };

export function recommendStarter(language: { name: string; language_code?: string | null }, level: CefrLevel) {
  const code = language.language_code?.trim().toLowerCase();
  const course = courses.find((item) => item.id === code)
    ?? courses.find((item) => item.name === language.name || item.id === aliases[language.name]);
  if (!course) return;

  const sections = courseSections(course, true);
  // If the course ends below the selected level, offer its closest level.
  const available = sections.filter(({ data }) => data.length > 0);
  const section = available.findLast((item) => cefrLevels.indexOf(item.level) <= cefrLevels.indexOf(level))
    ?? available[0];
  if (section) return { course, entry: section.data[0], level: section.level };
}
