export type FirmaAdresseTyp = 'HAUPTQUARTIER' | 'NIEDERLASSUNG';

export interface FirmaAdresse {
  id: number;
  street: string | null;
  houseNumber: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  typ: FirmaAdresseTyp | null;
}

export interface Firma {
  id: number;
  name: string;
  industry: string;
  website: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  personenCount: number;
  abteilungenCount: number;
  adressen?: FirmaAdresse[];
}

export interface FirmaCreate {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  notes?: string;
}
