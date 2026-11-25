import type { CefrLevel, Lesson, Reading } from '../catalog';

import { germanUnits } from './de';
import { routineUnits } from './routine';

// Course expansion towards 100 lessons per language (Irish is not extended).
// Every id here must also exist in private.learn_entries (see supabase/migrations).
export type ExpansionUnit = { title: string; level: CefrLevel; lessons: Lesson[]; reading?: Reading };

const base: Partial<Record<string, ExpansionUnit[]>> = {
  de: germanUnits,
};

// Every course also gets the "Time and routine" unit (A2).
export const expansionUnits: Readonly<Partial<Record<string, ExpansionUnit[]>>> = Object.fromEntries(
  [...new Set([...Object.keys(base), ...Object.keys(routineUnits)])]
    .map((courseId) => [courseId, [...(base[courseId] ?? []), ...(routineUnits[courseId] ? [routineUnits[courseId]] : [])]]),
);
