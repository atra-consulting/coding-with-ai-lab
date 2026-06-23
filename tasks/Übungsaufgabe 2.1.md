# 2.1 — Neue App: Künstler-Webseite mit Next.js

**Umfang:** groß (Greenfield-Projekt) · **Bereiche:** Full-Stack (neues Repo) · **Dauer:** ~+60 Min

## Ziel

Eine neue, eigenständige Web-App für den Künstler „Roy Bildermann" und seine
Bildergalerie. Die Website präsentiert seine Werke und Informationen über
den Künstler. Zusätzlich gibt es einen geschützten Login-Bereich, in dem der
Künstler seine Werke verwalten kann.

Diese Aufgabe zeigt, wie Claude Code ein komplettes neues Projekt
hochziehen kann — inklusive Framework-Wahl, Auth, CRUD und Design.

## Technologie-Stack

- **Framework:** Next.js mit React
- **Datenbank:** In-Memory-DB (wird beim Start automatisch hochgefahren)
- **Authentifizierung:** JWT-basiert
- **Responsiveness:** Desktop und Mobile

## Prompt

Erzeuge ein neues Verzeichnis `künstler-webseite` und wechsele dort hinein. Starte Claude und wechsel mit <Tab> in den Auto-Modus. Wähle mit `/model` Sonnet aus. Dann führe diesen Prompt aus:

```
Lass uns eine neue Web-App bauen. Diese soll mit NextJS und React
implementiert werden, eine inMemory DB haben (die direkt beim Start
hochgefahren wird). Sie soll für Desktop und Mobile optimiert werden. Sie
soll eine JWT Authentifizierung haben. Aktuell soll es einen User mit
Benutzername „admin" und Passwort „passwort" geben. Thema der App: Eine
Website für den Künstler „Roy Bildermann" und seine Bildergalerie. Auf der
Website sollen die Werke dargestellt und Infos über den Künstler präsentiert
werden. Es soll einen Loginbereich geben wo der Künstler seine Werke
hochladen kann. Die Werke sollen sortierbar und löschbar sein, und zu jedem
Werk soll man eine Beschreibung hinzufügen können. Design: Mache ein
modernes und seriöses Design (nicht zu verspielt), welches die abstrakte
Kunst des Künstlers gut zur Geltung bringt. Daten: Füge 3 Werke zur
Datenbank hinzu, die gleich auf der Landingpage angezeigt werden sollen, 
und 4 mehr, die ich auch noch sehen kann. Füge auch Informationen zum 
Künstler, mit einem Bild. Falls etwas unklar ist, frage nicht, sondern 
entscheide Du. Das ist ein One-Shot-Projekt, und ich akzzeptier Fehler
von Dir! Schreibe keine Tests. Sage mir am Schluss, wie ich die Seite
starten kann und wie ich sie beenden kann.
```

## Erwartetes Ergebnis

- Next.js-App startet lokal mit `npm run dev`.
- Öffentliche Seiten: Landingpage + Künstler-Info, responsive.
- Login mit admin / passwort funktioniert, JWT in HttpOnly-Cookie.
- Admin-Bereich kann Werke anlegen / beschreiben / sortieren / löschen.
- Drei Demo-Werke + Künstlerinfos sind vorgeladen.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| In-Memory DB verliert Daten bei Hot-Reload | Next.js Dev-Mode entlädt Module. Fix: DB-Instanz auf `globalThis` legen (`globalThis.__db ??= initDb()`). |
| JWT in Local Storage | Sicherheitsrisiko (XSS). Stattdessen HttpOnly-Cookie, Set via `Set-Cookie` Header, Verify in Middleware. |
| Bilder-Upload schlägt fehl | Next.js-App hat keinen Persistent Storage — für Workshop: Base64 in der DB speichern oder `/public/uploads`. |
| Drag-and-Drop für Sortierung kompliziert | `@dnd-kit/sortable` ist der aktuelle Standard in React — einfacher als `react-dnd`. |
| Responsiveness kaputt | Tailwind Default-Breakpoints reichen. Mobile-First: erst Mobile, dann `md:`, `lg:` Overrides. |

## Diskussionspunkte

- Wann Next.js, wann SvelteKit, wann Angular mit SSR? Kriterien.
- In-Memory-DB war Workshop-Vereinfachung — was bräuchte es für Produktion?
- Bild-Optimierung: `next/image` kann eine Menge, aber nur bei statischen
  Pfaden — was tun bei dynamischen Uploads?
