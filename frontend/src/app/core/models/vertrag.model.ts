export type VertragStatus = 'ENTWURF' | 'AKTIV' | 'ABGELAUFEN' | 'GEKUENDIGT';

export interface Vertrag {
  id: number;
  titel: string;
  wert: number;
  currency: string;
  status: VertragStatus;
  startDate: string;
  endDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  firmaId: number;
  firmaName: string;
  kontaktPersonId: number | null;
  kontaktPersonName: string | null;
}

export interface VertragCreate {
  titel: string;
  wert?: number;
  currency?: string;
  status: VertragStatus;
  startDate?: string;
  endDate?: string;
  notes?: string;
  firmaId: number;
  kontaktPersonId?: number | null;
}
