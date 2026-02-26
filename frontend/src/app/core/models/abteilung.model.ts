export interface Abteilung {
  id: number;
  name: string;
  description: string;
  firmaId: number;
  firmaName: string;
  personenCount: number;
}

export interface AbteilungCreate {
  name: string;
  description?: string;
  firmaId: number;
}
