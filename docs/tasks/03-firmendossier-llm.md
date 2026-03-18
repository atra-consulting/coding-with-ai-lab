# Aufgabe 3: Firmendossier via LLM (Gemini)

## Beschreibung

Erstelle ein KI-gestütztes Firmendossier, das über die Gemini API Informationen und Presseberichte zu einer Firma abruft und in der UI anzeigt.

## Schritt 1: Testdaten erweitern

- Nimm echte Firmen in die Testdaten auf (z.B. MAG7: Apple, Microsoft, Alphabet, Amazon, Meta, Nvidia, Tesla)
- Ergänze realistische Stammdaten für diese Firmen

## Schritt 2: Firmendossier über Gemini API

- Implementiere einen Backend-Service, der die Gemini API anbindet (API Key steht bereit)
- Erstelle einen Endpoint, der ein Firmendossier für eine gegebene Firma generiert
- Das Dossier soll eine Zusammenfassung der Firma sowie aktuelle Presseberichte enthalten

## Schritt 3: UI-Integration

- Füge einen Button **„Firmendossier abrufen"** in die Firmen-Detailseite ein
- Zeige das generierte Dossier mit Presseberichten in der UI an
