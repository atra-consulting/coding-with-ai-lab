# PRD-002: Authentifizierung & Benutzerverwaltung

## 1. Übersicht

Das CRM-System soll um eine Authentifizierung und ein Benutzerkonzept erweitert werden. Benutzer müssen sich anmelden, bevor sie auf das System zugreifen können. Unterschiedliche Rollen regeln, welche Aktionen ein Benutzer durchführen darf.

## 2. Problemstellung

Aktuell ist das gesamte System ohne Zugriffskontrolle:

- **Kein Login**: Jeder mit Netzwerkzugang kann alle Daten lesen und verändern.
- **Keine Nachvollziehbarkeit**: Es ist nicht erkennbar, wer Daten angelegt oder geändert hat.
- **Kein Rollensystem**: Alle Nutzer haben identische, unbeschränkte Rechte — ein Vertriebsmitarbeiter kann genauso Gehälter einsehen wie ein Admin.
- **Offene API**: Alle REST-Endpoints sind ohne Authentifizierung erreichbar.

## 3. Ziele

- Benutzer müssen sich mit Benutzername und Passwort anmelden, bevor sie das System nutzen können.
- Nicht-authentifizierte Zugriffe auf API und Frontend werden abgewiesen bzw. auf die Login-Seite umgeleitet.
- Ein Rollensystem steuert, welche Funktionsbereiche ein Benutzer sehen und nutzen darf.
- Ein Administrator kann Benutzer anlegen, bearbeiten, deaktivieren und Rollen zuweisen.
- Die Anwendung zeigt den angemeldeten Benutzer an und bietet eine Logout-Funktion.

## 4. Nicht-Ziele (Out of Scope)

- Registrierung durch Benutzer selbst (Self-Sign-Up) — Benutzer werden ausschließlich durch Admins angelegt.
- OAuth2 / Social Login (Google, Microsoft, etc.) — kann in einer späteren Iteration ergänzt werden.
- Zwei-Faktor-Authentifizierung (2FA).
- Passwort-Zurücksetzen per E-Mail (kein Mailserver konfiguriert). Der Admin setzt Passwörter manuell zurück.
- Audit-Log für alle Benutzeraktionen (eigenes Feature).
- Mandantenfähigkeit (Multi-Tenancy).
- LDAP/Active-Directory-Integration.

## 5. Bestehendes System

### Backend

- **Entities**: Firma, Person, Abteilung, Adresse, Gehalt, Aktivitaet, Vertrag, Chance — keine davon hat Bezug zu Benutzern.
- **API**: Alle Endpoints unter `/api/*` sind ohne Authentifizierung erreichbar.
- **CORS**: Konfiguriert für `localhost:4200`, erlaubt Credentials.
- **Datenbank**: H2 file-basiert, User `sa` ohne Passwort (Entwicklungsmodus).
- **Keine Security-Dependency**: Spring Security ist nicht eingebunden.

### Frontend

- **Routing**: Alle Routen sind frei zugänglich, keine Guards.
- **Interceptors**: Nur `apiErrorInterceptor` für Fehler-Toasts.
- **Navigation**: Sidebar + Navbar ohne Benutzerbezug.
- **Keine Auth-Libraries**: Kein Token-Handling, kein Login-State.

## 6. Anforderungen

### 6.1 Benutzer-Entity

Ein Benutzer hat folgende Eigenschaften:

| Feld            | Beschreibung                                      | Pflicht |
|-----------------|---------------------------------------------------|---------|
| Benutzername    | Eindeutig, für den Login                          | Ja      |
| Passwort        | Gespeichert als Hash, niemals im Klartext          | Ja      |
| Vorname         | Anzeigename                                       | Ja      |
| Nachname        | Anzeigename                                       | Ja      |
| E-Mail          | Eindeutig                                         | Ja      |
| Rolle(n)        | Eine oder mehrere Rollen                          | Ja      |
| Aktiv           | Boolean — inaktive Benutzer können sich nicht anmelden | Ja  |
| Erstellt am     | Timestamp                                         | Auto    |
| Aktualisiert am | Timestamp                                         | Auto    |

### 6.2 Rollen & Berechtigungen

Es werden drei Rollen definiert:

| Rolle       | Beschreibung                                                                                          |
|-------------|-------------------------------------------------------------------------------------------------------|
| `ADMIN`     | Voller Zugriff auf alle Funktionen inkl. Benutzerverwaltung.                                          |
| `VERTRIEB`  | Zugriff auf Firmen, Personen, Abteilungen, Adressen, Aktivitäten, Verträge und Chancen. Kein Zugriff auf Gehälter und Benutzerverwaltung. |
| `PERSONAL`  | Zugriff auf Firmen, Personen, Abteilungen, Adressen, Gehälter und Aktivitäten. Kein Zugriff auf Verträge, Chancen und Benutzerverwaltung. |

**Berechtigungsmatrix:**

| Bereich            | ADMIN | VERTRIEB | PERSONAL |
|--------------------|-------|----------|----------|
| Dashboard          | Ja    | Ja       | Ja       |
| Firmen             | Ja    | Ja       | Ja       |
| Personen           | Ja    | Ja       | Ja       |
| Abteilungen        | Ja    | Ja       | Ja       |
| Adressen           | Ja    | Ja       | Ja       |
| Aktivitäten        | Ja    | Ja       | Ja       |
| Gehälter           | Ja    | Nein     | Ja       |
| Verträge           | Ja    | Ja       | Nein     |
| Chancen (+ Board)  | Ja    | Ja       | Nein     |
| Benutzerverwaltung | Ja    | Nein     | Nein     |

Ein Benutzer kann mehrere Rollen haben. Die effektiven Berechtigungen ergeben sich aus der Vereinigung aller Rollenberechtigungen.

### 6.3 Authentifizierung

#### 6.3.1 Login

- **Route (Frontend)**: `/login`
- **Felder**: Benutzername, Passwort.
- **Verhalten bei Erfolg**: Weiterleitung zur zuletzt angeforderten Seite oder zum Dashboard.
- **Verhalten bei Fehler**: Fehlermeldung "Benutzername oder Passwort ungültig" (bewusst unspezifisch).
- **Inaktive Benutzer**: Gleiche Fehlermeldung wie bei falschen Credentials (kein Hinweis auf Deaktivierung).

#### 6.3.2 Session / Token

- Nach erfolgreicher Anmeldung erhält der Client ein Authentifizierungs-Token oder eine Session, die bei jedem API-Request mitgesendet wird.
- Die Session/das Token hat eine konfigurierbare Gültigkeit (z.B. 24 Stunden).
- Nach Ablauf wird der Benutzer automatisch ausgeloggt und auf die Login-Seite umgeleitet.

> **Hinweis**: Die konkrete Wahl des Mechanismus (JWT, Session-Cookie, etc.) ist Gegenstand eines separaten ADR.

#### 6.3.3 Logout

- Logout-Button in der Navbar (sichtbar wenn eingeloggt).
- Logout invalidiert die Session/das Token serverseitig.
- Nach Logout: Weiterleitung zur Login-Seite.

#### 6.3.4 API-Absicherung

- Alle Endpoints unter `/api/*` erfordern Authentifizierung.
- Nicht-authentifizierte Requests erhalten HTTP `401 Unauthorized`.
- Requests ohne ausreichende Berechtigung erhalten HTTP `403 Forbidden`.
- Ausnahme: Der Login-Endpoint selbst ist ohne Authentifizierung erreichbar.

### 6.4 Frontend

#### 6.4.1 Login-Seite

- Eigenständige Seite ohne Sidebar/Navbar.
- Zentriertes Formular mit Benutzername, Passwort und Login-Button.
- Fehlermeldung bei ungültigem Login als Alert oberhalb des Formulars.
- "Passwort anzeigen"-Toggle am Passwortfeld.

#### 6.4.2 Route Guards

- Alle Routen außer `/login` erfordern Authentifizierung.
- Nicht-authentifizierte Benutzer werden auf `/login` umgeleitet.
- Nach Login: Weiterleitung zur ursprünglich angeforderten URL.
- Routen zu Bereichen, für die der Benutzer keine Berechtigung hat, zeigen eine "Zugriff verweigert"-Meldung oder leiten zum Dashboard um.

#### 6.4.3 Navigation

- Die Sidebar zeigt nur Menüpunkte an, für die der Benutzer berechtigt ist.
- Die Navbar zeigt den Namen des angemeldeten Benutzers und einen Logout-Button.

#### 6.4.4 Auth-Interceptor

- Jeder ausgehende HTTP-Request wird automatisch um die Authentifizierungsinformationen ergänzt (Token-Header oder Cookie).
- Bei `401`-Responses wird der Benutzer automatisch ausgeloggt und auf die Login-Seite umgeleitet.
- Bei `403`-Responses wird eine "Keine Berechtigung"-Nachricht als Toast angezeigt.

### 6.5 Benutzerverwaltung (Admin)

#### 6.5.1 Benutzerliste

- **Route**: `/benutzer`
- Tabelle mit: Benutzername, Name, E-Mail, Rolle(n), Status (Aktiv/Inaktiv).
- Pagination und Sortierung analog zu den bestehenden Listen.

#### 6.5.2 Benutzer anlegen / bearbeiten

- **Routen**: `/benutzer/neu`, `/benutzer/:id/bearbeiten`
- Formular mit allen Feldern aus 6.1.
- Beim Anlegen: Passwort muss gesetzt werden (Mindestlänge: 8 Zeichen).
- Beim Bearbeiten: Passwort-Feld optional — leer lassen behält das bisherige Passwort bei.
- Rolle(n) werden per Checkbox-Gruppe zugewiesen.

#### 6.5.3 Benutzer deaktivieren

- Statt Löschen: Benutzer werden deaktiviert (Soft-Delete).
- Deaktivierte Benutzer können sich nicht mehr anmelden.
- Deaktivierte Benutzer können wieder aktiviert werden.

#### 6.5.4 Benutzer-Detailansicht

- **Route**: `/benutzer/:id`
- Zeigt alle Benutzerinformationen (ohne Passwort).

### 6.6 Seed-Daten

Für die Entwicklung werden folgende Benutzer automatisch angelegt:

| Benutzername | Passwort   | Rolle(n)          | Name              |
|-------------|------------|--------------------|-------------------|
| `admin`     | `admin123` | ADMIN              | Max Mustermann    |
| `vertrieb`  | `test123`  | VERTRIEB           | Vera Vertrieblich |
| `personal`  | `test123`  | PERSONAL           | Paul Personal     |
| `allrounder`| `test123`  | VERTRIEB, PERSONAL | Anna Allrounder   |

## 7. UX-Wireframes

### 7.1 Login-Seite

```
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│           ┌──────────────────────┐           │
│           │       CRM Login      │           │
│           │                      │           │
│           │  ┌────────────────┐  │           │
│           │  │ Benutzername   │  │           │
│           │  └────────────────┘  │           │
│           │  ┌────────────────┐  │           │
│           │  │ Passwort     👁 │  │           │
│           │  └────────────────┘  │           │
│           │                      │           │
│           │  [    Anmelden     ] │           │
│           │                      │           │
│           └──────────────────────┘           │
│                                              │
└──────────────────────────────────────────────┘
```

### 7.2 Navbar mit Benutzer

```
┌──────────────────────────────────────────────────────────┐
│  CRM System                          Max Mustermann [↪] │
└──────────────────────────────────────────────────────────┘
```

### 7.3 Benutzerverwaltung

```
┌──────────────────────────────────────────────────────────────────┐
│  Benutzer                                         [+ Neu]       │
├──────────┬──────────────────┬─────────────┬──────────┬──────────┤
│ Benutzer │ Name             │ E-Mail      │ Rollen   │ Status   │
├──────────┼──────────────────┼─────────────┼──────────┼──────────┤
│ admin    │ Max Mustermann   │ admin@...   │ ADMIN    │ ● Aktiv  │
│ vertrieb │ Anna Vertrieblich│ anna@...    │ VERTRIEB │ ● Aktiv  │
│ personal │ Hans Personal    │ hans@...    │ PERSONAL │ ● Aktiv  │
│ test     │ Test User        │ test@...    │ VERTRIEB │ ○ Inaktiv│
└──────────┴──────────────────┴─────────────┴──────────┴──────────┘
```

## 8. Akzeptanzkriterien

1. **Login funktioniert**: Benutzer können sich mit korrektem Benutzername/Passwort anmelden und erhalten Zugriff auf das System.
2. **Fehlerhafter Login**: Falsche Credentials zeigen eine unspezifische Fehlermeldung, kein Zugriff wird gewährt.
3. **API-Schutz**: Alle `/api/*`-Endpoints (außer Login) liefern `401` ohne gültige Authentifizierung.
4. **Rollenbasierte Sichtbarkeit**: Die Sidebar zeigt nur Bereiche an, für die der Benutzer berechtigt ist.
5. **Rollenbasierter Zugriff (API)**: API-Requests auf nicht-berechtigte Bereiche liefern `403`.
6. **Rollenbasierter Zugriff (Frontend)**: Direktes Navigieren zu nicht-berechtigten Routen wird abgefangen.
7. **Benutzerverwaltung**: Admin kann Benutzer anlegen, bearbeiten, deaktivieren und Rollen zuweisen.
8. **Logout**: Benutzer können sich abmelden und werden zur Login-Seite weitergeleitet.
9. **Session-Ablauf**: Nach Ablauf der Session wird der Benutzer automatisch ausgeloggt.
10. **Passwort-Sicherheit**: Passwörter werden gehasht gespeichert, nie im Klartext.
11. **Seed-Daten**: Die vier Testbenutzer sind nach Start verfügbar und funktionieren.
12. **Bestehende Funktionalität**: Alle existierenden Features (CRUD, Kanban-Board, etc.) funktionieren weiterhin — jetzt hinter dem Login.

## 9. Architekturentscheidungen

Die technischen Architekturentscheidungen zu diesem PRD sind in [ADR-001: Architekturentscheidungen Authentifizierung & Benutzerverwaltung](../adr/001-authentication-architecture.md) dokumentiert.

**Getroffene Entscheidungen:**

| Thema                | Entscheidung                                      |
|----------------------|---------------------------------------------------|
| Auth-Mechanismus     | JWT mit Refresh-Token (kurzlebiger Access-Token + widerrufbarer Refresh-Token) |
| Token-Speicherung    | Access-Token im Speicher (JS-Variable), Refresh-Token als HttpOnly Cookie |
| Passwort-Hashing     | BCrypt (Spring Security Default)                  |
| Security-Framework   | Spring Security                                   |
| Rollen-Architektur   | Enum + zentrales Permission-Mapping               |

## 10. Implementierung

**PR**: [#9 — feat: Authentication & User Management](https://github.com/atra-consulting/coding-with-ai-lab/pull/9)

**Commits**:
- `c982e6f` feat: add JWT authentication, role-based access control and user management
- `c79e20b` style: redesign login page with branded card layout
