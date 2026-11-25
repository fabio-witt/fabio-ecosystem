import type { UiLanguage } from '@/lib/i18n';

/**
 * Fabio greets and praises in the language you are learning, so the course
 * already starts with a word you can use. Without a course he uses the app
 * language.
 */
type Phrases = { hello: string; praise: string; perfect: string };

const byCourse: Record<string, Phrases> = {
  de: { hello: 'Hallo!', praise: 'Super gemacht!', perfect: 'Perfekt!' },
  en: { hello: 'Hello!', praise: 'Well done!', perfect: 'Brilliant!' },
  es: { hello: '¡Hola!', praise: '¡Muy bien!', perfect: '¡Perfecto!' },
  fr: { hello: 'Salut !', praise: 'Bravo !', perfect: 'Parfait !' },
  ru: { hello: 'Привет!', praise: 'Молодец!', perfect: 'Отлично!' },
  pl: { hello: 'Cześć!', praise: 'Brawo!', perfect: 'Świetnie!' },
  gsw: { hello: 'Hoi!', praise: 'Super gmacht!', perfect: 'Perfekt!' },
  it: { hello: 'Ciao!', praise: 'Bravo!', perfect: 'Perfetto!' },
  ga: { hello: 'Dia duit!', praise: 'Maith thú!', perfect: 'Ar fheabhas!' },
  pt: { hello: 'Olá!', praise: 'Muito bem!', perfect: 'Perfeito!' },
  sh: { hello: 'Zdravo!', praise: 'Bravo!', perfect: 'Odlično!' },
  id: { hello: 'Halo!', praise: 'Bagus sekali!', perfect: 'Sempurna!' },
};

const byUi: Record<UiLanguage, Phrases> = {
  en: { hello: 'Hi!', praise: 'Well done!', perfect: 'Perfect!' },
  de: { hello: 'Hallo!', praise: 'Super gemacht!', perfect: 'Perfekt!' },
};

export function medvedPhrases(courseId: string | undefined, ui: UiLanguage): Phrases {
  return (courseId && byCourse[courseId]) || byUi[ui];
}
