# ADR-002: Speicherort der Dashboard-Konfiguration

**Status**: Entschieden
**Datum**: 2026-03-01
**Bezug**: [PRD-004: Konfigurierbares Pipeline-Dashboard](../prds/004-auswertungen-konfigurierbar.md), Offene Frage 10.1

## Kontext

Das Pipeline-Dashboard wird konfigurierbar: Nutzer können Widgets verschieben, entfernen und wieder hinzufügen (siehe PRD). Die resultierende Konfiguration (eine geordnete Liste sichtbarer Widget-IDs) muss persistent gespeichert werden, damit sie beim nächsten Seitenaufruf erhalten bleibt.

**Datenstruktur** (minimal):
```json
{
  "visibleWidgets": ["kpi-cards", "pivot-table", "bar-chart"]
}
```

**Rahmenbedingungen:**
- Authentifizierung mit JWT + Refresh-Token ist vorhanden (ADR-001)
- Benutzer-Entity mit Rollen existiert bereits
- H2 file-basierte Datenbank
- Single-Instance-Deployment

---

## Option A: LocalStorage (Browser)

Die Konfiguration wird als JSON-String im `localStorage` des Browsers gespeichert, z.B. unter dem Key `pipeline-dashboard-config`.

**Vorteile:**
- Kein Backend-Aufwand: Rein Frontend-seitig, sofort umsetzbar.
- Keine zusätzliche Entity, kein Endpoint, keine Migration.
- Schnell: Kein Netzwerk-Request zum Laden/Speichern.
- Unabhängig vom Auth-State — funktioniert auch ohne Login (falls relevant).

**Nachteile:**
- **Nicht geräteübergreifend**: Konfiguration lebt nur im Browser. Anderer Rechner, anderer Browser = Standard-Layout.
- **Nicht benutzergebunden**: Bei Mehrbenutzerbetrieb am gleichen Browser teilen sich alle Nutzer die gleiche Konfiguration.
- **Datenverlust**: Bei Cache-Löschen, Inkognito-Modus oder Browser-Wechsel geht die Konfiguration verloren.
- **Kein Backup**: Bei Re-Installation ist alles weg.

## Option B: Backend — eigene Entity `DashboardConfig`

Neue Entity `DashboardConfig` mit Beziehung zum `Benutzer`. Wird über einen dedizierten REST-Endpoint geladen und gespeichert.

```java
@Entity
public class DashboardConfig {
    @Id @GeneratedValue
    private Long id;

    @OneToOne
    @JoinColumn(name = "benutzer_id", unique = true)
    private Benutzer benutzer;

    @Column(length = 1024)
    private String config; // JSON-String
}
```

**Endpoints:**
- `GET /api/dashboard-config` — Konfiguration des eingeloggten Benutzers laden
- `PUT /api/dashboard-config` — Konfiguration speichern

**Vorteile:**
- **Geräteübergreifend**: Konfiguration folgt dem Benutzer-Account — egal welcher Browser oder Rechner.
- **Benutzergebunden**: Jeder Nutzer hat seine eigene Konfiguration.
- **Persistent**: Überlebt Browser-Wechsel, Cache-Löschen und Neuinstallationen.
- **Erweiterbar**: Kann in Phase 2 für gespeicherte Reports wiederverwendet werden.
- **Konsistent**: Passt zum bestehenden Pattern (Entity → Repository → Service → Controller).

**Nachteile:**
- Mehr Aufwand: Neue Entity, Repository, Service, Controller, DTO (5-7 Dateien).
- Netzwerk-Request beim Laden der Seite (vernachlässigbar bei einem einzigen kleinen JSON).
- Abhängig vom Auth-State — Konfiguration kann nur geladen werden, wenn der Benutzer eingeloggt ist.

## Option C: Backend — Feld auf bestehender Benutzer-Entity

Statt einer eigenen Entity wird ein `dashboardConfig`-Feld direkt auf der `Benutzer`-Entity hinzugefügt.

```java
@Column(length = 1024)
private String dashboardConfig; // JSON-String, nullable
```

**Vorteile:**
- Gleiche Vorteile wie Option B (geräteübergreifend, benutzergebunden, persistent).
- Weniger Dateien: Keine eigene Entity/Repository nötig.
- Einfacher Zugriff: Konfiguration wird beim Login oder über den bestehenden Benutzer-Endpoint mitgeliefert.

**Nachteile:**
- **Vermischung**: Die Benutzer-Entity wird mit UI-Konfiguration belastet — verletzt Single Responsibility.
- **Skaliert schlecht**: Wenn in Phase 2 weitere Konfigurationen hinzukommen (gespeicherte Reports, andere Dashboards), wächst die Entity unnötig.
- **Migrations-Aufwand**: Bestehende Benutzer-Entity muss geändert werden.

---

## Entscheidung: Option B — Eigene Entity `DashboardConfig`

Die Nutzungszufriedenheit steht im Vordergrund: Eine Dashboard-Konfiguration, die beim Browser-Wechsel oder Cache-Löschen verloren geht, frustriert Nutzer. Die Backend-Persistierung stellt sicher, dass jeder Nutzer seine individuelle Konfiguration geräteübergreifend behält.

Option B (eigene Entity) wird gegenüber Option C (Feld auf Benutzer) bevorzugt, weil sie sauberer trennt und in Phase 2 direkt als Grundlage für gespeicherte Reports dienen kann. Der Mehraufwand von 5-7 Dateien ist vertretbar und folgt dem etablierten Entity-Pattern des Projekts.

Das JSON-als-String-Feld (`config`) bietet Flexibilität: Die Konfigurationsstruktur kann erweitert werden (z.B. Widget-Größen in Phase 2), ohne die Datenbankstruktur zu ändern.

---

## Zusammenfassung

| Kriterium | A: LocalStorage | B: Eigene Entity | C: Feld auf Benutzer |
|---|---|---|---|
| Geräteübergreifend | Nein | **Ja** | Ja |
| Benutzergebunden | Nein | **Ja** | Ja |
| Datenverlust-Risiko | Hoch | **Keins** | Keins |
| Backend-Aufwand | Keiner | Mittel | Gering |
| Erweiterbarkeit (Phase 2) | Schlecht | **Gut** | Schlecht |
| Separation of Concerns | — | **Gut** | Schlecht |

**Entscheidung: Option B — Eigene Entity `DashboardConfig`**
