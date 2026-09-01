# 12 — Ein Log lesen

**Dauer:** 20 min
**Sozialform:** einzeln
**Werkzeug:** Terminal
**Voraussetzung:** Lab läuft unter `localhost:7200` (Aufgabe 10)
**Ziel:** Drei Zeilen aus dem Startlog sind eingeordnet und ein provozierter Fehler ist erklärt.
**Ergebnis:** Drei Aussagen zum Startlog, die Erklärung für `401` statt `404` und ein Blick in Network-Tab und Console.

Ein Log ist kein Rauschen, sondern der Bericht der Anwendung über sich
selbst. Wer drei Zeilen darin einordnen kann, kann an Tag 2 beurteilen, ob
der Agent recht hat, wenn er sagt „läuft" — und einem Entwickler einen
Fehler so melden, dass er ihn findet.

## Schritte

1. Scrollt im ersten Terminal (dort läuft `./start.sh`) nach oben und
   schreibt auf, was diese drei Zeilen sagen: `Node.js … detected.`
   (welche Version?), `Running database migrations…` / `=== Seeder: …`
   (was passiert mit der Datenbank?) und
   `CRM backend running on http://localhost:7070` samt der Angular-Zeile
   mit `localhost:7200` (warum zwei Adressen?).
2. Provoziert im zweiten Terminal einen Fehler mit
   `curl -i http://localhost:7070/api/health` und
   `curl -i http://localhost:7070/api/firmen/999999` und erklärt, warum
   die zweite Antwort `401` ist und nicht `404`.
3. Öffnet im CRM mit `F12` die Entwicklerwerkzeuge, seht im Reiter
   „Network" beim Öffnen einer Firma jede Anfrage an `/api/…` mit Status
   und im Reiter „Console" die Fehler des Frontends.
4. Kopiert 20–30 Zeilen des Startlogs in den Chat und lasst sie erklären
   (Prompt 1) — deckt sich die Erklärung mit dem, was ihr in Schritt 1
   herausgefunden habt?
5. Räumt erst auf, wenn ihr fertig seid: `./end.sh` im zweiten Terminal
   stoppt Backend und Frontend, `./start.sh` startet sie erneut — für
   Tag 2 muss die Anwendung wieder laufen. Wer sehen will, was ein
   belegter Port meldet, startet `./start.sh` vorher ein zweites Mal,
   während die Anwendung noch läuft: Das Skript prüft die Ports, startet
   nichts doppelt und schreibt hin, was zu tun ist.

## Folienschritte

1. Im Startlog drei Zeilen finden und deuten.
2. Mit `curl` zwei Anfragen ans Backend schicken.
3. Erklären, warum `401` kommt und nicht `404`.
4. Mit `F12` Network und Console beim Öffnen einer Firma ansehen.
5. Logausschnitt vom Chat erklären lassen und gegenprüfen.

## Prompt

**1 — Log erklären lassen**

```
Das ist das Startlog einer Webanwendung (Node.js-Backend, Angular-Frontend). Erkläre
Zeile für Zeile in je einem Satz, was passiert, und markiere, welche Zeilen ein Problem
anzeigen würden, wenn sie fehlten.
```

## Abnahme

- Ihr könnt beim nächsten „geht nicht" sagen, welche drei Dinge ihr dem
  Entwickler mitschickt: Statuscode, Log-Ausschnitt, Schritte zum
  Nachstellen.
- Ihr könnt erklären, warum die Prüfung „wer bist du" vor „gibt es das"
  kommt — im Terminal seid ihr nicht angemeldet, deshalb `401`.
- Ihr habt ein Gefühl dafür, wo der Assistent beim Erklären eines Logs
  hilft und wo er rät.
