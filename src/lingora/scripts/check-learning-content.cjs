const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
require.extensions['.ts'] = (module, file) => {
  const source = fs.readFileSync(file, 'utf8').replace(/(['"])@\/([^'"]+)\1/g,
    (_match, _quote, suffix) => JSON.stringify(path.join(root, 'src', suffix)));
  const result = ts.transpileModule(source, {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  module._compile(result.outputText, file);
};

const { courses, entriesForUnit, levelForUnit, normalizeAnswer } = require('../src/features/learn/catalog.ts');
const errors = [];
const warnings = [];
function check(condition, message) { if (!condition) errors.push(message); }
const text = value => typeof value === 'string' && value.trim().length > 0;
const entryIds = new Set();
const courseIds = new Set();
let exerciseCount = 0;
const positions = new Map();
const optionCounts = new Map();
const migrations = fs.readdirSync(path.join(root, 'supabase/migrations')).filter(file => file.endsWith('.sql'));
const registered = new Map();
function quotedValues(source) {
  return [...source.matchAll(/'([^']+)'/g)].map(match => match[1]);
}
for (const file of migrations) {
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations', file), 'utf8');
  for (const insert of sql.matchAll(/insert into private\.learn_entries\s*\(id,\s*course_id\)([\s\S]*?);/gi)) {
    const body = insert[1].replace(/on conflict[\s\S]*$/i, '').trim();
    if (/^values\b/i.test(body)) {
      for (const row of body.matchAll(/\('([^']+)',\s*'([^']+)'\)/g)) registered.set(row[1], row[2]);
      continue;
    }
    for (const clause of body.split(/\s+union all\s+/i)) {
      const series = clause.match(/select c \|\| (?:'([^']*)' \|\| )?n, c from unnest\(array\[([^\]]+)\]\) c, generate_series\((\d+),\s*(\d+)\) n/i);
      const literalSeries = clause.match(/select '([^']+)' \|\| n, '([^']+)' from generate_series\((\d+),\s*(\d+)\) n/i);
      const suffix = clause.match(/select c \|\| '([^']+)', c from unnest\(array\[([^\]]+)\]\) c/i);
      const named = clause.match(/select id, split_part\(id, '-', 1\) from unnest\(array\[([\s\S]+)\]\) id/i);
      if (series) {
        for (const code of quotedValues(series[2])) {
          for (let n = Number(series[3]); n <= Number(series[4]); n++) registered.set(code + (series[1] || '') + n, code);
        }
      } else if (literalSeries) {
        for (let n = Number(literalSeries[3]); n <= Number(literalSeries[4]); n++) registered.set(literalSeries[1] + n, literalSeries[2]);
      } else if (suffix) {
        for (const code of quotedValues(suffix[2])) registered.set(code + suffix[1], code);
      } else if (named) {
        for (const id of quotedValues(named[1])) registered.set(id, id.split('-')[0]);
      } else {
        errors.push('Unsupported lesson registration in ' + file + '. Extend the content checker for this SQL format.');
      }
    }
  }
}
for (const course of courses) {
  check(!courseIds.has(course.id), 'Duplicate course ID: ' + course.id);
  courseIds.add(course.id);
  course.units.forEach((unit, index) => {
    try { levelForUnit(course, index); } catch (error) { errors.push(error.message); }
    for (const entry of entriesForUnit(unit)) {
      const location = course.id + '/' + entry.id;
      check(text(entry.id) && !entryIds.has(entry.id), location + ': missing or duplicate lesson ID.');
      entryIds.add(entry.id);
      check(registered.get(entry.id) === course.id, location + ': no matching registration in Supabase migrations.');
      check(text(entry.title), location + ': missing title.');
      check(entry.ex.length > 0 || (Array.isArray(entry.alphabet) && entry.alphabet.length > 0), location + ': no exercises.');
      if ('text' in entry) check(text(entry.text), location + ': missing passage.');
      entry.ex.forEach((exercise, i) => {
        exerciseCount++;
        const here = location + ' question ' + (i + 1);
        check(text(exercise.prompt), here + ': missing prompt.');
        switch (exercise.type) {
          case 'choice': {
            const validOptions = Array.isArray(exercise.options) && exercise.options.length >= 2 && exercise.options.every(text);
            check(validOptions, here + ': invalid choices.');
            if (!validOptions) break;
            check(Number.isInteger(exercise.answer) && exercise.answer >= 0 && exercise.answer < exercise.options.length, here + ': invalid answer index.');
            check(new Set(exercise.options.map(normalizeAnswer)).size === exercise.options.length, here + ': duplicate choices.');
            positions.set(exercise.answer, (positions.get(exercise.answer) ?? 0) + 1);
            const counts = optionCounts.get(exercise.options.length) ?? Array(exercise.options.length).fill(0);
            counts[exercise.answer] = (counts[exercise.answer] ?? 0) + 1;
            optionCounts.set(exercise.options.length, counts);
            break;
          }
          case 'build':
            check(text(exercise.answer) && Array.isArray(exercise.extra), here + ': invalid word builder.');
            break;
          case 'type':
            check(Array.isArray(exercise.accept) && exercise.accept.length > 0 && exercise.accept.every(text), here + ': no accepted answer.');
            break;
          case 'match':
            check(Array.isArray(exercise.pairs) && exercise.pairs.length >= 2
              && exercise.pairs.every(pair => pair.length === 2 && pair.every(text)), here + ': invalid matching pairs.');
            break;
          case 'writing':
            check(text(exercise.model) && exercise.checklist.length > 0 && exercise.checklist.every(text), here + ': missing writing guidance.');
            break;
          default:
            errors.push(here + ': unsupported exercise type ' + exercise.type);
        }
      });
    }
  });
}
for (const [length, counts] of optionCounts) {
  const total = counts.reduce((sum, value) => sum + value, 0);
  if (total >= 10 && counts.some(count => count < total / length * 0.5)) {
    warnings.push('Source answer positions for ' + length + ' choices are uneven: ' + counts.join(', ')
      + '. ExerciseView shuffles choices before displaying them.');
  }
}
for (const warning of warnings) console.warn('Warning: ' + warning);
if (errors.length) {
  errors.forEach(error => console.error(error));
  process.exitCode = 1;
} else {
  console.log('Learning content passed: ' + courses.length + ' courses, ' + entryIds.size + ' entries, ' + exerciseCount + ' exercises.');
  console.log('Supabase registration checked against local migration files. A deployed database requires its migrations to be applied.');
  console.log('Source answer indices: ' + JSON.stringify(Object.fromEntries(positions)));
}
