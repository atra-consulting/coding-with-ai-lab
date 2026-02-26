export type ChancePhase =
  | 'NEU'
  | 'QUALIFIZIERT'
  | 'ANGEBOT'
  | 'VERHANDLUNG'
  | 'GEWONNEN'
  | 'VERLOREN';

export interface Chance {
  id: number;
  titel: string;
  beschreibung: string;
  wert: number;
  currency: string;
  phase: ChancePhase;
  wahrscheinlichkeit: number;
  erwartetesDatum: string;
  createdAt: string;
  updatedAt: string;
  firmaId: number;
  firmaName: string;
  kontaktPersonId: number | null;
  kontaktPersonName: string | null;
}

export interface ChanceCreate {
  titel: string;
  beschreibung?: string;
  wert?: number;
  currency?: string;
  phase: ChancePhase;
  wahrscheinlichkeit?: number;
  erwartetesDatum?: string;
  firmaId: number;
  kontaktPersonId?: number | null;
}
