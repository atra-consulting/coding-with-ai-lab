# 01 — OpenStreetMap: Firmen auf der Karte

**Dauer:** 60 min
**Sozialform:** einzeln
**Werkzeug:** Claude Code
**Voraussetzung:** Lab läuft unter `localhost:7200`
**Ziel:** Die Firmen-Detailseite zeigt die Adressen der Firma als Marker auf einer OpenStreetMap-Karte.
**Ergebnis:** Eine Leaflet-Karte unter den Stammdaten, die automatisch auf alle Marker zoomt.

Die Adressen der Firma haben bereits `latitude` / `longitude` in der
Datenbank (Seed-Daten) — die Koordinaten landen direkt als Marker auf der
Karte. Keine Geokodierung nötig.

## Schritte

1. Claude Code im Projekt-Root starten: `claude --dangerously-skip-permissions`.
2. Den Prompt einfügen und an den Checkpoints PRD, Plan und Review lesen,
   dann `Continue`.
3. App neu starten (`./start.sh`) und eine Firma mit mehreren Adressen
   öffnen.
4. Prüfen, ob die Karte auf alle Marker zoomt und das Popup Typ und Straße
   zeigt.
5. Diff ansehen: `git diff main --stat`.

## Prompt

```
/plan-and-do "OpenStreetMap-Integration für Firmen. Schritt 1: In die Firmen-Detailseite eine Leaflet-Karte einbetten und alle Adressen der Firma als Marker anzeigen. Die Karte zoomt automatisch so, dass alle Marker sichtbar sind. Marker-Popup zeigt Typ (Hauptquartier, Niederlassung, ...) und Straße. Schritt 2 (optional): Route zwischen Niederlassungen berechnen und auf der Karte rendern, wenn mindestens zwei da sind."
```

## Abnahme

- Firmen-Detailseite zeigt unter den Stammdaten eine Leaflet-Karte.
- Alle Adressen der Firma mit Koordinaten erscheinen als Marker.
- Karte zoomt auf passenden Bounds (`fitBounds`).
- Optional: Polyline verbindet Niederlassungen nach OSRM-Routenberechnung.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| Karte bleibt grau / leer | Leaflet-CSS fehlt. `import 'leaflet/dist/leaflet.css'` in `styles.scss` oder in der Komponente. Karten-Container braucht feste Höhe (z. B. `height: 400px`). |
| Marker-Icons fehlen | Leafletss default-Icon-Pfad ist in Bundlern kaputt. Lösung: `L.Icon.Default.mergeOptions({ iconUrl, shadowUrl, ... })` mit explizit importierten PNGs. |
| Einzelne Adresse ohne Koordinaten | Seed-Daten haben alle Koordinaten. Manuell angelegte Adressen aus der UI können aber `latitude` / `longitude` leer lassen. Nur Adressen mit gesetztem `latitude` UND `longitude` rendern, andere überspringen. |
| `fitBounds` wirft bei einer einzigen Adresse | Einzelne Adresse → `setView([lat, lng], zoom)` statt `fitBounds`. |
| OSRM-Public-Server rate-limited | Workshop-Umgebung: kleine Demo reicht. In echt: eigenen OSRM-Container oder Mapbox-Directions. |

## Diskussion

- Wo cacht man die Karten-Tiles, um die OSM-Server zu entlasten?
- Ab wie vielen Firmen-Markern lohnt sich Clustering (Leaflet.markercluster)?
- Barrierefreiheit: Wie macht man Karten für Screenreader benutzbar?
