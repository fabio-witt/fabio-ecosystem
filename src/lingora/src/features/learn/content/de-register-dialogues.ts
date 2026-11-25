// Original scripts for the German listening workshops. The device voice reads
// each exchange until recordings of the two registers are available.
export const germanRegisterDialogues: Record<string, { informal: string; formal: string }> = {
  'de-r18': {
    informal: 'Können wir den Termin verschieben? Die Übersicht schaffe ich bis Freitag, aber für den ganzen Bericht brauche ich bis Dienstag. Was brauchst du denn schon für Montag?',
    formal: 'Wäre es möglich, den Termin zu verschieben? Die Übersicht kann ich Ihnen bis Freitag zukommen lassen. Den vollständigen Bericht würde ich gerne am Dienstag nachreichen. Welche Abschnitte benötigen Sie bereits für Montag?',
  },
  'de-r20': {
    informal: 'Im ersten Jahr ist der Laden ohne Zuschüsse gelaufen. Das heisst aber noch lange nicht, dass wir die Anschaffung schon wieder drin haben.',
    formal: 'Der laufende Betrieb kam im ersten Jahr ohne zusätzliche Zuschüsse aus. Daraus lässt sich jedoch nicht ableiten, dass sich die Anschaffungskosten bereits amortisiert haben.',
  },
};
