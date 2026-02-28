export interface Benutzer {
  id: number;
  benutzername: string;
  vorname: string;
  nachname: string;
  email: string;
  rollen: string[];
  aktiv: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BenutzerCreate {
  benutzername: string;
  passwort?: string;
  vorname: string;
  nachname: string;
  email: string;
  rollen: string[];
  aktiv: boolean;
}
