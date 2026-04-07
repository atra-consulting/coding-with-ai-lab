export type ProduktKategorie =
  | 'SOFTWARE'
  | 'HARDWARE'
  | 'DIENSTLEISTUNG'
  | 'LIZENZ'
  | 'WARTUNG'
  | 'SONSTIGES';

export interface Produkt {
  id: number;
  name: string;
  beschreibung: string;
  produktNummer: string;
  preis: number;
  currency: string;
  einheit: string;
  kategorie: ProduktKategorie;
  aktiv: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProduktCreate {
  name: string;
  beschreibung?: string;
  produktNummer?: string;
  preis?: number;
  currency?: string;
  einheit?: string;
  kategorie: ProduktKategorie;
  aktiv?: boolean;
}
