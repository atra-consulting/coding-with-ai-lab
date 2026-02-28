export interface LoginRequest {
  benutzername: string;
  passwort: string;
}

export interface LoginResponse {
  accessToken: string;
  benutzername: string;
  vorname: string;
  nachname: string;
  rollen: string[];
}

export interface RefreshResponse {
  accessToken: string;
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
