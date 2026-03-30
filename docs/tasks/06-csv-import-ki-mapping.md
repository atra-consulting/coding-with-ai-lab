# Aufgabe 6: Intelligenter CSV-Import mit KI-Spalten-Mapping

## Beschreibung

Implementiere einen CSV-Import, bei dem eine KI automatisch erkennt, welche CSV-Spalte welchem CRM-Feld entspricht.

## Anforderungen

1. **CSV hochladen** – Der User kann eine CSV-Datei hochladen (z.B. eine Firmenliste aus Excel)
2. **KI-Spalten-Mapping** – Die KI analysiert die Spaltenüberschriften und ordnet sie automatisch den CRM-Feldern zu (z.B. `Name` → `name`, `Telefon` → `telefon`)
3. **User-Bestätigung** – Das vorgeschlagene Mapping wird dem User angezeigt, der es bestätigen oder anpassen kann
4. **Import** – Nach Bestätigung werden die Daten importiert

## Lernziel

- Strukturierte LLM-Outputs: Wie bekommt man zuverlässig JSON vom LLM zurück?
- File-Handling: Upload und Parsing von CSV-Dateien im Frontend und Backend
