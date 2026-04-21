export interface MapMarker {
  id: number;
  street: string | null;
  houseNumber: string | null;
  postalCode: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  firmaId: number | null;
  firmaName: string | null;
}
