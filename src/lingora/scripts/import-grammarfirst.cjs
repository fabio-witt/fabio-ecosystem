/* global __dirname */
// Import course data from the GrammarFirst v73 source folder.
// Usage: node scripts/import-grammarfirst.cjs /path/to/src/grammarfirst
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const ts = require('typescript');

const source = process.argv[2];
if (!source) throw new Error('Pass the path to the GrammarFirst source folder.');

const lesson = (id, title, rule, structure, examples, tip, ex, more, table) => ({
  id, title, rule, structure, examples, tip, ex, more, table,
});
const translations = new Map();

function rememberTranslation(original, english) {
  if (typeof original === 'string' && typeof english === 'string') {
    translations.set(original, english);
  }
  return original;
}

const firstLanguage = (value) => Array.isArray(value) ? rememberTranslation(...value) : value;
const choice = (prompt, options, answer, explain) => ({ type: 'choice', prompt, options, answer, explain });
const build = (prompt, answer, extra, explain) => ({ type: 'build', prompt, answer, extra, explain });
const type = (prompt, accept, explain) => ({ type: 'type', prompt, accept, explain });
const match = (prompt, pairs) => ({ type: 'match', prompt, pairs });
const helpers = {
  ch: choice, bu: build, ty: type, ma: match,
  M: rememberTranslation,
  U: firstLanguage,
  T: (head, ...rows) => ({ head: head.map(firstLanguage), rows: rows.map((row) => row.map(firstLanguage)) }),
  L: (id, title, rule, structure, examples, tip, ex, more, table) =>
    lesson(id, firstLanguage(title), firstLanguage(rule), firstLanguage(structure),
      examples.map(([phrase, original, english]) => [phrase, rememberTranslation(original, english)]), firstLanguage(tip),
      ex, firstLanguage(more), table),
  C: (prompt, options, answer, explain) => choice(firstLanguage(prompt), options.map(firstLanguage), answer, firstLanguage(explain)),
  B: (prompt, answer, extra, explain) => build(firstLanguage(prompt), answer, extra, firstLanguage(explain)),
  Y: (prompt, accept, explain) => type(firstLanguage(prompt), accept, firstLanguage(explain)),
  MA: (pairs) => match('Match the pairs', pairs.map(([a, b]) => [a, firstLanguage(b)])),
};

// Interpret literals and the known data constructors. Never run source scripts.
function parse(file) {
  const ast = ts.createSourceFile(file, readFileSync(join(source, file), 'utf8'), ts.ScriptTarget.Latest, true);
  const values = Object.create(null);
  const exports = Object.create(null);
  const readings = Object.create(null);
  function data(node) {
    if (ts.isStringLiteralLike(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(data);
    if (ts.isObjectLiteralExpression(node)) {
      return Object.fromEntries(node.properties.map((property) => {
        if (!ts.isPropertyAssignment(property)) throw new Error(property.getText(ast));
        return [property.name.text, data(property.initializer)];
      }));
    }
    if (ts.isIdentifier(node) && Object.hasOwn(values, node.text)) return values[node.text];
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && Object.hasOwn(helpers, node.expression.text)) {
      return helpers[node.expression.text](...node.arguments.map(data));
    }
    throw new Error(file + ': unsupported data ' + node.getText(ast).slice(0, 100));
  }
  for (const statement of ast.statements) {
    if (ts.isVariableStatement(statement)) {
      const exported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
      for (const declaration of statement.declarationList.declarations) {
        const name = declaration.name.text;
        const value = declaration.initializer;
        if (!value || ts.isArrowFunction(value)) continue;
        values[name] = data(value);
        if (exported) exports[name] = values[name];
      }
    } else if (ts.isExportAssignment(statement)) {
      exports.default = data(statement.expression);
    } else if (ts.isExpressionStatement(statement)) {
      const call = statement.expression;
      if (file === 'en_extra.js' && ts.isCallExpression(call) &&
          call.expression.getText(ast) === 'Object.assign' && call.arguments[0]?.getText(ast) === 'DICT') {
        for (const [original, english] of Object.entries(data(call.arguments[1]))) {
          rememberTranslation(original, english);
        }
      }
      if (file === 'reading7.js' && ts.isBinaryExpression(call) &&
          ts.isElementAccessExpression(call.left) && call.left.expression.getText(ast) === 'DICT' &&
          call.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        rememberTranslation(data(call.left.argumentExpression), data(call.right));
      }
      if (file === 'reading7.js' && ts.isCallExpression(call) && call.expression.getText(ast) === 'add') {
        readings[call.arguments[0].getText(ast).slice(1)] = data(call.arguments[1]);
      }
    }
  }
  return { exports, readings };
}

const names = {
  de: ['German', '🇩🇪'], en: ['English', '🇬🇧'], es: ['Spanish', '🇪🇸'],
  fr: ['French', '🇫🇷'], ru: ['Russian', '🇷🇺'], pl: ['Polish', '🇵🇱'],
  gsw: ['Zurich German', '🇨🇭'], it: ['Italian', '🇮🇹'], ga: ['Irish', '🇮🇪'],
};
for (const [original, english] of Object.entries(parse('en_dict.js').exports.default)) {
  rememberTranslation(original, english);
}
parse('en_extra.js');

const base = { ...parse('courses1.js').exports, ...parse('courses2.js').exports };
const advanced = parse('more_b2.js').exports;
const { readings } = parse('reading7.js');
const courses = Object.values(base).map(({ id, units }) => {
  const code = id.toUpperCase();
  const extra = advanced[code + '7'];
  const deep = extra ? parse('deep_' + id + '.js').exports : {};
  const [name, flag] = names[id];
  return {
    id, name, flag,
    units: [...units, ...parse('more_' + id + '.js').exports.default, ...(extra ? [extra] : [])]
      .map((unit, index) => {
        const reading = unit.reading ?? deep.READINGS?.[index] ?? (index === 6 ? readings[code] : undefined);
        return {
          title: unit.title,
          lessons: unit.lessons.map((entry) => ({ ...entry, ...deep.DEEP?.[entry.id] })),
          ...(reading ? { reading: { ...reading, id: id + '-r' + (index + 1) } } : {}),
        };
      }),
  };
});

const { localizeCourse } = require('./grammarfirst-english.cjs');
for (const course of courses) localizeCourse(course, translations);

const entries = courses.flatMap((course) => course.units.flatMap(({ lessons, reading }) =>
  reading ? [...lessons, reading] : lessons));
if (courses.length !== 9 || new Set(entries.map(({ id }) => id)).size !== entries.length) {
  throw new Error('Invalid course count or duplicate lesson IDs.');
}
for (const entry of entries) {
  if (!entry.ex?.length) throw new Error('Missing exercises in ' + entry.id);
  for (const exercise of entry.ex) {
    if (!exercise.prompt || (exercise.type === 'choice' && !exercise.options[exercise.answer])) {
      throw new Error('Invalid exercise in ' + entry.id);
    }
  }
}
const lines = courses.map(({ units, ...course }) => {
  const serializedUnits = units.map((unit) => '    ' + JSON.stringify(unit)).join(',\n');
  return '  ' + JSON.stringify(course).slice(0, -1) + ',"units":[\n' + serializedUnits + '\n  ]}';
});
writeFileSync(join(__dirname, '../src/features/learn/grammarfirst.json'), '[\n' + lines.join(',\n') + '\n]\n');
console.log(courses.length + ' courses, ' + entries.length + ' lessons and readings, ' +
  entries.reduce((count, entry) => count + entry.ex.length, 0) + ' exercises.');
