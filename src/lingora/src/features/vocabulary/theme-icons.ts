/** A symbol and a soft colour for each vocabulary theme, shown in the Words tab. */
type ThemeLook = { icon: string; tint: string };

const looks: Record<string, ThemeLook> = {
  'Digital nomad life': { icon: '💻', tint: '#2F8F8A' },
  'Bali culture': { icon: '🛕', tint: '#D97B29' },
  'First words': { icon: '👋', tint: '#F2B705' },
  'Numbers and quantities': { icon: '🔢', tint: '#3C6FD1' },
  'Family and people': { icon: '👨‍👩‍👧', tint: '#E07A5F' },
  Home: { icon: '🏠', tint: '#B8860B' },
  Food: { icon: '🍞', tint: '#D4A017' },
  'Drinks and dining': { icon: '🍽️', tint: '#C0392B' },
  'Travel and transport': { icon: '🚆', tint: '#2F8F8A' },
  'Town and places': { icon: '🏙️', tint: '#6554C4' },
  'Work and office': { icon: '💼', tint: '#5C6B7A' },
  'School and learning': { icon: '🎓', tint: '#3C6FD1' },
  Technology: { icon: '💻', tint: '#4A90A4' },
  'Body and health': { icon: '🩺', tint: '#D1495B' },
  'Clothing and shopping': { icon: '🛍️', tint: '#C2185B' },
  'Nature and weather': { icon: '🌦️', tint: '#3E9B6B' },
  Animals: { icon: '🐾', tint: '#8D6E63' },
  'Sports and leisure': { icon: '⚽', tint: '#2E7D32' },
  'Feelings and personality': { icon: '💛', tint: '#F2B705' },
  'Time and calendar': { icon: '📅', tint: '#5E60CE' },
  'Everyday verbs': { icon: '🏃', tint: '#E76F51' },
  Conversation: { icon: '💬', tint: '#2A9D8F' },
  'Money and banking': { icon: '💶', tint: '#2E7D32' },
  'Emergencies and services': { icon: '🚑', tint: '#D1495B' },
  'Celebrations and holidays': { icon: '🎉', tint: '#C2185B' },
  'Media and news': { icon: '📰', tint: '#5C6B7A' },
  Environment: { icon: '🌱', tint: '#3E9B6B' },
  'Everyday phrases': { icon: '🗨️', tint: '#2A9D8F' },
  '2000 most frequent words': { icon: '📊', tint: '#6554C4' },
};

/** Lesson phrase lists (named after units) and unknown themes get a book. */
export function themeLook(title: string): ThemeLook {
  return looks[title] ?? { icon: '📘', tint: '#3C6FD1' };
}
