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
  adressenCount: number;
}

export interface FirmaCreate {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  notes?: string;
}
