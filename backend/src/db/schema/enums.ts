export const CHANCE_PHASE = [
  'NEU',
  'QUALIFIZIERT',
  'ANGEBOT',
  'VERHANDLUNG',
  'GEWONNEN',
  'VERLOREN',
] as const;
export type ChancePhase = (typeof CHANCE_PHASE)[number];

export const VERTRAG_STATUS = [
  'ENTWURF',
  'AKTIV',
  'ABGELAUFEN',
  'GEKUENDIGT',
] as const;
export type VertragStatus = (typeof VERTRAG_STATUS)[number];

export const AKTIVITAET_TYP = [
  'ANRUF',
  'EMAIL',
  'MEETING',
  'NOTIZ',
  'AUFGABE',
] as const;
export type AktivitaetTyp = (typeof AKTIVITAET_TYP)[number];
