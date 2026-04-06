/**
 * Google Apps Script – Feedback Webhook
 *
 * SETUP-ANLEITUNG:
 * ================
 * 1. Erstelle ein neues Google Sheet (https://sheets.google.com)
 *    - Benenne es z.B. "Schulungs-Feedback"
 *    - In Zeile 1 die Spaltenüberschriften eintragen:
 *      A1: Schulungsdatum
 *      B1: Timestamp
 *      C1: Gesamteindruck (1-5)
 *      D1: Praxisnutzen (1-5)
 *      E1: Struktur (1-5)
 *      F1: AI-Erfahrung
 *      G1: Vorwissen
 *      H1: KI-Zukunft
 *      I1: Advanced-Themen
 *      J1: Highlight
 *      K1: Verbesserung
 *
 * 2. Gehe zu "Erweiterungen" → "Apps Script"
 *
 * 3. Lösche den Standard-Code und füge den Code unten ein
 *
 * 4. Klicke "Bereitstellen" → "Neue Bereitstellung"
 *    - Typ: "Web-App"
 *    - Ausführen als: "Ich" (dein Google-Account)
 *    - Zugriff: "Jeder" (damit das Formular ohne Login posten kann)
 *    - Klicke "Bereitstellen"
 *
 * 5. Kopiere die Web-App-URL (sieht so aus:
 *    https://script.google.com/macros/s/AKfycb.../exec)
 *
 * 6. Füge die URL in feedback-form.component.ts ein:
 *    GOOGLE_SCRIPT_URL = 'DEINE_URL_HIER';
 *
 * FERTIG! Jedes abgesendete Feedback erscheint als neue Zeile im Sheet.
 *
 * HINWEIS: Die Spalten müssen mit den keys im QUESTIONS-Array in
 * feedback-form.component.ts übereinstimmen. Wenn du Fragen änderst,
 * passe auch die Spalten im Sheet und dieses Script an.
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.schulungsDatum || '',
      data.timestamp || new Date().toISOString(),
      data.gesamteindruck || '',
      data.praxisnutzen || '',
      data.trainer || '',
      data.aiErfahrung || '',
      data.vorwissen || '',
      data.kiZukunft || '',
      data.advancedThemen || '',
      data.highlight || '',
      data.verbesserung || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: GET-Handler zum Testen
function doGet() {
  return ContentService
    .createTextOutput('Feedback webhook is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}
