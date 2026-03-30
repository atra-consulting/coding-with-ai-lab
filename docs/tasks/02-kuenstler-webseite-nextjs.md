# Aufgabe 2: Neue App erstellen

## Beschreibung

Baue eine neue, eigenständige Web-App für den Künstler „Roy Bildermann" und seine Bildergalerie. Die Website soll seine Werke präsentieren und Informationen über den Künstler bereitstellen. Zusätzlich gibt es einen geschützten Login-Bereich, in dem der Künstler seine Werke verwalten kann.

## Technologie-Stack

- **Framework**: Next.js mit React
- **Datenbank**: In-Memory-DB (wird beim Start automatisch hochgefahren)
- **Authentifizierung**: JWT-basiert
- **Responsiveness**: Optimiert für Desktop und Mobile

## Schritt 1: Projekt-Setup & Authentifizierung

- Erstelle ein neues Next.js-Projekt
- Richte eine In-Memory-Datenbank ein, die beim Start automatisch verfügbar ist
- Implementiere JWT-Authentifizierung mit einem vordefinierten Benutzer:
  - Benutzername: `admin`
  - Passwort: `passwort`
- Erstelle eine Login-Seite

## Schritt 2: Öffentliche Website – Landingpage & Künstler-Info

- Erstelle eine Landingpage, die die Werke des Künstlers prominent darstellt
- Füge eine Seite/Sektion mit Informationen über den Künstler hinzu, inklusive einem Bild
- **Design**: Modern und seriös (nicht zu verspielt), das die abstrakte Kunst des Künstlers gut zur Geltung bringt

## Schritt 3: Admin-Bereich – Werke verwalten

- Erstelle einen geschützten Admin-Bereich (nur nach Login erreichbar)
- Funktionen:
  - **Hochladen**: Neue Werke hochladen
  - **Beschreibung**: Zu jedem Werk eine Beschreibung hinzufügen/bearbeiten
  - **Sortieren**: Werke in der gewünschten Reihenfolge sortieren
  - **Löschen**: Werke entfernen

## Schritt 4: Testdaten

- Füge 3 Werke zur Datenbank hinzu, die direkt auf der Landingpage angezeigt werden
- Füge Informationen zum Künstler hinzu, mit einem Bild

## Schritt 5: Gesamter Prompt

<details>
<summary>SPOILER: Gesamter Prompt</summary>

Lass uns eine neue Web-App bauen. Diese soll mit NextJS und React implementiert werden, eine inMemory DB haben (die direkt beim Start hochgefahren wird). Sie soll für Desktop und Mobile optimiert werden.
Sie soll eine JWT Authentifizierung haben. Aktuell soll es einen User mit Benutzername „admin" und Passwort „passwort" geben. Thema der App: Eine Website für den Künstler „Roy Bildermann" und seine Bildergalerie. Auf der Website sollen die Werke dargestellt und Infos über den Künstler präsentiert werden. Es soll einen Loginbereich geben wo der Künstler seine Werke hochladen kann. Die Werke sollen sortierbar und löschbar sein, und zu jedem Werk soll man eine Beschreibung hinzufügen können. Design: Mache ein modernes und seriöses Design (nicht zu verspielt), welches die abstrakte Kunst des Künstlers gut zur Geltung bringt.

Daten: Füge 3 Werke zur Datenbank hinzu, die gleich auf der Landingpage angezeigt werden sollen.

Füge auch Informationen zum Künstler, mit einem Bild. Falls etwas unklar ist, frag.

</details>
