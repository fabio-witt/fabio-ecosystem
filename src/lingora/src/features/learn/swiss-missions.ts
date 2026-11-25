import type { ScoredExercise } from './exercise';
export type SwissMission = { id: string; title: string; goal: string; phrases: [string, string][]; roleplay: string; exercises: ScoredExercise[] };
export const swissMissions: SwissMission[] = [
 { id: 'viewing', title: 'Wohnung besichtigen', goal: 'Ask about rent and arrange a viewing.',
 phrases: [['Ist die Wohnung noch frei?', 'Is the apartment still available?'], ['Sind die Nebenkosten inbegriffen?', 'Are additional charges included?'], ['Wann wäre eine Besichtigung möglich?', 'When would a viewing be possible?']],
 roleplay: 'Du suchst eine Wohnung. Frage nach der Miete, den Nebenkosten und einem Besichtigungstermin. Dein Partner übernimmt die Vermietung. Danach tauscht ihr die Rollen.',
 exercises: [
 {type:'choice',prompt:'Wann findet die Besichtigung statt?',audio:'Die Besichtigung ist am Donnerstagabend um halb sechs. Passt Ihnen das?',options:['Donnerstag um 17:30','Donnerstag um 18:30','Freitag um 17:30'],answer:0,explain:'Halb sechs bedeutet 5:30. Hier ist 17:30 als Abendtermin gemeint.'},
 {type:'choice',prompt:'Du möchtest wissen, ob zusätzliche Kosten enthalten sind. Was fragst du?',options:['Sind die Nebenkosten inbegriffen?','Wo ist der Bahnhof?','Kann ich mit Karte zahlen?'],answer:0},
 {type:'choice',prompt:'Du möchtest die Wohnung ansehen. Welcher Satz passt?',options:['Ich hätte gerne die Rechnung.','Wann wäre eine Besichtigung möglich?','Ich möchte einen Tisch reservieren.'],answer:1}] },
 { id: 'appointment', title: 'Einen Arzttermin vereinbaren', goal: 'Request an appointment and clarify the time.',
 phrases: [['Ich möchte einen Termin vereinbaren.', 'I would like to make an appointment.'], ['Hätten Sie diese Woche einen freien Termin?', 'Would you have an appointment available this week?'], ['Könnten Sie die Uhrzeit bitte wiederholen?', 'Could you repeat the time, please?']],
 roleplay: 'Rufe für einen fiktiven, nicht dringenden Termin an. Frage nach einem freien Termin und bestätige Datum und Uhrzeit. Dein Partner übernimmt den Empfang. Verwendet erfundene Angaben.',
 exercises:[
 {type:'choice',prompt:'Welchen Termin bietet der Empfang an?',audio:'Wir hätten am Dienstag um Viertel nach neun einen Termin frei.',options:['Dienstag um 09:45','Dienstag um 09:15','Donnerstag um 09:15'],answer:1,explain:'Viertel nach neun bedeutet 09:15.'},
 {type:'choice',prompt:'Du hast die Uhrzeit nicht verstanden. Was sagst du?',options:['Könnten Sie die Uhrzeit bitte wiederholen?','Die Wohnung ist schön.','Ich nehme einen Kaffee.'],answer:0},
 {type:'choice',prompt:'Wie fragst du höflich nach einem Termin?',options:['Wann fährt der Zug?','Ist die Miete inbegriffen?','Hätten Sie diese Woche einen freien Termin?'],answer:2}] },
 { id: 'interview', title: 'Im Vorstellungsgespräch', goal: 'Describe experience and ask about the team.',
 phrases:[['Ich habe drei Jahre Erfahrung im IT-Bereich.', 'I have three years of experience in IT.'],['Wie sieht die Zusammenarbeit im Team aus?', 'How does the team work together?'],['Könnten Sie die Aufgaben genauer beschreiben?', 'Could you describe the responsibilities in more detail?']],
 roleplay:'Führt ein fiktives Vorstellungsgespräch. Beschreibe eine erfundene Berufserfahrung und frage nach Aufgaben und Zusammenarbeit. Dein Partner stellt eine Rückfrage. Danach tauscht ihr die Rollen.',
 exercises:[
 {type:'choice',prompt:'Was gehört zur Stelle?',audio:'Sie arbeiten im Team und betreuen unsere Kundinnen und Kunden.',options:['Buchhaltung','Lagerverwaltung','Kundenbetreuung'],answer:2,explain:'Kundinnen und Kunden betreuen bedeutet Kundenbetreuung.'},
 {type:'choice',prompt:'Du möchtest mehr über die Aufgaben erfahren. Was fragst du?',options:['Wo kann ich umsteigen?','Könnten Sie die Aufgaben genauer beschreiben?','Ist die Wohnung noch frei?'],answer:1},
 {type:'choice',prompt:'Welcher Satz beschreibt Berufserfahrung?',options:['Ich habe drei Jahre Erfahrung im IT-Bereich.','Ich hätte gerne einen Kaffee.','Ich möchte einen Termin vereinbaren.'],answer:0}] },
];
export function missionMistakeKey(mission: string, index: number) { return `${mission}:${index}`; }
export function updateMissionMistakes(previous: Record<string, boolean>, mission: string, index: number, correct: boolean) {
 const next = { ...previous }; const key = missionMistakeKey(mission, index);
 if (correct) delete next[key]; else next[key] = true;
 return next;
}

export const missionOutcomes: Record<string, string> = {
  viewing: 'Ich kann nach den Nebenkosten fragen und einen Besichtigungstermin vereinbaren.',
  appointment: 'Ich kann einen Arzttermin vereinbaren und bei der Uhrzeit nachfragen.',
  interview: 'Ich kann meine Erfahrung beschreiben und nach den Aufgaben fragen.',
};
