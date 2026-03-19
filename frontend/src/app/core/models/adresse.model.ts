export interface Adresse {
  id: number;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  firmaId: number | null;
  firmaName: string | null;
  personId: number | null;
  personName: string | null;
}

export interface AdresseCreate {
  street: string;
  houseNumber?: string;
  postalCode: string;
  city: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  firmaId?: number | null;
  personId?: number | null;
}
