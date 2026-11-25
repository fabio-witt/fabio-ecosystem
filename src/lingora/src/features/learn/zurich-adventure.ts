export type Choice = { text: string; next: string; feedback: string; mistake?: string };
export type Scene = {
  title: string;
  prompt: string;
  audio?: { text: string; language: 'de' | 'gsw' };
  clue?: string;
  choices: Choice[];
  outcome?: string;
};

export const scenes: Record<string, Scene> = {
  station: {
    title: 'Am Hauptbahnhof',
    prompt: 'Du hast eine Wohnungsbesichtigung und suchst das Tram. Wie fragst du?',
    choices: [
      { text: 'Entschuldigung, wo fährt das Tram ab?', next: 'notice', feedback: 'Eine höfliche Frage nach dem Abfahrtsort.' },
      { text: 'Können Sie mir sagen, wo die Haltestelle ist?', next: 'notice', feedback: 'Auch mit einer indirekten Frage kommst du ans Ziel.' },
      { text: 'Wo ist das Tram gestern gefahren?', next: 'station-hint', feedback: '«Gestern» fragt nach der Vergangenheit. Du suchst die nächste Abfahrt.', mistake: 'directions' },
    ],
  },
  'station-hint': {
    title: 'Noch einmal nachfragen',
    prompt: 'Die Person zeigt auf den Bahnhof. Frage präziser nach der Haltestelle.',
    choices: [{ text: 'Wo ist die Haltestelle für die nächste Abfahrt?', next: 'notice', feedback: 'Jetzt ist klar, welche Information du brauchst.' }],
  },
  notice: {
    title: 'Die Durchsage',
    prompt: 'Wo steigt ihr ein? Auf dem alten Aushang steht Kante A.',
    audio: { text: 'Das Tram Richtung Bellevue fährt heute an Kante C statt an Kante A ab.', language: 'de' },
    choices: [
      { text: 'An Kante C', next: 'cafe', feedback: 'Die Durchsage nennt die aktuelle Abfahrt.' },
      { text: 'An Kante A', next: 'cafe', feedback: '«Statt an Kante A» kündigt einen Wechsel an. Heute geht es an Kante C weiter.', mistake: 'notice' },
    ],
    outcome: 'Ich kann in einer Durchsage eine geänderte Abfahrt erkennen.',
  },
  cafe: {
    title: 'Im Café',
    prompt: '«Hättisch gern no öppis dezue?» Was fragt dich die Bedienung?',
    audio: { text: 'Hättisch gern no öppis dezue?', language: 'gsw' },
    clue: '«no öppis dezue» bedeutet «noch etwas dazu».',
    choices: [
      { text: 'Ob ich noch etwas dazu möchte.', next: 'viewing', feedback: 'Genau. Du kannst zum Beispiel mit «Nei, danke» antworten.' },
      { text: 'Ob ich die Rechnung möchte.', next: 'viewing', feedback: 'Sie bietet dir etwas Zusätzliches an. Nach der Rechnung könntest du danach fragen.', mistake: 'dialect' },
    ],
    outcome: 'Ich kann eine kurze Frage im Zürcher Café verstehen.',
  },
  viewing: {
    title: 'Die Besichtigung',
    prompt: 'Die Vermieterin sagt: «Donnerstag geht leider nicht. Freitag ab 17 Uhr wäre frei.» Wie reagierst du?',
    choices: [
      { text: 'Passt Ihnen Freitag um halb sechs?', next: 'confirmed', feedback: 'Du greifst das Angebot auf und schlägst 17:30 Uhr vor.' },
      { text: 'Am Freitag kann ich erst später. Ginge es um 18 Uhr?', next: 'confirmed', feedback: 'Du erklärst deine Einschränkung und bietest eine Alternative an.' },
      { text: 'Gut, ich komme am Donnerstag.', next: 'reschedule', feedback: 'Donnerstag wurde abgesagt. Frage nach einem Termin am Freitag.', mistake: 'appointment' },
    ],
  },
  reschedule: {
    title: 'Einen neuen Termin finden',
    prompt: 'Schlage eine Uhrzeit am Freitag vor.',
    choices: [{ text: 'Hätten Sie am Freitag um 18 Uhr Zeit?', next: 'confirmed', feedback: 'Dein Vorschlag ist klar und höflich.' }],
  },
  confirmed: {
    title: 'Rollenwechsel',
    prompt: 'Jetzt bist du der Vermieter. Eine Interessentin fragt: «Sind die Nebenkosten inbegriffen?» Gemäss deinem Inserat sind sie separat.',
    choices: [
      { text: 'Nein, die Nebenkosten kommen zur Miete dazu.', next: 'boss', feedback: 'Die Antwort erklärt den Preis klar.' },
      { text: 'Ja, Sie zahlen sie zusätzlich.', next: 'boss', feedback: '«Ja» und «zusätzlich» widersprechen sich hier. Beginne mit «Nein».', mistake: 'costs' },
    ],
    outcome: 'Ich kann sagen, ob Kosten im Preis enthalten sind.',
  },
  boss: {
    title: 'Finale: Der Treffpunkt',
    prompt: 'Deine Nachricht sagt: «Treffpunkt nur am Freitag. Verwende den aktuellen Eingang.» Höre die neue Ansage und bestätige den Treffpunkt.',
    audio: { text: 'Der Haupteingang ist geschlossen. Wir treffen uns am Freitag um halb sechs am Seiteneingang.', language: 'de' },
    choices: [
      { text: 'Bis Freitag um 17:30 am Seiteneingang.', next: 'finish', feedback: 'Du hast Tag, Uhrzeit und aktuellen Eingang kombiniert.' },
      { text: 'Bis Freitag um 18:30 am Haupteingang.', next: 'finish', feedback: '«Halb sechs» ist 17:30. Die Ansage verlegt den Treffpunkt an den Seiteneingang.', mistake: 'finale' },
    ],
    outcome: 'Ich kann einen geänderten Treffpunkt korrekt bestätigen.',
  },
};

export const revenge: Record<string, { prompt: string; options: string[]; answer: number }> = {
  directions: { prompt: 'Du suchst jetzt den nächsten Bus. Was fragst du?', options: ['Wo ist er letzte Woche gefahren?', 'Wo fährt der nächste Bus ab?'], answer: 1 },
  notice: { prompt: '«Heute Gleis 7 statt Gleis 3.» Wo wartest du?', options: ['Gleis 7', 'Gleis 3'], answer: 0 },
  dialect: { prompt: 'Im Laden fragt jemand: «Wotsch no öppis dezue?» Was ist gemeint?', options: ['Möchtest du noch etwas dazu?', 'Ist das dein Einkauf?'], answer: 0 },
  appointment: { prompt: '«Montag geht nicht. Dienstag wäre frei.» Was antwortest du?', options: ['Bis Montag!', 'Um wie viel Uhr am Dienstag?'], answer: 1 },
  costs: { prompt: 'Der Versand kostet extra. Wie antwortest du auf «Ist der Versand inbegriffen?»', options: ['Nein, er kostet zusätzlich.', 'Ja, er kostet zusätzlich.'], answer: 0 },
  finale: { prompt: '«Halb acht am Nordeingang.» Wann und wo ist das Treffen am Abend?', options: ['20:30 am Nordeingang', '19:30 am Nordeingang'], answer: 1 },
};

export function localDay(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
}

export function weeklyDays(days: string[], today: Date) {
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return localDay(date);
  }).filter(day => days.includes(day)).length;
}

export const adventureTasks: Record<string, { goal: string; starter: string }> = {
  'zurich-coop': {
    goal: 'Use two clues to choose a tram together.',
    starter: 'Lust auf ein Rätsel? Mein Fahrplanausschnitt sagt: Linie 4 fährt an Kante A, Linie 8 an Kante C. Öffne in GrammarBay «Ein Tag in Zürich» und lies unter «Hinweis für die zweite Person» den zweiten Teil. Frag mich dann, welche Linie an deiner Kante fährt.',
  },
  'zurich-story': {
    goal: 'Write a short alternating story.',
    starter: 'Schreiben wir abwechselnd eine kurze Geschichte? Wörter: Tram und Schlüssel. Mein erster Satz: Ich stieg ins Tram und merkte, dass mein Schlüssel weg war. Was passierte dann?',
  },
  'zurich-corrections': {
    goal: 'Exchange and save useful corrections.',
    starter: 'Hast du Lust auf einen Korrektur-Tausch? Wir schreiben jeweils zwei Sätze über unseren Tag. Möchtest du nur die wichtigsten Fehler oder auch Vorschläge für natürlichere Formulierungen?',
  },
  'zurich-week': {
    goal: 'Plan three shared practice days.',
    starter: 'Lust auf drei kurze Übungen diese Woche? Tag 1: Wir teilen je einen Alltagssatz. Tag 2: Wir üben die Durchsage im Zürich-Abenteuer. Tag 3: Wir spielen abwechselnd Mieter und Vermieter. Welche Tage passen dir?',
  },
};
