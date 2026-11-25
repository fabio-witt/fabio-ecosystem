const DAY = 86_400_000;
const MONDAY = Date.UTC(2026, 0, 5);

const activities = [
  {
    id: 'routine', title: 'A small change',
    task: 'Describe one change you made to your routine. Say why it helped and ask the club for one suggestion.',
    english: 'I started walking after lunch because I needed a break. What helps you recharge?',
    german: 'Ich gehe nach dem Mittagessen spazieren, weil ich eine Pause brauche. Was hilft dir, neue Energie zu tanken?',
    phrases: ['because', 'What helps you …?'], germanPhrases: ['weil', 'Was hilft dir, …?'],
  },
  {
    id: 'recommend', title: 'Recommend a place',
    task: 'Recommend a place to a first-time visitor. Give one reason and mention something to keep in mind.',
    english: 'I’d recommend the market because it’s easy to reach. Keep in mind that it closes early.',
    german: 'Ich würde den Markt empfehlen, weil er gut erreichbar ist. Denk daran, dass er früh schliesst.',
    phrases: ['I’d recommend …', 'Keep in mind that …'], germanPhrases: ['Ich würde … empfehlen', 'Denk daran, dass …'],
  },
  {
    id: 'reschedule', title: 'Find a new time',
    task: 'Politely explain why you need to change an appointment. Suggest two times and ask which works better.',
    english: 'Could we move our meeting? I’m free on Tuesday or Thursday. Which works better for you?',
    german: 'Könnten wir unser Treffen verschieben? Ich habe am Dienstag oder Donnerstag Zeit. Was passt dir besser?',
    phrases: ['Could we …?', 'Which works better for you?'], germanPhrases: ['Könnten wir …?', 'Was passt dir besser?'],
  },
  {
    id: 'compare', title: 'Compare two choices',
    task: 'Compare two ways to learn a language. Name a benefit of each and tell the club what you prefer.',
    english: 'Lessons give me structure, whereas chats help me use new words. At the moment I prefer chatting.',
    german: 'Lektionen geben mir Struktur, während ich im Chat neue Wörter anwenden kann. Im Moment chatte ich lieber.',
    phrases: ['whereas', 'At the moment I prefer …'], germanPhrases: ['während', 'Im Moment … lieber'],
  },
] as const;

const zurichActivities = [
  {
    id: 'zurich-viewing', title: 'Wohnungsbesichtigung',
    task: 'Spiele «Ein Tag in Zürich». In der Besichtigung musst du einen Termin verschieben. Schreibe deinen eigenen Vorschlag und vergleiche ihn mit anderen Antworten.',
    english: 'Would Friday at six work for you?',
    german: 'Würde Ihnen Freitag um sechs Uhr passen?',
    phrases: ['Would … work for you?'], germanPhrases: ['Würde Ihnen … passen?'],
  },
  {
    id: 'zurich-tram', title: 'Eine Durchsage erklären',
    task: 'Spiele im Zürich-Abenteuer die Durchsage. Erkläre einem anderen Mitglied, wo das Tram tatsächlich abfährt.',
    english: 'It leaves from stop C instead of stop A.',
    german: 'Es fährt an Kante C statt an Kante A ab.',
    phrases: ['instead of …'], germanPhrases: ['statt …'],
  },
] as const;

export function clubPractice(date = new Date(), language?: string) {
  const week = Math.floor((date.getTime() - MONDAY) / (7 * DAY));
  const german = language === 'German';
  const available = german ? [...activities, ...zurichActivities] : activities;
  // Add Zurich scenarios after the original four each cycle for German clubs.
  const index = ((week % available.length) + available.length) % available.length;
  const activity = available[index];
  return {
    week: new Date(MONDAY + week * 7 * DAY).toISOString().slice(0, 10),
    id: activity.id,
    title: activity.title,
    task: activity.task,
    example: german ? activity.german : activity.english,
    phrases: german ? activity.germanPhrases : activity.phrases,
    modelLanguage: german ? 'German' : 'English',
  };
}

export function clubPracticeContext(id?: string) {
  return [...activities, ...zurichActivities].find((activity) => activity.id === id);
}
