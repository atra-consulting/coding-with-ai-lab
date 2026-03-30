export interface LoginRequest {
  benutzername: string;
  passwort: string;
}

export interface LoginResponse {
  benutzername: string;
  vorname: string;
  nachname: string;
  rollen: string[];
}

export interface BenutzerInfo {
  id: number;
  benutzername: string;
  vorname: string;
  nachname: string;
  email: string;
  rollen: string[];
  permissions: string[];
}
