export type AktivitaetTyp = 'ANRUF' | 'EMAIL' | 'MEETING' | 'NOTIZ' | 'AUFGABE';

export interface Aktivitaet {
  id: number;
  typ: AktivitaetTyp;
  subject: string;
  description: string;
  datum: string;
  createdAt: string;
  firmaId: number | null;
  firmaName: string | null;
  personId: number | null;
  personName: string | null;
}

export interface AktivitaetCreate {
  typ: AktivitaetTyp;
  subject: string;
  description?: string;
  datum: string;
  firmaId?: number | null;
  personId?: number | null;
}
