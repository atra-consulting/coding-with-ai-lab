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
  notiz?: string | null;
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
  notiz?: string | null;
  wert?: number;
  currency?: string;
  phase: ChancePhase;
  wahrscheinlichkeit?: number;
  erwartetesDatum?: string;
  firmaId: number;
  kontaktPersonId?: number | null;
}

export function getPhaseBadgeClass(phase: ChancePhase | string | null | undefined): string {
  const map: Record<ChancePhase, string> = {
    NEU: 'bg-primary',
    QUALIFIZIERT: 'bg-info text-dark',
    ANGEBOT: 'bg-warning text-dark',
    VERHANDLUNG: 'bg-secondary',
    GEWONNEN: 'bg-success',
    VERLOREN: 'bg-danger',
  };
  return (phase && map[phase as ChancePhase]) || 'bg-secondary';
}

