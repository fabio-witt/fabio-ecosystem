import type { CourseEntry } from './catalog';
import type { ScoredExercise } from './exercise';

type Terrain = 'palms' | 'cliffs' | 'fort' | 'wreck' | 'lagoon' | 'lighthouse' | 'arch' | 'caves';

type Island = {
  name: string;
  terrain: Terrain;
  sea: string;
  sky: string;
  land: string;
  edge: string;
  emblem: string;
  light?: 'dusk' | 'night';
};

const islands: Island[] = [
  { name: 'Anchor Cove', terrain: 'palms', sea: '#115F71', sky: '#ACDFD8', land: '#F4C978', edge: '#114C56', emblem: '⚓' },
  { name: 'Crocodile Lagoon', terrain: 'lagoon', sea: '#157269', sky: '#BED99B', land: '#D9C475', edge: '#245649', emblem: '🐊' },
  { name: 'Corsair Reef', terrain: 'wreck', sea: '#325579', sky: '#F3C69F', land: '#DFA16D', edge: '#263D5F', emblem: '🏴‍☠️' },
  { name: 'Fort Beacon', terrain: 'fort', sea: '#41597A', sky: '#C9DAEB', land: '#BCAD98', edge: '#344360', emblem: '🏰' },
  { name: 'Glasswater Bay', terrain: 'cliffs', sea: '#215C85', sky: '#B3DAEC', land: '#ECE1BF', edge: '#29486B', emblem: '🐚' },
  { name: 'Compass Point', terrain: 'lighthouse', sea: '#5B5581', sky: '#EAD0E3', land: '#EEBF92', edge: '#423A65', emblem: '🧭' },
  { name: 'Amber Bluff', terrain: 'arch', sea: '#286C73', sky: '#F3D2A1', land: '#F4BC6D', edge: '#205156', emblem: '⛰️' },
  { name: 'Moonlit Shoal', terrain: 'caves', sea: '#35465F', sky: '#566A8A', land: '#D2D3BD', edge: '#29384C', emblem: '🌙', light: 'night' },
];

const fartherIslands = [
  {
    light: 'dusk',
    sky: '#F2B297',
    sea: '#755278',
    edge: '#573C61',
    land: '#E0AD8F',
    names: ['Copper Harbour', 'Mangrove Reach', 'Gullwreck Key', 'Ember Bastion',
      'Rosewater Cliffs', 'Lantern Point', 'Saffron Arch', 'Hidden Ember Caves'],
  },
  {
    light: 'night',
    sky: '#3A5274',
    sea: '#284661',
    edge: '#23364C',
    land: '#BFC7AD',
    names: ['Starlight Quay', 'Silver Marsh', 'Phantom Reef', 'North Star Fort',
      'Midnight Headland', 'Polar Beacon', 'Tideglass Arch', 'The Last Grotto'],
  },
] as const;

const encounters = [
  { name: 'Crocodile crossing', briefing: 'Read the clues to pick a channel past the crocodiles.', coat: '#3C8D59', gear: 'crocodile' },
  { name: 'Corsair duel', briefing: 'A corsair captain challenges you to a duel of words.', coat: '#6F405C', gear: 'cutlass' },
  { name: 'Redcoat checkpoint', briefing: 'A British redcoat asks you for the harbour password.', coat: '#BB3D3E', gear: 'lantern' },
  { name: 'French naval patrol', briefing: 'An officer in a blue coat challenges you to decode a signal.', coat: '#345E95', gear: 'flag' },
  { name: 'Portuguese navigator', briefing: 'A navigator offers you a chart if you can read its clues.', coat: '#365B4B', gear: 'chart' },
  { name: 'Spanish fort guard', briefing: 'A guard in a cream coat with red cuffs challenges you at the fort gate.', coat: '#E1CBA8', gear: 'key' },
] as const;

export type Encounter = typeof encounters[number];

export function islandForUnit(index: number): Island {
  const stop = index % islands.length;
  const island = islands[stop];
  const chapter = fartherIslands[Math.floor(index / islands.length) - 1];
  if (!chapter) return island;
  const { names, ...palette } = chapter;
  return { ...island, ...palette, name: names[stop] };
}

export function encounterAfterUnit(index: number): Encounter {
  return encounters[index % encounters.length];
}

export const crossingBadge = (courseId: string, index: number) => `${courseId}:${index}`;

export function crossingExercises(entries: CourseEntry[], scores?: Record<string, number>): ScoredExercise[] {
  return entries.flatMap(entry => scores?.[entry.id] === undefined
    ? []
    : entry.ex.filter((exercise): exercise is ScoredExercise => exercise.type !== 'writing'));
}
