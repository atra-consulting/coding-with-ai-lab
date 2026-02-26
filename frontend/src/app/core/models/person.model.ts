export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  firmaId: number;
  firmaName: string;
  abteilungId: number | null;
  abteilungName: string | null;
}

export interface PersonCreate {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position?: string;
  notes?: string;
  firmaId: number;
  abteilungId?: number | null;
}
