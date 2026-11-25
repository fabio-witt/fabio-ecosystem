import type { Course } from '@/features/learn/catalog';

import { extraThemes } from './extra-themes';
import frequencyData from './frequency.json';
import themeData from './themes.json';

export type Word = [target: string, meaning?: string];
type Context = { text: string; translation?: string; focus: number; review: number };
export type Topic = {
  id: string;
  title: string;
  words: Word[];
  examples: Context[];
  recap?: Context & { theme: string };
};

const themes: Partial<Record<string, (Omit<Topic, 'id' | 'words'> & { words: string[][] })[]>> = themeData;
const frequencies: Partial<Record<string, string[]>> = frequencyData;

const subtitles = {
  name: 'Hermit Dave · FrequencyWords 2018 (OpenSubtitles)',
  source: 'https://github.com/hermitdave/FrequencyWords',
  license: 'CC BY-SA 4.0',
  note: 'Ranked lexical forms from film and TV subtitles. Spelling and register vary.',
} as const;
const irish = {
  name: 'Michal Boleslav Měchura · Irish Word Frequency List',
  source: 'https://github.com/michmech/irish-word-frequency',
  license: 'ODbL 1.0',
  note: 'Ranked dictionary forms from the New Corpus for Ireland.',
} as const;
const zurich = {
  name: 'Aepli et al. · NTREX Zurich German references',
  source: 'https://github.com/MicrosoftTranslator/NTREX/tree/main/NTREX-additional',
  license: 'CC BY-SA 4.0',
  note: 'Ranked word forms in a Zurich German news corpus. This reflects that corpus, and spelling can vary.',
} as const;

export function frequencySource(languageId: string) {
  return languageId === 'ga' ? irish : languageId === 'gsw' ? zurich : subtitles;
}

export function vocabularyFor(course: Course) {
  const categories: Topic[] = [...(themes[course.id] ?? []), ...(extraThemes[course.id] ?? [])].map((topic, index) => ({
    ...topic,
    words: topic.words.map(([word, meaning]) => [word, meaning]),
    // Short, simple sentences first; very long news-style sentences do not help beginners.
    examples: [...topic.examples].filter((example) => example.text.split(/\s+/).length <= 30)
      .sort((a, b) => a.text.length - b.text.length),
    id: `theme-${index}`,
  }));
  const glosses = new Map<string, string>();
  for (const topic of categories) {
    for (const [word, meaning] of topic.words) {
      if (meaning && meaning !== word && !glosses.has(word.toLowerCase())) {
        glosses.set(word.toLowerCase(), meaning);
      }
    }
  }

  const frequency: Topic = {
    id: 'common',
    title: '2000 most frequent words',
    words: (frequencies[course.id] ?? []).map((word) => [word, glosses.get(word.toLowerCase())]),
    examples: [],
  };

  const review: Topic[] = course.units.map((unit, index) => {
    const phrases = new Map<string, string | undefined>();
    for (const lesson of unit.lessons) {
      for (const [text, translation] of lesson.examples) phrases.set(text, translation);
    }
    return { id: `review-${index}`, title: unit.title, words: [...phrases], examples: [] };
  }).filter((topic) => topic.words.length > 0);

  return { frequency, categories, review };
}
