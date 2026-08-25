# 07 — Neue App: Künstler-Webseite mit Next.js

**Dauer:** 120 min
**Sozialform:** einzeln
**Werkzeug:** Claude Code
**Ziel:** Claude Code zieht ein komplettes neues Projekt hoch — Framework, Auth, CRUD und Design.
**Ergebnis:** Eine lauffähige Next.js-App für den Künstler „Roy Bildermann" mit öffentlicher Galerie und geschütztem Admin-Bereich.

Die Website präsentiert seine Werke und Informationen über den Künstler;
dazu gibt es einen geschützten Login-Bereich, in dem der Künstler seine
Werke verwaltet. Stack: Next.js mit React, In-Memory-DB (fährt beim Start
automatisch hoch), JWT-Authentifizierung, Desktop und Mobile. Die
Zeitangabe ist eine Untergrenze — das Projekt kann deutlich länger dauern
und ist bewusst zu groß für eine einzige `/plan-and-do`-Runde.

## Schritte

1. In ein leeres Verzeichnis außerhalb des Labs wechseln und Claude Code
   starten: `claude --dangerously-skip-permissions`.
2. Den Prompt einfügen und an den Checkpoints PRD, Plan und Review lesen,
   dann `Continue`.
3. Die vier Schritte des Prompts nacheinander abarbeiten lassen und nach
   jedem das Ergebnis prüfen.
4. App starten (`npm run dev`) und Landingpage, Künstlerseite und Login mit
   `admin` / `passwort` durchklicken.
5. Im Admin-Bereich ein Werk hochladen, beschreiben, per Drag-and-Drop
   umsortieren und löschen.

## Prompt

**1 — Als `/plan-and-do`-Auftrag**

```
"Neue Web-App mit Next.js und React für den Künstler 'Roy Bildermann' und seine Bildergalerie. Die App läuft mit einer In-Memory-Datenbank, die beim Start automatisch hochfährt, und funktioniert auf Desktop und Mobile. Login mit einem einzigen User (Benutzername: admin, Passwort: passwort) über eine sichere Login-Seite. Schritt 1: Projekt-Setup mit Login. Schritt 2: Öffentliche Website — eine Landingpage, die die Werke prominent darstellt, und eine Seite mit Infos zum Künstler inklusive Porträt. Design: modern und seriös, nicht verspielt, so dass die abstrakte Kunst zur Geltung kommt. Schritt 3: Geschützter Admin-Bereich nach Login. Der Künstler kann Werke hochladen, Beschreibungen ergänzen, Werke per Drag-and-Drop sortieren und löschen. Schritt 4: Drei Demo-Werke und Infos zum Künstler mit Bild sind von Anfang an hinterlegt und erscheinen direkt auf der Landingpage. Bei Unklarheiten nachfragen."
```

**2 — Spoiler: die Originalformulierung ohne `/plan-and-do`**

<details>
<summary>Originaler Freitext-Prompt</summary>

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
Datenbank hinzu, die gleich auf der Landingpage angezeigt werden sollen.
Füge auch Informationen zum Künstler, mit einem Bild. Falls etwas unklar
ist, frag.

</details>

## Abnahme

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

## Diskussion

- Wann Next.js, wann SvelteKit, wann Angular mit SSR? Kriterien.
- In-Memory-DB war Workshop-Vereinfachung — was bräuchte es für Produktion?
- Bild-Optimierung: `next/image` kann eine Menge, aber nur bei statischen
  Pfaden — was tun bei dynamischen Uploads?
