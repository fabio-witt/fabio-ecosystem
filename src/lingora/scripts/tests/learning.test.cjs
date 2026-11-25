const test = require('node:test');
const assert = require('node:assert/strict');
const { load, migrationsText } = require('./load.cjs');

const { courses, cefrLevels, levelForUnit, entriesForUnit } = load('features/learn/catalog.ts');
const { examQuestions, courseLevels, examId, EXAM_QUESTIONS, wordStations } = load('features/learn/exams.ts');
const { buildQuestions, coursePairs, seededRandom } = load('features/game/quiz.ts');
const { recommendStarter } = load('features/onboarding/recommendation.ts');
const { sortThemesForGoal } = load('features/onboarding/goals.ts');

test('every course starts with an A1 alphabet lesson without exercises', () => {
  for (const course of courses) {
    const first = course.units[0];
    assert.equal(levelForUnit(course, 0), 'A1', `${course.id}: first unit must be A1`);
    const lesson = first.lessons[0];
    assert.ok(lesson.alphabet?.length > 15, `${course.id}: first lesson must be the alphabet`);
    assert.equal(lesson.ex.length, 0, `${course.id}: the alphabet has no quiz`);
  }
});

test('units go from easy to hard (CEFR levels never go down)', () => {
  for (const course of courses) {
    let previous = 0;
    course.units.forEach((_, index) => {
      const level = cefrLevels.indexOf(levelForUnit(course, index));
      assert.ok(level >= previous, `${course.id} unit ${index + 1} goes back to an easier level`);
      previous = level;
    });
  }
});

test('lesson ids are unique across all courses', () => {
  const seen = new Set();
  for (const course of courses) for (const unit of course.units) for (const entry of entriesForUnit(unit)) {
    assert.ok(!seen.has(entry.id), `duplicate id ${entry.id}`);
    seen.add(entry.id);
  }
});

test('every level exam has enough questions and is registered on the server', () => {
  const sql = migrationsText();
  for (const course of courses) {
    for (const level of courseLevels(course)) {
      const questions = examQuestions(course, level, 42);
      assert.ok(questions.length >= 12, `${course.id} ${level}: only ${questions.length} exam questions`);
      assert.ok(questions.length <= EXAM_QUESTIONS);
      assert.ok(questions.every((q) => q.exercise.type !== 'writing'), 'writing tasks cannot be scored');
      assert.ok(sql.includes(`'${examId(course.id, level)}'`), `${examId(course.id, level)} missing in migrations`);
    }
  }
});

test('exams are the same for the same seed and change between attempts', () => {
  const course = courses.find((item) => item.id === 'es');
  const a = examQuestions(course, 'A1', 7).map((q) => q.exercise.prompt).join('|');
  const b = examQuestions(course, 'A1', 7).map((q) => q.exercise.prompt).join('|');
  const c = examQuestions(course, 'A1', 8).map((q) => q.exercise.prompt).join('|');
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test('word stations have enough translated words for the trainer', () => {
  for (const course of courses) {
    for (const [unit, topic] of wordStations(course)) {
      const translated = topic.words.filter(([word, meaning]) => meaning && meaning !== word);
      assert.ok(translated.length >= 4, `${course.id} unit ${unit}: station "${topic.title}" has too few words`);
    }
  }
});

test('quiz questions always contain the right answer exactly once', () => {
  for (const course of courses) {
    const pairs = coursePairs(course);
    if (pairs.length < 4) continue;
    for (const question of buildQuestions(pairs, 10, 3)) {
      assert.equal(question.options.filter((option) => option === question.answer).length, 1, `${course.id}: ${question.pair.word}`);
    }
  }
});

test('the seeded random generator is deterministic and stays between 0 and 1', () => {
  const a = seededRandom(5); const b = seededRandom(5);
  for (let i = 0; i < 100; i++) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1);
  }
});

test('learning languages map to the right course', () => {
  assert.equal(recommendStarter({ name: 'Indonesian', language_code: 'id' }, 'A1')?.course.id, 'id');
  assert.equal(recommendStarter({ name: 'Swiss German' }, 'A1')?.course.id, 'gsw');
  assert.equal(recommendStarter({ name: 'Croatian', language_code: 'sh' }, 'A1')?.course.id, 'sh');
  assert.equal(recommendStarter({ name: 'Arabic', language_code: 'ar' }, 'A1'), undefined);
});

test('a learning goal moves matching vocabulary themes to the front', () => {
  const themes = [{ title: 'Food' }, { title: 'Work and office' }, { title: 'Travel and transport' }];
  assert.equal(sortThemesForGoal(themes, 'Travel')[0].title, 'Travel and transport');
  assert.equal(sortThemesForGoal(themes, null)[0].title, 'Food');
});

test('FSRS spaces reviews further apart after each success and resets after a lapse', () => {
  const { fsrsReview } = load('features/learn/fsrs.ts');
  const day = 86_400_000;
  let now = 0;
  let card = fsrsReview(undefined, true, now);
  const intervals = [card.days];
  for (let i = 0; i < 5; i++) {
    now += card.days * day;
    card = fsrsReview(card, true, now);
    intervals.push(card.days);
  }
  for (let i = 1; i < intervals.length; i++) assert.ok(intervals[i] >= intervals[i - 1], `intervals shrink: ${intervals}`);
  assert.ok(intervals[intervals.length - 1] > 30, `long-term interval too short: ${intervals}`);
  const lapse = fsrsReview(card, false, now + card.days * day);
  assert.equal(lapse.days, 0);
  assert.ok(lapse.s < card.s);
});

test('monthly challenges count only days of the current month', () => {
  const { monthlyChallenges } = load('features/game/challenges.ts');
  const day = { lessons: 2, perfect: 1, words: 10, mistakes: 0, xp: 50, sprints: 0 };
  const list = monthlyChallenges({ '2026-11-01': day, '2026-11-02': day, '2026-10-31': day }, '2026-11');
  assert.equal(list.find((c) => c.id.endsWith('days15')).value, 2);
  assert.equal(list.find((c) => c.id.endsWith('xp1000')).value, 100);
});

test('auto reminders use the hour you learn most often', () => {
  const { usualLearningHour } = load('features/notifications/usual-hour.ts');
  assert.equal(usualLearningHour([7, 19, 19, 20, 19]), 19);
  assert.equal(usualLearningHour([]), 19);
});

test('player levels, divisions, chests, season tiers and crowns follow the rules', () => {
  const p = load('features/game/progression.ts');
  assert.equal(p.levelFromXp(0).level, 1);
  assert.equal(p.levelFromXp(49).level, 1);
  assert.equal(p.levelFromXp(50).level, 2);
  assert.equal(p.levelFromXp(2250).level, 10);
  assert.equal(p.divisionFor(0).id, 'bronze');
  assert.equal(p.divisionFor(650).id, 'sapphire');
  assert.equal(p.divisionFor(5000).next, undefined);
  const today = new Date(2026, 10, 18);
  assert.equal(p.dailyChestState(undefined, 0, today).day, 1);
  assert.equal(p.dailyChestState('2026-11-17', 3, today).day, 4);
  assert.equal(p.dailyChestState('2026-11-17', 7, today).day, 1, 'after day 7 the calendar starts again');
  assert.equal(p.dailyChestState('2026-11-15', 5, today).day, 1, 'a missed day resets');
  assert.ok(p.dailyChestState('2026-11-18', 2, today).claimedToday);
  assert.deepEqual([0, 1, 2, 4, 7, 10, 30].map(p.crownsFor), [0, 1, 2, 3, 4, 5, 5]);
  assert.equal(p.tierReward(5, false), 50);
  assert.equal(p.tierReward(3, true), 26);
  const season = p.currentSeason(new Date(2026, 10, 18));
  assert.ok(season.daysLeft > 0 && season.daysLeft <= 28);
});

test('free plan: A1 and repeats are free, 3 new lessons a day above A1, gems add up to 2 more', () => {
  const { lessonAccess, countFreeLesson, buyExtraLesson, lessonsLeft } = load('features/plus/limits.ts');
  const base = { completed: false, isPlus: false, enforced: true, today: '2026-11-18' };
  assert.equal(lessonAccess({ ...base, id: 'a', level: 'A1', freeDay: undefined }).reason, 'free-level');
  assert.equal(lessonAccess({ ...base, id: 'a', level: 'B1', freeDay: undefined, isPlus: true }).allowed, true);
  assert.equal(lessonAccess({ ...base, id: 'a', level: 'B1', freeDay: undefined, enforced: false }).allowed, true);
  let day;
  for (const id of ['x', 'y', 'z']) {
    assert.equal(lessonAccess({ ...base, id, level: 'A2', freeDay: day }).allowed, true);
    day = countFreeLesson(day, base.today, id);
  }
  assert.equal(lessonsLeft(day, base.today), 0);
  assert.equal(lessonAccess({ ...base, id: 'x', level: 'A2', freeDay: day }).reason, 'started');
  assert.equal(lessonAccess({ ...base, id: 'w', level: 'A2', freeDay: day, completed: true }).reason, 'repeat');
  const blocked = lessonAccess({ ...base, id: 'w', level: 'A2', freeDay: day });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.canBuy, true);
  day = buyExtraLesson(day, base.today);
  assert.equal(lessonAccess({ ...base, id: 'w', level: 'A2', freeDay: day }).allowed, true);
  day = buyExtraLesson(countFreeLesson(day, base.today, 'w'), base.today);
  assert.equal(buyExtraLesson(day, base.today), null);
  // A new day resets everything.
  assert.equal(lessonsLeft(day, '2026-11-19'), 3);
});

test('lesson practice sets add exercises from the examples, easy first, keeping sources', () => {
  const { practiceSet } = load('features/learn/practice-set.ts');
  let grew = 0;
  for (const course of courses) {
    for (const unit of course.units) {
      for (const entry of entriesForUnit(unit)) {
        const set = practiceSet(entry);
        // Every original exercise is still there exactly once.
        const sources = set.filter((item) => item.source !== undefined).map((item) => item.source).sort((a, b) => a - b);
        assert.deepEqual(sources, entry.ex.map((_, index) => index), `${entry.id}: originals kept`);
        for (const item of set.filter((one) => one.generated)) {
          const ex = item.exercise;
          if (ex.type === 'choice') {
            assert.ok(ex.audio && ex.options[ex.answer], `${entry.id}: listening answer`);
            assert.equal(new Set(ex.options).size, ex.options.length, `${entry.id}: listening options unique`);
          }
          if (ex.type === 'build') assert.ok(ex.extra.every((word) => !ex.answer.split(/\s+/).includes(word)), `${entry.id}: build extras`);
        }
        if (set.length > entry.ex.length) grew++;
        // Writing always stays last.
        const writing = set.findIndex((item) => item.exercise.type === 'writing');
        if (writing >= 0) assert.equal(set.slice(writing).every((item) => item.exercise.type === 'writing'), true);
      }
    }
  }
  assert.ok(grew > 300, `most lessons get extra practice (got ${grew})`);
});

test('word stations reach the upper levels too', () => {
  for (const course of courses.filter((item) => ['de', 'es', 'fr'].includes(item.id))) {
    const levels = new Set([...wordStations(course).keys()].map((index) => levelForUnit(course, index)));
    assert.ok(levels.has('B2') || levels.has('C1'), `${course.id}: stations above B1`);
  }
});

test('hard mode adds a dictation exercise that accepts the sentence with or without punctuation', () => {
  const { practiceSet } = load('features/learn/practice-set.ts');
  const lesson = courses.find((course) => course.id === 'es').units.flatMap((unit) => unit.lessons).find((item) => item.id === 'es5');
  const normal = practiceSet(lesson);
  const hard = practiceSet(lesson, { dictation: true });
  const dictation = hard.find((item) => item.generated === 'dictation');
  assert.equal(hard.length, normal.length + 1);
  assert.ok(dictation && dictation.exercise.type === 'type' && dictation.exercise.audio);
  assert.ok(dictation.exercise.accept.some((answer) => !/[.!?]$/.test(answer)));
});
