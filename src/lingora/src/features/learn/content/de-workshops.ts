import type { Exercise } from '../catalog';
import { choice, reading } from './helpers';
import type { ExpansionUnit } from './index';

function writing(prompt: string, model: string, checklist: string[]): Exercise {
  return { type: 'writing', prompt, model, checklist };
}

export const germanWorkshops: ExpansionUnit[] = [
  {
    title: 'C1 · Reading and summarising', level: 'C1', lessons: [],
    reading: reading('de-r17', 'A library tests longer opening hours',
      `Die Stadtbibliothek hat ihre Öffnungszeiten im vergangenen Winter versuchsweise verlängert. Zwei Filialen blieben donnerstags bis 21 Uhr offen. Damit wollte die Stadt vor allem Berufstätigen den Zugang erleichtern. An den übrigen Tagen änderte sich nichts.

Nach drei Monaten zog die Bibliotheksleitung eine vorsichtige Bilanz. Die späten Stunden wurden zwar rege genutzt, doch ein Teil der Besuche verlagerte sich lediglich vom Samstagnachmittag auf den Donnerstagabend. Gleichzeitig berichteten mehrere Besucherinnen und Besucher, dass sie die Bibliothek ohne das neue Angebot überhaupt nicht hätten nutzen können. Die Statistik allein lasse deshalb, so die Leiterin, noch keinen sicheren Schluss auf die Reichweite des Angebots zu.

Die Beschäftigten befürworten eine Fortsetzung unter der Bedingung, dass die Spätdienste langfristig planbar bleiben. Aus dem Stadtrat kam der Vorschlag, zunächst nur eine Filiale länger zu öffnen und die zweite als Vergleich heranzuziehen. Die Entscheidung wurde vertagt. Bis zur nächsten Sitzung soll die Verwaltung ermitteln, wie viele zusätzliche Personaleinsatzstunden der Versuch tatsächlich erfordert hat.`,
      `The city library trialled longer opening hours last winter. Two branches stayed open until 9 p.m. on Thursdays. The city wanted to make access easier, especially for working people. Hours remained unchanged on other days.

After three months the library management reached a cautious assessment. The late hours were well used, but some visits simply shifted from Saturday afternoon to Thursday evening. At the same time several visitors said they could not have used the library at all without the new hours. The director therefore said the statistics alone could not establish how many people the service reached.

Staff support continuing the trial provided the late shifts can be planned in advance. A city council proposal would keep only one branch open later initially and use the other for comparison. The decision was postponed. Before the next meeting the administration is to determine how many additional staffing hours the trial actually required.`,
      choice('Which finding limits what the visit numbers can tell us?',
        ['Ein Teil der Besuche wurde nur auf einen anderen Tag verlegt.', 'Die Filialen waren samstags geschlossen.', 'Die Bibliothek zählte nur Besuche am Wochenende.'], 0,
        'A shift in timing does not necessarily mean the service reached new people.'),
      choice('What condition do the library staff place on their support?',
        ['Beide Filialen müssen jeden Abend öffnen.', 'Die Spätdienste müssen planbar bleiben.', 'Die Samstagsöffnungszeiten müssen entfallen.'], 1,
        'Unter der Bedingung, dass introduces the condition the staff set.'),
      choice('Which action is still pending at the end of the report?',
        ['Der Versuch muss erst beginnen.', 'Die Beschäftigten müssen erstmals befragt werden.', 'Der zusätzliche Personalaufwand muss beziffert werden.'], 2,
        'The council postponed the decision until it has more information about staffing.'),
      writing('Summarise the situation for a colleague in three German sentences. Keep the library director’s uncertainty and the staff’s condition.',
        'Zwei Filialen blieben versuchsweise donnerstags länger geöffnet. Die späten Stunden waren beliebt, doch laut Bibliotheksleitung lässt sich aus den Besuchszahlen noch nicht sicher ableiten, wie viele Menschen zusätzlich erreicht wurden. Die Beschäftigten unterstützen eine Fortsetzung, sofern die Spätdienste planbar bleiben.',
        ['State what changed without adding an outcome.', 'Attribute the uncertainty to the library management.', 'Use a condition such as sofern or unter der Bedingung, dass.'])),
  },
  {
    title: 'C1 · Listening and reformulating', level: 'C1', lessons: [],
    reading: {
      ...reading('de-r18', 'A project lead renegotiates a deadline',
        `Ich verstehe, dass Ihnen der Freitag wichtig ist. Die Zahlen liegen inzwischen vor, und den Überblick können wir Ihnen bis dahin schicken. Beim ausführlichen Bericht möchte ich mich allerdings noch nicht auf Freitag festlegen. Zwei Rückmeldungen aus dem Team fehlen, und ohne sie müssten wir einen Teil der Bewertung später ohnehin überarbeiten. Mein Vorschlag wäre daher, dass Sie am Freitag zunächst die Übersicht erhalten und wir den vollständigen Bericht am Dienstag nachreichen. Falls Sie am Montag schon etwas für die Sitzung brauchen, sagen Sie mir bitte, welche Abschnitte Vorrang haben. Dann prüfen wir, ob wir Ihnen genau diese Teile früher zur Verfügung stellen können.`,
        '',
        choice('What does the speaker commit to sending on Friday?',
          ['Den vollständigen Bericht.', 'Eine Übersicht über die Zahlen.', 'Eine endgültige Bewertung aller Rückmeldungen.'], 1,
          'The overview is available by Friday. The full report is proposed for Tuesday.'),
        choice('What is the proposed contingency if the recipient has a Monday meeting?',
          ['Der Termin am Dienstag wird automatisch vorverlegt.', 'Das Team nimmt an der Sitzung teil.', 'Der Empfänger nennt die dringendsten Abschnitte.'], 2,
          'The recipient is asked to identify priorities, which the team will then assess.'),
        writing('Write a brief, formal German follow-up. Confirm the Friday delivery, propose Tuesday for the full report, and ask what is needed for Monday.',
          'Wie besprochen erhalten Sie die Übersicht am Freitag. Für den vollständigen Bericht schlage ich Dienstag vor, da noch zwei Rückmeldungen ausstehen. Falls Sie für die Sitzung am Montag vorab einzelne Abschnitte benötigen, teilen Sie mir bitte mit, welche davon Vorrang haben.',
          ['Distinguish the confirmed delivery from the proposal.', 'Mention the reason without blaming colleagues.', 'Use consistent formal address.'])),
      listening: true,
    },
  },
  {
    title: 'C2 · Reading between the lines', level: 'C2', lessons: [],
    reading: reading('de-r19', 'When a trial becomes a precedent',
      `Als der Gemeinderat die Sperrung des Uferwegs für den Autoverkehr ankündigte, war ausdrücklich von einem Versuch die Rede. Nach sechs Monaten, so hiess es, werde man Bilanz ziehen. Im Abschlussbericht findet sich dieser Vorbehalt zwar noch, allerdings nur in einer Fussnote. Im Haupttext ist inzwischen von der «bewährten Verkehrsführung» die Rede. Man könnte darin eine sprachliche Nachlässigkeit sehen. Angesichts der Sorgfalt, mit der die Verfasser an anderer Stelle zwischen Prognosen und Messwerten unterscheiden, wäre das eine ausgesprochen grosszügige Lesart.

Die Zahlen selbst geben für eine so eindeutige Formulierung wenig her. Auf dem Uferweg ist es ruhiger geworden, während der Verkehr auf zwei Parallelstrassen zugenommen hat. Ob damit insgesamt weniger gefahren wurde oder bloss anderswo, lässt sich aus den vorgelegten Messungen nicht ableiten. Daraus folgt freilich ebenso wenig, dass der Versuch gescheitert ist. Wer Ruhe am Wasser als eigenständiges Ziel betrachtet, kann die Veränderung auch dann begrüssen, wenn sie an anderer Stelle Kosten verursacht.

Fragwürdig ist daher weniger das Ergebnis als die stillschweigende Verschiebung der Entscheidungsgrundlage. Der Rat hatte eine Abwägung angekündigt. Wer eine Verkehrsführung schon vor dieser Abwägung als bewährt bezeichnet, muss zumindest offenlegen, nach welchem Massstab sie sich bewährt haben soll.`,
      `When the council announced the closure of the riverside road to cars, it explicitly described the measure as a trial, to be reviewed after six months. That caveat survives in the final report, but only in a footnote. The main text now calls the traffic arrangement proven. One could put this down to careless wording. Given how carefully the authors distinguish forecasts from measurements elsewhere, that would be a remarkably generous reading.

The figures give little support to such a definite formulation. The riverside road became quieter while traffic increased on two parallel streets. The measurements cannot establish whether people drove less overall or simply drove elsewhere. Of course, this does not establish failure either. Those who regard quiet by the water as a goal in itself may welcome the change even if it brings costs elsewhere.

The issue is thus less the outcome than the unacknowledged shift in how it is judged. The council promised to weigh the trade-offs. Anyone calling the arrangement proven before that assessment must at least say what standard it is supposed to have met.`,
      choice('What does „eine ausgesprochen grosszügige Lesart“ imply here?',
        ['Die Autorin hält ein blosses Versehen für eher unwahrscheinlich.', 'Die Autorin lobt die sorgfältige Begründung des Rats.', 'Die Autorin behauptet, die Messungen seien erfunden.'], 0,
        'The understatement expresses doubt without making a direct accusation.'),
      choice('Which distinction is essential to the argument?',
        ['Der Bericht enthält keine Daten zu Parallelstrassen.', 'Eine lokale Entlastung belegt keine Abnahme des Gesamtverkehrs.', 'Eine lokale Entlastung schliesst jede Verlagerung aus.'], 1,
        'A local benefit and a network-wide change are two different claims.'),
      choice('What is the author ultimately asking the council to make explicit?',
        ['Die Zahl der nicht ausgewerteten Fussnoten.', 'Den Namen der Person, die den Bericht formuliert hat.', 'Den Massstab, nach dem die Massnahme beurteilt wird.'], 2,
        'The last paragraph challenges the evaluation criterion behind the word bewährt.'),
      writing('Rewrite the central criticism in neutral German for meeting minutes. In 60–90 words, keep the local benefit, the uncertainty about total traffic and the need for a clear criterion.',
        'Die Messungen zeigen eine Entlastung des Uferwegs und einen Anstieg des Verkehrs auf zwei Parallelstrassen. Sie erlauben keine Aussage darüber, ob das Verkehrsaufkommen insgesamt gesunken ist. Die lokale Verbesserung kann dennoch als Erfolg gewertet werden, sofern die Ruhe am Ufer als eigenständiges Ziel definiert wird. Vor einer endgültigen Entscheidung ist deshalb festzuhalten, nach welchen Kriterien der Versuch beurteilt wird und wie mögliche Belastungen an anderen Orten berücksichtigt werden.',
        ['Preserve the difference between a measured effect and an unknown overall effect.', 'Replace the irony with a neutral description.', 'Keep the conditional judgement instead of declaring success or failure.'])),
  },
  {
    title: 'C2 · Listening for stance', level: 'C2', lessons: [],
    reading: {
      ...reading('de-r20', 'A panel weighs an attractive claim',
        `Moderatorin: In der Pressemitteilung heisst es, das Projekt habe sich selbst finanziert. Würden Sie das so unterschreiben?

Analyst: Wenn man nur das erste Betriebsjahr betrachtet und die Anschaffungskosten ausklammert, ist die Aussage rechnerisch vertretbar. Ich bezweifle allerdings, dass die meisten Leserinnen und Leser unter Selbstfinanzierung genau das verstehen.

Projektleiterin: Wir wollten damit sagen, dass der laufende Betrieb ohne zusätzliche Zuschüsse ausgekommen ist. Die Investition war im Haushalt ohnehin vorgesehen.

Analyst: Das ist eine andere und durchaus bemerkenswerte Aussage. Ich würde sie genauso formulieren. Dann muss niemand aus einer positiven Jahresbilanz schliessen, dass sich die Anschaffung bereits bezahlt gemacht hat.

Moderatorin: Einigkeit besteht also beim laufenden Betrieb. Bei der Gesamtinvestition bleibt die Frage offen.`,
        '',
        choice('Under what assumptions does the analyst concede the original claim?',
          ['Alle Jahre werden betrachtet und sämtliche Kosten einbezogen.', 'Nur das erste Betriebsjahr zählt und die Anschaffungskosten bleiben aussen vor.', 'Der Betrieb war nur dank neuer Zuschüsse möglich.'], 1,
          'The analyst explicitly limits the period and excludes the initial purchase.'),
        choice('What does „durchaus bemerkenswert“ do in the analyst’s response?',
          ['Es würdigt das engere Ergebnis, ohne die ursprüngliche Aussage zu bestätigen.', 'Es zieht die Kritik an der ursprünglichen Aussage vollständig zurück.', 'Es bestreitet, dass die Jahresbilanz positiv war.'], 0,
          'The analyst grants the genuine achievement while keeping the broader claim separate.'),
        choice('What conclusion remains open?',
          ['Ob die Projektleitung die Pressemitteilung gelesen hat.', 'Ob die laufenden Kosten im ersten Jahr gedeckt waren.', 'Ob sich die Gesamtinvestition bereits amortisiert hat.'], 2,
          'The panel agrees on operating costs and leaves the return on the initial investment unresolved.'),
        writing('Draft two German sentences suitable for a corrected press release. State the confirmed operating result and make the scope of the finding clear.',
          'Im ersten Betriebsjahr kam der laufende Betrieb ohne zusätzliche Zuschüsse aus. Die Anschaffungskosten sind in dieser Betrachtung nicht enthalten, sodass daraus keine Aussage über die Amortisation der Gesamtinvestition abgeleitet werden kann.',
          ['Identify the period and the cost category.', 'State the positive result without upgrading it to self-financing.', 'Make the excluded costs explicit.'])),
      listening: true,
    },
  },
];
