/* global __dirname */
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { localizeEnglishCourse } = require('./grammarfirst-english-course.cjs');

const extraTerms = new Map(readFileSync(join(__dirname, 'grammarfirst-english-terms.tsv'), 'utf8')
  .trim().split('\n').map((line) => line.split('\t')));

// Words whose spelling coincides with German or with an English word in
// the source dictionary. Preserve these in exercise options and pairs.
const targetTerms = {
  de: new Set(),
  en: new Set(['am', 'an', 'in', 'so', 'will', 'was', 'hat', 'man', 'kind', 'die', 'also', 'fast', 'war', 'ring']),
  es: new Set(['a', 'es', 'de', 'mi', 'me', 'no', 'si', 'son', 'van', 'para']),
  fr: new Set(['a', 'du', 'des', 'es', 'en', 'on', 'ton', 'son', 'si', 'aller', 'bien']),
  it: new Set(['a', 'da', 'di', 'in', 'alle', 'alte', 'sono', 'no', 'si']),
  pl: new Set(['a', 'ja', 'nie', 'do', 'to', 'kot', 'tak']),
  gsw: new Set(['a', 'de', 'd', 's', 'en', 'e', 'es', 'ich', 'du', 'er', 'si', 'mir', 'ihr',
    'dir', 'im', 'in', 'was', 'wer', 'wo', 'wie', 'da', 'denn', 'wo?', 'ja', 'nei', 'das',
    'am', 'als', 'will', 'tisch', 'hund', 'chatz', 'nett', 'und', 'für', 'mit']),
  ga: new Set(['a', 'an', 'in', 'is', 'do', 'na', 'ar', 'ag', 'as', 'sa']),
};

// The source used a Standard German comparison column. Keep the Zurich
// German form in its original column and give an English meaning alongside it.
const zurichMeanings = {
  gsw2: ['I am', 'you are', 'he / she / it is', 'we are', 'you are (plural)', 'they are'],
  gsw4: ['I have', 'you have', 'he / she / it has', 'we have', 'you have (plural)', 'they have'],
  gsw5: ['little house', 'kitten', 'little dog', 'bread roll', 'little tree'],
  gsw6: ['I was', 'I went', 'I came', 'I had', 'I saw'],
  gsw7: ['I go', 'you go', 'he / she / it goes', 'we / you / they go'],
  gsw8: ['I come', 'you come', 'he / she / it comes', 'we / you / they come'],
  gsw10: ['not', 'no / not any', 'nothing', 'nobody', 'never'],
  gsw11: ['I / me', 'you / you', 'he / him', 'she / her', 'we / us', 'you / you (plural)', 'they / them'],
  gsw12: ['I see the dog.', 'I buy a table.', 'I take the bag.', 'I see him.'],
  gsw15: ['I go shopping.', 'We go swimming.', 'Are you coming to eat?', 'She goes to work.'],
  gsw16: ['the man who is coming', 'the woman I know', 'the book I am reading', 'the people I work with'],
  gsw17: ['I want', 'you want', 'he / she / it wants', 'we / you / they want'],
  gsw18: ['I can', 'you can', 'he / she / it can', 'we / you / they can', 'could you (polite)'],
  gsw19: ['I must', 'you must', 'he / she / it must', 'we / you / they must'],
  gsw20: ['I was', 'I came', 'I went', 'I saw', 'I took', 'I drank'],
  gsw21: ['to Bern', 'to the cinema', 'at Migros', 'in Zurich', 'to Italy'],
  gsw22: ['I am eating.', 'She is on the phone.', 'We are moving house.', 'Are you asleep right now?'],
  gsw23: ['I would be', 'I would have', 'I would', 'I could', 'I would like'],
  gsw26: ['What?', 'Who?', 'Where?', 'When?', 'Why?', 'Where to?', 'Where from?', 'How much?'],
  gsw27: ['biggest', 'best', 'most', 'favourite', 'oldest'],
  gsw28: ['he is (reported)', 'he has (reported)', 'he is coming (reported)', 'he is going (reported)', 'he can (reported)'],
  gsw29: ['because I have to work', 'that he had to work', 'whether she wants to come', 'if you can'],
  gsw30: ['It is being done.', 'It was done.', 'It must be done.', 'This is how we do it here.'],
};

const zurichUnits = ['First steps', 'Everyday life', 'Essential verbs', 'Cases and sentences',
  'Modal verbs and time', 'Everyday conversation', 'Upper intermediate'];

const zurichEnglishOptions = new Set([
  'gsw1:2', 'gsw5:3', 'gsw-r2:1', 'gsw-r3:1', 'gsw15:2',
  'gsw19:3', 'gsw-r5:1', 'gsw22:4', 'gsw-r6:1', 'gsw-r7:1',
]);
const zurichEnglishPairs = {
  'gsw1:1': 1, 'gsw3:4': 1, 'gsw6:4': 1, 'gsw11:4': 0,
  'gsw19:4': 0, 'gsw26:4': 0, 'gsw27:3': 1, 'gsw28:3': 1, 'gsw29:3': 1, 'gsw30:3': 1,
};
const zurichPromptCopy = {
  'gsw-r3:2': 'Ich fahr mit ___ Tram. (neuter definite article after mit)',
  'gsw12:0': 'Ich gseh ___ Maa. (masculine definite article)',
  'gsw12:1': 'Si hät ___ Bruder. (masculine indefinite article)',
  'gsw12:2': 'Ich nimm ___ Bus. (masculine definite article)',
  'gsw12:4': 'Häsch ___ Brief gläse? (masculine definite article)',
  'gsw13:2': 'Ich hilf ___ Mueter. (feminine definite article, dative)',
  'gsw13:3': 'Mir reded mit ___ Fründin. (feminine indefinite article, dative)',
};
const zurichExplanations = {
  gsw3: { rule: 'The definite articles are de (masculine), d (feminine) and s (neuter). Use en, e and es for the corresponding indefinite articles. The plural definite article is d.' },
  gsw12: { structure: 'De Hund schlaft. · Ich gseh de Hund. · Ich han en Hund. (en = a)' },
  gsw16: {
    tip: 'Use wo with people and things in relative clauses.',
    more: 'Use wo to introduce a relative clause. When a preposition is needed, it can go at the end: S Huus, wo-n-ich drin wohne (the house I live in). The -n- is a linking sound before a vowel.',
  },
  gsw27: { tip: 'Mee means more: Ich möcht mee Ziit. For less, use weniger or wäniger.' },
  gsw29: { more: 'In a Zurich German subordinate clause, the auxiliary can precede the modal and the infinitive: dass si hät wele choo. In the perfect tense, keep the modal in the infinitive: hät müese.' },
  gsw30: { tip: 'Zurich German has no simple past. To say the house was built, use the perfect passive: S Huus isch baut worde.' },
};

function localizeCourse(course, translations) {
  // German already has English teaching copy. Its German prompts are material
  // to read or complete and must not be run through the German glossary.
  if (course.id === 'de') return;

  const translate = (value) => extraTerms.get(value) ?? translations.get(value) ?? value;
  const support = (value) => targetTerms[course.id]?.has(value.toLowerCase()) ? value : translate(value);

  function localizeTable(entry) {
    if (!entry.table) return;
    const comparison = entry.table.head.findIndex((head) => ['Hochdeutsch', 'Standard German'].includes(head));
    const meanings = zurichMeanings[entry.id];
    if (meanings && (comparison === -1 || meanings.length !== entry.table.rows.length)) {
      throw new Error('English comparison column does not match ' + entry.id);
    }

    entry.table.head = entry.table.head.map((head, column) =>
      meanings && column === comparison ? 'English meaning' : translate(head));
    entry.table.rows = entry.table.rows.map((row, index) => row.map((cell, column) => {
      if (meanings && column === comparison) return meanings[index];
      if (course.id === 'gsw') {
        const labelledRow = ['gsw1', 'gsw3', 'gsw13', 'gsw21', 'gsw30'].includes(entry.id);
        return column === 0 && labelledRow || cell === '(keiner)' || cell === 'höflich' ? translate(cell) : cell;
      }
      return support(cell);
    }));
  }

  if (course.id === 'en') {
    localizeEnglishCourse(course, translate, localizeTable);
    return;
  }

  for (const [index, unit] of course.units.entries()) {
    unit.title = course.id === 'gsw' ? `Unit ${index + 1} · ${zurichUnits[index]}` : translate(unit.title);
    for (const entry of [...unit.lessons, ...(unit.reading ? [unit.reading] : [])]) {
      for (const field of ['title', 'rule', 'structure', 'tip', 'more', 'tr']) {
        if (entry[field]) entry[field] = translate(entry[field]);
      }
      if (entry.examples) {
        entry.examples = entry.examples.map(([phrase, gloss]) => [phrase, translate(gloss)]);
      }
      localizeTable(entry);
      if (course.id === 'gsw') Object.assign(entry, zurichExplanations[entry.id]);
      for (const [exerciseIndex, exercise] of entry.ex.entries()) {
        const exerciseId = entry.id + ':' + exerciseIndex;
        const zurich = course.id === 'gsw';
        exercise.prompt = (zurich ? zurichPromptCopy[exerciseId] : undefined) ?? translate(exercise.prompt);
        if (exercise.explain) exercise.explain = translate(exercise.explain);
        if (exercise.type === 'choice') {
          if (!zurich) exercise.options = exercise.options.map(support);
          else if (zurichEnglishOptions.has(exerciseId)) exercise.options = exercise.options.map(translate);
        }
        if (exercise.type === 'match') {
          const englishSide = zurichEnglishPairs[exerciseId];
          exercise.pairs = exercise.pairs.map((pair) => pair.map((value, side) => {
            if (!zurich) return support(value);
            if (side !== englishSide) return value === 'si (sie, Sg.)' ? 'si (she, singular)' : value;
            if (exerciseId === 'gsw3:4' && value === 'das') return 'the (neuter)';
            return translate(value);
          }));
        }
      }
    }
  }
}
module.exports = { localizeCourse };
