// The original English course was written for German speakers.
const lessonCopy = {
  en1: ['The present tense of “to be” has three forms: am, is and are.', 'Use a or an before a singular profession: She is a doctor.', 'Contractions are common in conversation: I’m, you’re, he’s, we’re and they’re. Negatives include I’m not, you aren’t and he isn’t. Use be for age and states: I am 30; I’m hungry.'],
  en2: ['Use an before a vowel sound and a before a consonant sound.', 'Listen to the first sound: an honest man, but a European city.', 'The spelling can be misleading: an hour starts with a vowel sound, while a university starts with a /y/ sound. Use neither article with plurals or uncountable nouns: I like music.'],
  en3: ['In the simple present, add -s to regular verbs after he, she or it. Use this tense for habits and facts.', 'After -o, -s, -sh, -ch or -x, add -es. A consonant followed by y changes to -ies.', 'Compare watches, goes and studies with plays, where a vowel comes before y. The verb have becomes has: She has a bike.'],
  en4: ['Use do or does for simple-present questions and negatives. After does, use the base form of the main verb.', 'The third-person ending appears only once: does + work.', 'Short answers use the auxiliary: Yes, I do. No, she doesn’t. Be and can form their own questions: Are you ready? Can you swim?'],
  en5: ['Use am, is or are plus an -ing verb for an action happening now.', 'Look for clues such as now, right now, at the moment or look!', 'The present continuous also describes temporary situations and arrangements: I’m working from home this week. I’m meeting Tom tomorrow. State verbs such as know and want usually take the simple form.'],
  en6: ['Regular simple-past verbs add -ed. Many common verbs have irregular past forms.', 'After did, use the base form: Did you go?', 'The -ed ending sounds like /t/ in worked, /d/ in played and /ɪd/ in wanted. Use the simple past for finished events, often with a finished time: yesterday, last week or two days ago.'],
  en7: ['Many common verbs have irregular simple-past forms. The same form is used for all persons.', 'Learn the most common irregular forms first.', 'Learn related forms together: buy → bought, bring → brought, think → thought, catch → caught. The third form is the past participle, used in forms such as have gone.'],
  en8: ['Use did or didn’t plus the base verb for simple-past questions and negatives.', 'Did already marks the past: Did you go?', 'The main verb keeps its base form after did: I didn’t see him. With was and were, form the question or negative directly: Were you at home? I wasn’t there.'],
  en9: ['Most plurals take -s. Add -es after s, sh, ch or x, and change consonant + y to -ies.', 'Keep y after a vowel: day → days, boy → boys.', 'Some plurals change more: knife → knives, child → children and foot → feet. Information, advice and furniture are uncountable.'],
  en10: ['Use this and these for things near the speaker, that and those for things farther away.', 'On the phone, introduce yourself with “This is …”.', 'Use this or that for one thing and these or those for several. The same distinction can apply to time: this week, that day.'],
  en11: ['Show possession with my, your, his, her, its, our or their, or add an apostrophe to a noun.', 'Its shows possession. It’s means it is or it has.', 'His and her depend on the owner: his mother, her father. Add ’s to a singular noun or irregular plural. Add just an apostrophe to a plural ending in s: my parents’ house.'],
  en12: ['Use some in affirmative sentences, offers and requests. Use any in most questions and negatives.', 'A polite request can use some: Can I have some water?', 'The pattern also applies to compounds: I saw someone. Did you see anyone? I didn’t see anyone.'],
  en13: ['Use many with plural countable nouns and much with uncountable nouns. A lot of works with both.', 'Money, water, time, information, advice and furniture are usually uncountable.', 'Much and many are common in questions and negatives. A lot of often sounds more natural in an affirmative sentence: I have a lot of time.'],
  en14: ['Add -er to most short adjectives. Use more with most long adjectives. Use than to introduce the comparison.', 'Use than for comparisons and as … as for equality.', 'After a short stressed vowel, double the final consonant in words such as big → bigger. Change consonant + y to -ier: easy → easier. Good and bad become better and worse.'],
  en15: ['Use the plus an -est form for most short adjectives, and the most plus the adjective for most long ones.', 'Use in with places: the biggest city in Switzerland.', 'Use of for members of a group: the best of all. Irregular forms include the best and the worst. Use the present perfect in examples like the best film I have ever seen.'],
  en16: ['Use at for clock times, on for days and dates, and in for months, years and longer periods.', 'Use in the morning but on Monday morning.', 'Use no preposition with today, tomorrow, last week, next year or every day. Common fixed phrases include at night and at noon.'],
  en17: ['Use have or has plus the past participle for experiences, ongoing situations and past actions with a present result.', 'Common clues include ever, never, already, yet, just, since and for.', 'The present perfect connects past and present: I’ve lost my keys. Have you ever been to Japan? I’ve lived here for five years.'],
  en18: ['Use the simple past with a finished time. Use the present perfect when the time is unspecified or continues up to now.', 'Use since for a starting point and for for a duration.', 'Compare I lived there in 2020 with I have lived here since 2020. Use the simple past with finished-time clues such as yesterday or two days ago.'],
  en19: ['Use be going to plus the base verb for an existing plan or a prediction based on present evidence.', 'In informal speech, going to may sound like gonna.', 'Compare a plan, I’m going to study medicine, with a prediction from evidence, Look at the clouds: it’s going to rain.'],
  en20: ['Use will plus the base verb for decisions made now, promises, offers and general predictions.', 'Will is the same for every person. The negative is won’t.', 'Common contractions are I’ll and she’ll. Compare I’ll help you, an offer, with I think it will rain, a prediction.'],
  en21: ['Use can for ability or permission. Could can express past ability or a polite request.', 'Use a base verb without to after can or could.', 'Could you help me? is usually more polite than Can you help me? Use be able to where can has no form: I will be able to come.'],
  en22: ['Must and have to express obligation. Mustn’t expresses prohibition, while don’t have to means there is no obligation.', 'For past obligation, use had to.', 'Must can express a duty the speaker feels. Have to often describes an external requirement: I have to wear a uniform.'],
  en23: ['For a real future possibility, use if plus the simple present and will plus a base verb in the result clause.', 'Put a comma after the if-clause when it comes first.', 'Keep will out of the condition in this pattern: If it rains, I’ll stay home. A similar tense pattern follows when, as soon as and unless.'],
  en24: ['For an unreal or unlikely situation, use if plus the simple past and would plus the base verb.', 'Use would in the result clause. If I were you is a common form.', 'Were is usual in hypothetical expressions such as If I were you. The past form here describes distance from reality, rather than past time.'],
  en25: ['Form the passive with be plus the past participle to focus on the action or what receives it.', 'The tense is shown by the form of be: is made, was made, will be made.', 'Add the agent with by when it matters: The book was written by Orwell. Leave it out when it is unknown or unimportant: Mistakes were made.'],
  en26: ['Use who for people, which for things or animals, and that for either in a defining relative clause.', 'A defining relative clause usually has no comma.', 'You can omit the object pronoun: the book I read. Keep a subject pronoun: the man who lives here. Whose shows possession: the woman whose car was stolen.'],
  en27: ['Use was or were plus an -ing verb for an action that was in progress in the past.', 'A shorter event in the simple past can interrupt it: While I was cooking, he arrived.', 'The past continuous sets the scene: The sun was shining. The simple past moves the story forward: Suddenly, a car stopped. State verbs such as know and want usually take the simple form.'],
  en28: ['Use have or has been plus an -ing verb to emphasise the duration of an ongoing or recently finished action.', 'Use since for a starting point and for for a duration.', 'I’ve written three emails focuses on the result. I’ve been writing emails all morning focuses on the activity. State verbs usually take the simple form: I’ve known her for years.'],
  en29: ['For an unreal past, use if plus the past perfect and would have plus a past participle in the result.', 'Use would have in the result clause: If I had known, I would have come.', 'Compare If it rains, I’ll stay; If it rained, I would stay; and If it had rained, I would have stayed. Would have is often contracted to would’ve.'],
  en30: ['In reported speech, tenses often shift back after a past reporting verb. Pronouns and time references can change too.', 'Use said with the reported words and told with a person: She said that …; She told me that …', 'Reported questions use statement word order: “Where do you live?” → She asked where I lived. Today can become that day and tomorrow can become the next day. General truths can keep their tense.'],
};

const titleCopy = {
  en2: 'a or an', en7: 'Irregular past forms', en8: 'did and didn’t',
  en11: 'Possessives: my and ’s', en12: 'some and any', en16: 'in, on and at (time)',
  en18: 'Present perfect or simple past?', en21: 'can and could',
  en22: 'must and have to', en25: 'The passive voice',
};

const unitCopy = ['Basics', 'Questions and tenses', 'Past forms and nouns',
  'Quantity and comparison', 'Tenses', 'Connecting sentences', 'Upper intermediate'];

// These tasks previously asked learners to translate a German sentence. Give
// the meaning in English and test the same target construction and answer.
const buildPrompts = {
  en1: 'Say that a woman works as a teacher. Start with She.',
  en3: 'Say where a man lives. Use he, live and Bern.',
  en4: 'Ask someone whether they like pizza. Start with Do.',
  en5: 'Say that you and someone else are waiting at this moment.',
  en6: 'Say what a man did the day before today. Use he and work.',
  en7: 'Say that you and your group had no time. Start with We.',
  en8: 'Say that you were unaware of it. Start with I and use didn’t.',
  en10: 'Say that the shoes near you are new. Start with These.',
  en12: 'Say that you have no time. Start with I and use any.',
  en14: 'Compare her age to yours. Start with She and use old.',
  en17: 'Ask if someone has finished their homework. Start with Have.',
  en19: 'Describe her plan to phone him. Use going to and call.',
  en20: 'Make a promise that you will arrive as scheduled. Use promise and on time.',
  en21: 'Ask if someone is able to come the day after today. Start with Can.',
  en22: 'Say that a man is under no obligation to come. Start with He.',
  en23: 'Say you will help the other person if you have time. Start with If.',
  en24: 'Say that you would come if you were able to. Start with I.',
  en25: 'Make “He wrote the book” passive. Start with The book.',
  en27: 'Describe ongoing rain interrupted by your departure. Use when and leave the house.',
  en28: 'Say how long you have been studying English. Use learn and a year.',
  en29: 'Say that knowing it would have changed your decision to come. Start with If I.',
  en30: 'Report her question: “Do you have time?” Start with She asked.',
};

const promptCopy = {
  en1: { 3: 'What is the contraction of “I am”?' },
  en2: { 4: 'Complete the sentence: I have ___ idea.' },
  en3: { 4: 'Which sentence is correct?' },
  en4: { 3: 'Make it negative: I like tea → I ___ like tea.' },
  en6: { 3: 'Match the base forms to their past forms.' },
  'en-r2': { 1: 'What does “is working” mean here?' },
  en7: { 4: 'Match the base forms to their past forms.' },
  en10: { 2: '___ glasses are mine. (over there)', 3: '___ is my sister. (nearby, singular)' },
  en11: { 0: 'Maria and ___ brother. (Maria’s brother)', 2: 'the ___ room (the children’s room)', 3: 'This is ___ car. (Tom owns the car)', 4: 'Match the pronouns to their possessive forms.' },
  'en-r3': { 1: '“Bought” is the past form of …' },
  en13: { 3: 'She has ___ friends. (many, three words)', 4: 'Match the nouns to much or many.' },
  en14: { 2: 'Write the comparative of hot.' },
  en15: { 4: 'Match the adjectives to their superlative forms.' },
  en16: { 4: 'Match each time expression to its preposition.' },
  'en-r4': { 1: 'Why does the text say “not many cars”?' },
  en17: { 4: 'Match the verbs to their past participles.' },
  en21: { 2: '___ you pass the salt, please? (polite)', 3: 'I ___ speak Russian. (negative ability)' },
  'en-r5': { 1: 'What does “I’m going to travel” express?' },
  en24: { 4: 'Which sentence uses the second conditional?' },
  en26: { 4: 'Match the nouns to who or which.' },
  'en-r7': { 1: 'Which construction is used in “If I had taken …, I would never have met …”?' },
};

const readingOptions = {
  'en-r2': { 1: ['right now or this week', 'every day', 'yesterday'] },
  'en-r4': { 1: ['cars are countable', 'cars are uncountable', 'cars has no singular form'] },
  'en-r5': { 1: ['a plan', 'a decision made on the spot', 'a past event'] },
  'en-r7': { 1: ['Third conditional', 'Second conditional', 'Reported speech'] },
};

const paraphrasePairs = {
  en27: ['was in the middle of reading', 'were asleep', 'made a ringing sound', 'during the time that'],
  en28: ['a duration of two years', 'from Monday until now', 'throughout the day', 'a question about duration'],
  en29: ['knew before the event', 'an imagined past arrival', 'did not miss in the imagined past', 'an imagined past state'],
};

const termTranslations = [
  [/\+ Grundform/g, '+ base verb'], [/Konsonantlaut/g, 'consonant sound'],
  [/Vokallaut/g, 'vowel sound'], [/\bSubjekt\b/g, 'subject'],
  [/\(Plural auf -s: nur Apostroph\)/g, '(plural ending in -s: apostrophe only)'],
  [/\(today, bis jetzt\)/g, '(today, up to now)'], [/\(seit Zeitpunkt\)/g, '(starting point)'],
  [/\(seit Zeitraum\)/g, '(duration)'], [/\bPartizip\b/g, 'past participle'],
  [/\(ohne Pronomen\)/g, '(without the pronoun)'],
];

function localizeEnglishCourse(course, translate, localizeTable) {
  for (const [index, unit] of course.units.entries()) {
    unit.title = `Unit ${index + 1} · ${unitCopy[index]}`;
    for (const entry of [...unit.lessons, ...(unit.reading ? [unit.reading] : [])]) {
      const copy = lessonCopy[entry.id];
      if (copy) {
        [entry.rule, entry.tip, entry.more] = copy;
        entry.title = titleCopy[entry.id] ?? translate(entry.title);
        entry.structure = termTranslations.reduce((text, [pattern, replacement]) =>
          text.replace(pattern, replacement), entry.structure);
        entry.examples = entry.examples.map(([phrase]) => [phrase]);
        localizeTable(entry);
      } else {
        // A translation into English would duplicate this English reading.
        delete entry.tr;
      }
      for (const [index, exercise] of entry.ex.entries()) {
        const buildPrompt = exercise.type === 'build' ? buildPrompts[entry.id] : undefined;
        exercise.prompt = promptCopy[entry.id]?.[index] ?? buildPrompt ?? translate(exercise.prompt);
        if (readingOptions[entry.id]?.[index]) exercise.options = readingOptions[entry.id][index];
        if (exercise.type === 'match' && paraphrasePairs[entry.id]) {
          exercise.prompt = 'Match each phrase to its meaning.';
          exercise.pairs = exercise.pairs.map(([phrase], pairIndex) =>
            [phrase, paraphrasePairs[entry.id][pairIndex]]);
        }
        if (exercise.explain) {
          exercise.explain = exerciseFeedback[entry.id]?.[index] ?? copy?.[0] ?? translate(exercise.explain);
        }
      }
    }
  }
}

const exerciseFeedback = {
  en1: { 1: 'Use is with my brother. In English, use be to give someone’s age.', 2: 'Use a before the profession: a teacher.' },
  en2: { 1: 'University starts with a consonant sound, so use a.', 2: 'The h in hour is silent, so use an.' },
  en4: { 1: 'After doesn’t, use the base verb like.', 4: 'Does carries the third-person ending, so use play.' },
  en5: { 1: 'Every day describes a habit. Use the simple present.', 3: 'Drop the silent e before adding -ing: write → writing.' },
  en6: { 1: 'After did, use the base form read.' },
  en15: { 2: 'The irregular sequence is good → better → best.' },
  'en-r2': { 1: 'The present continuous describes the temporary situation.' },
  'en-r3': { 2: 'Use did plus the subject and the base verb.' },
  'en-r4': { 1: 'Use many with plural countable nouns.', 2: 'Use on with days of the week.' },
  'en-r5': { 1: 'Going to can express an existing plan.' },
  'en-r6': { 2: 'Don’t have to means that there is no obligation.' },
};

module.exports = { localizeEnglishCourse };
