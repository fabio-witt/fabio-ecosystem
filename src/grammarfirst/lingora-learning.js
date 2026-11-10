import courses from "./lingora-courses.json";

export const workspaceUrl = "/grammarfirst/lingora/";
const catalog = new Map(courses.map(course => [course.id, course]));
const sharedLessons = new Set();
const sharedReadings = new Set();

for (const course of courses) {
  for (const unit of course.units) {
    unit.lessons.forEach(lesson => sharedLessons.add(lesson.id));
    if (unit.reading) sharedReadings.add(unit.reading.id);
  }
}

export function appendLingoraUnits(course) {
  if (course.id === "ga") return;
  course.units.forEach((unit, originalIndex) => { unit.originalIndex = originalIndex; });
  const ids = new Set(course.units.flatMap(unit => [
    ...unit.lessons.map(lesson => lesson.id), unit.reading?.id,
  ]));
  for (const unit of catalog.get(course.id)?.units ?? []) {
    const lessons = unit.lessons.filter(lesson => !ids.has(lesson.id));
    const reading = unit.reading && !ids.has(unit.reading.id) ? unit.reading : undefined;
    if (lessons.length || reading) course.units.push({ ...unit, lessons, reading });
  }
  const levels = ["A1", "A1", "A2", "A2", "B1", "B1", "B2"];
  const level = unit => unit.level || levels[unit.originalIndex] || "B2";
  course.units.sort((a, b) => level(a).localeCompare(level(b)));
}

export function isSharedEntry(id) {
  return sharedLessons.has(id) || sharedReadings.has(id);
}

export function scoresFromDevice(state) {
  return Object.fromEntries([
    ...Object.entries(state.done).filter(([id]) => sharedLessons.has(id)).map(([id, result]) => [id, result.best]),
    ...Object.keys(state.readDone).filter(id => sharedReadings.has(id)).map(id => [id, 0]),
  ]);
}

export function mergeProgress(state, rows) {
  if (!rows?.length) return state;
  const done = { ...state.done };
  const readDone = { ...state.readDone };
  for (const row of rows) {
    const id = row.entry_id;
    if (sharedReadings.has(id)) readDone[id] = true;
    if (sharedLessons.has(id)) done[id] = {
      best: Math.max(done[id]?.best ?? 0, row.best_score),
      crown: Math.max(done[id]?.crown ?? 0, row.stars),
    };
  }
  return { ...state, done, readDone };
}
