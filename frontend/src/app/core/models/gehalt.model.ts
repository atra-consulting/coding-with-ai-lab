export type GehaltTyp = 'GRUNDGEHALT' | 'BONUS' | 'PROVISION' | 'SONDERZAHLUNG';

export interface Gehalt {
  id: number;
  amount: number;
  currency: string;
  effectiveDate: string;
  typ: GehaltTyp;
  personId: number;
  personName: string;
}

export interface GehaltCreate {
  amount: number;
  currency?: string;
  effectiveDate: string;
  typ: GehaltTyp;
  personId: number;
}
