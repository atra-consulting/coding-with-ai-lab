import { ProzessDauer } from './szenario.model';

/** The four delivery processes compared by the Rechner, in canonical (R1) order. */
export type ProzessKey = 'menschlich' | 'agileKi' | 'halbautomatisch' | 'vollautomatisch';

/** Role assigned to a single work step of the two agile (human-in-the-loop) processes. */
export type Rolle = 'BA' | 'Dev' | 'Tester';

const MENSCHLICH_LABELS: string[] = [
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
  'Entwickler B genehmigt PR erneut',
  'Entwickler A setzt Ticket auf „Abnahmetest"',
  'Tester bestätigt, setzt Ticket auf „Bereit für Deployment"',
];

export const PROZESS_STEP_LABELS: Record<ProzessKey, string[]> = {
  menschlich: MENSCHLICH_LABELS,
  // Same reference as `menschlich` — Agile mit KI walks the identical process steps,
  // only the work durations differ (see DEFAULT_DURATIONS below).
  agileKi: MENSCHLICH_LABELS,
  halbautomatisch: [
    'Auslöser: Anfrage oder Fehler',
    'KI schreibt Ticket, weist Mensch zu',
    'Mensch gibt KI Feedback zur Anfrage',
    'Mensch weist Ticket an KI zur Umsetzung',
    'KI analysiert, beginnt Code, braucht Input, weist Mensch zu',
    'Mensch beantwortet Fragen, weist Ticket an KI',
    'KI analysiert Antwort, schreibt Code, testet',
  ],
  vollautomatisch: [
    'Auslöser: Anfrage oder Fehler',
    'KI schreibt Ticket, Code und Tests',
  ],
};

const MENSCHLICH_WAITS: number[] = [
  120, 120, 120, 960, 480, 0, 30, 120, 120, 120, 30, 240, 60, 0, 30, 240, 30, 60,
];

/**
 * Canonical default durations (minutes), single source of truth mirrored on the
 * backend in `szenarioSeed.ts`. Stored values are always integer minutes.
 */
export const DEFAULT_DURATIONS: Record<ProzessKey, ProzessDauer> = {
  menschlich: {
    works: [0, 60, 30, 60, 30, 15, 240, 30, 60, 60, 30, 15, 120, 15, 120, 20, 20, 15, 60],
    waits: MENSCHLICH_WAITS,
  },
  agileKi: {
    works: [0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    // Same waits array reference as Agile mit Menschen: waiting dominates the total,
    // so AI-assisted work only trims the end-to-end time from 3,880 to 2,970 minutes.
    // This modest improvement is intentional — do not "fix" it.
    waits: MENSCHLICH_WAITS,
  },
  halbautomatisch: {
    works: [0, 5, 15, 15, 10, 30, 20],
    waits: [5, 60, 60, 5, 60, 5],
  },
  vollautomatisch: {
    works: [0, 20],
    // Changed from [240]: a fully-automated process has nobody left to wait on.
    waits: [5],
  },
};

/**
 * Role map for the two agile (human-in-the-loop) processes only. 0-indexed,
 * 19 elements (step 1 = index 0, the trigger step, has no role). Same array
 * reference for both `menschlich` and `agileKi` — the role assignment per step
 * does not change between the two, only the durations do.
 */
const MENSCHLICH_ROLLEN: (Rolle | null)[] = [
  null, 'BA', 'BA', 'BA', 'BA',
  'Dev', 'Dev', 'Dev', 'Dev', 'Dev', 'Dev', 'Dev',
  'Tester',
  'Dev', 'Dev', 'Dev', 'Dev', 'Dev',
  'Tester',
];

export const PROZESS_ROLLEN: Record<'menschlich' | 'agileKi', (Rolle | null)[]> = {
  menschlich: MENSCHLICH_ROLLEN,
  agileKi: MENSCHLICH_ROLLEN,
};

export interface ProzessDescriptor {
  key: ProzessKey;
  titel: string;
  labels: string[];
  stepCount: number;
  /** Label for the per-step "work" input — 'Arbeitszeit' for the two agile processes, 'KI-Arbeitszeit' for the two KI processes. */
  arbeitszeitLabel: string;
}

export const PROZESSE: ProzessDescriptor[] = [
  {
    key: 'menschlich',
    titel: 'Agile mit Menschen',
    labels: PROZESS_STEP_LABELS.menschlich,
    stepCount: 19,
    arbeitszeitLabel: 'Arbeitszeit',
  },
  {
    key: 'agileKi',
    titel: 'Agile mit KI',
    labels: PROZESS_STEP_LABELS.agileKi,
    stepCount: 19,
    arbeitszeitLabel: 'Arbeitszeit',
  },
  {
    key: 'halbautomatisch',
    titel: 'KI-Prozess mit Feedback',
    labels: PROZESS_STEP_LABELS.halbautomatisch,
    stepCount: 7,
    arbeitszeitLabel: 'KI-Arbeitszeit',
  },
  {
    key: 'vollautomatisch',
    titel: 'KI-Prozess vollautomatisch',
    labels: PROZESS_STEP_LABELS.vollautomatisch,
    stepCount: 2,
    arbeitszeitLabel: 'KI-Arbeitszeit',
  },
];
