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

export const GEHALT_TYP = [
  'GRUNDGEHALT',
  'BONUS',
  'PROVISION',
  'SONDERZAHLUNG',
] as const;
export type GehaltTyp = (typeof GEHALT_TYP)[number];

export const REPORT_DIMENSION = [
  'PHASE',
  'FIRMA',
  'PERSON',
  'MONAT',
  'QUARTAL',
  'JAHR',
] as const;
export type ReportDimension = (typeof REPORT_DIMENSION)[number];

export const REPORT_METRIK = [
  'ANZAHL',
  'SUMME_WERT',
  'DURCHSCHNITT_WERT',
  'GEWICHTETER_WERT',
  'GEWINNRATE',
] as const;
export type ReportMetrik = (typeof REPORT_METRIK)[number];
