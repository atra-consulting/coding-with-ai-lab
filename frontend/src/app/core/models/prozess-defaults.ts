import { ProzessDauer } from './szenario.model';

export const PROZESS_STEP_LABELS: {
  menschlich: string[];
  halbautomatisch: string[];
  vollautomatisch: string[];
} = {
  menschlich: [
    'Auslöser: Anfrage oder Fehler',
    'BA analysiert die Situation',
    'BA bespricht mit Entwickler',
    'BA schreibt Ticket',
    'Team bespricht Ticket im Refinement; Ticket → „Bereit"',
    'Entwickler A übernimmt Ticket, startet Arbeit',
    'Entwickler A beendet Arbeit, testet',
    'Entwickler A erstellt PR, setzt Ticket auf „In Review"',
    'Entwickler B reviewt PR, hat Kommentare',
    'Entwickler A bearbeitet Kommentare, bittet um Re-Review',
    'Entwickler B genehmigt PR',
    'Entwickler A setzt Ticket auf „Abnahmetest"',
    'Tester testet, fordert Änderungen, setzt Ticket zurück',
    'Entwickler A übernimmt Ticket erneut, startet Arbeit',
    'Entwickler A beendet Arbeit, testet',
    'Entwickler A aktualisiert PR, setzt Ticket auf „In Review"',
    'Entwickler B reviewt PR erneut, hat Kommentare',
    'Entwickler A bearbeitet Kommentare, bittet um Re-Review',
    'Entwickler B genehmigt PR erneut',
    'Entwickler A setzt Ticket auf „Abnahmetest"',
    'Tester bestätigt, setzt Ticket auf „Bereit für Deployment"',
    'Release wird gebaut',
    'Release wird in Produktion deployed',
  ],
  halbautomatisch: [
    'Auslöser: Anfrage oder Fehler',
    'KI schreibt Ticket, weist Mensch zu',
    'Mensch weist Ticket an KI zur Umsetzung',
    'KI analysiert, beginnt Code, braucht Input, weist Mensch zu',
    'Mensch beantwortet Fragen, weist Ticket an KI',
    'KI analysiert Antwort, schreibt Code, testet, deployed',
  ],
  vollautomatisch: [
    'Auslöser: Anfrage oder Fehler',
    'KI schreibt Ticket, Code, Tests und deployed',
  ],
};

export const DEFAULT_DURATIONS: {
  menschlich: ProzessDauer;
  halbautomatisch: ProzessDauer;
  vollautomatisch: ProzessDauer;
} = {
  menschlich: {
    works: [0, 60, 30, 60, 30, 15, 240, 30, 60, 60, 30, 15, 120, 15, 120, 20, 30, 30, 20, 15, 60, 30, 30],
    waits: [240, 480, 240, 1440, 2880, 0, 480, 480, 480, 240, 480, 1440, 480, 240, 480, 480, 240, 240, 480, 1440, 1440, 480],
  },
  halbautomatisch: {
    works: [0, 5, 15, 10, 30, 20],
    waits: [240, 480, 0, 480, 0],
  },
  vollautomatisch: {
    works: [0, 20],
    waits: [240],
  },
};

export interface ProzessDescriptor {
  key: 'menschlich' | 'halbautomatisch' | 'vollautomatisch';
  titel: string;
  labels: string[];
  stepCount: number;
}

export const PROZESSE: ProzessDescriptor[] = [
  {
    key: 'menschlich',
    titel: 'Menschlich',
    labels: PROZESS_STEP_LABELS.menschlich,
    stepCount: 23,
  },
  {
    key: 'halbautomatisch',
    titel: 'Halbautomatisch',
    labels: PROZESS_STEP_LABELS.halbautomatisch,
    stepCount: 6,
  },
  {
    key: 'vollautomatisch',
    titel: 'Vollautomatisch',
    labels: PROZESS_STEP_LABELS.vollautomatisch,
    stepCount: 2,
  },
];
