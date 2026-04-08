import { sqlite } from '../config/db.js';

// ─── Mulberry32 PRNG (seed 42) ───────────────────────────────────────────────
function mulberry32(seed: number) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let z = Math.imul(s ^ (s >>> 15), 1 | s);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

const rng = mulberry32(42);

function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
const NOW = new Date('2026-04-07T00:00:00Z');

function daysAgo(days: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() - days);
  return d;
}

function daysFromNow(days: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() + days);
  return d;
}

function randDateBetween(from: Date, to: Date): Date {
  const diff = to.getTime() - from.getTime();
  return new Date(from.getTime() + rng() * diff);
}

function toIsoDatetime(d: Date): string {
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

function toDateString(d: Date): string {
  return d.toISOString().substring(0, 10);
}

function randCreatedAt(): string {
  return toIsoDatetime(randDateBetween(daysAgo(3 * 365), NOW));
}

// ─── German data pools ────────────────────────────────────────────────────────

const FIRMEN_PREFIXE = [
  'Müller', 'Schmidt', 'Weber', 'Fischer', 'Meyer', 'Wagner', 'Becker', 'Schulz',
  'Hoffmann', 'Schäfer', 'Koch', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann',
  'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hartmann', 'Lange', 'Schmitt', 'Werner',
  'Schneider', 'Krause', 'Meier', 'Lehmann', 'Köhler', 'Herrmann',
];

const FIRMEN_SUFFIXE = [
  'Technik', 'Bau', 'Handel', 'Logistik', 'Consulting', 'Services', 'Solutions',
  'Industrie', 'Systeme', 'Gruppe', 'Holding', 'Engineering', 'Digital', 'Media',
  'Energie', 'Transport', 'Immobilien', 'Finanz', 'Software', 'Automotive',
];

const FIRMEN_RECHTSFORMEN = ['GmbH', 'AG', 'GmbH & Co. KG', 'KG', 'OHG', 'SE', 'UG (haftungsbeschränkt)'];

const BRANCHEN = [
  'Technologie', 'Bauwesen', 'Handel', 'Logistik', 'Beratung', 'Industrie',
  'Automobilbranche', 'Energie', 'Immobilien', 'Finanzen', 'Medien', 'Gesundheit',
  'Pharma', 'Chemie', 'Lebensmittel', 'Textil', 'Maschinenbau', 'Elektroindustrie',
];

const ABTEILUNGEN_POOL = [
  'Vertrieb', 'Marketing', 'IT', 'HR', 'Finanzen', 'Produktion',
  'Einkauf', 'Recht', 'Forschung', 'Logistik',
];

const VORNAMEN = [
  'Alexander', 'Andreas', 'Anna', 'Barbara', 'Benjamin', 'Bernd', 'Christian', 'Christina',
  'Daniel', 'David', 'Elena', 'Elisabeth', 'Felix', 'Franziska', 'Georg', 'Hannah',
  'Hans', 'Heike', 'Jana', 'Jan', 'Julia', 'Julian', 'Katharina', 'Klaus', 'Laura',
  'Lena', 'Lisa', 'Lukas', 'Marco', 'Maria', 'Markus', 'Martin', 'Michael', 'Monika',
  'Nadine', 'Nicole', 'Oliver', 'Patrick', 'Peter', 'Petra', 'Philipp', 'Sandra',
  'Sebastian', 'Sophia', 'Stefan', 'Stefanie', 'Thomas', 'Tobias', 'Uwe', 'Werner',
];

const NACHNAMEN = [
  'Bauer', 'Becker', 'Berg', 'Böhm', 'Braun', 'Dietrich', 'Engel', 'Fischer',
  'Frank', 'Friedrich', 'Fuchs', 'Graf', 'Hartmann', 'Heinz', 'Herrmann', 'Hoffmann',
  'Kaiser', 'Klein', 'Koch', 'König', 'Krause', 'Krüger', 'Lange', 'Lehmann',
  'Maier', 'Meier', 'Meyer', 'Müller', 'Neumann', 'Peters', 'Richter', 'Roth',
  'Schäfer', 'Schmidt', 'Schmitt', 'Schneider', 'Schröder', 'Schulz', 'Schwarz',
  'Simon', 'Stein', 'Wagner', 'Walter', 'Weber', 'Werner', 'Wolf', 'Zimmermann',
  'Ziegler', 'Brandt',
];

const POSITIONEN = [
  'Geschäftsführer', 'Prokurist', 'Abteilungsleiter', 'Teamleiter', 'Senior Manager',
  'Manager', 'Projektleiter', 'Sachbearbeiter', 'Consultant', 'Senior Consultant',
  'Vertriebsleiter', 'Key Account Manager', 'Entwickler', 'Senior Entwickler',
  'Buchhalter', 'Controller', 'HR Business Partner', 'Einkäufer', 'Logistiker',
];

const STRASSEN = [
  'Hauptstraße', 'Bahnhofstraße', 'Gartenstraße', 'Schulstraße', 'Kirchstraße',
  'Ringstraße', 'Bergstraße', 'Waldstraße', 'Industriestraße', 'Lindenstraße',
  'Mozartstraße', 'Goethestraße', 'Schillerstraße', 'Bismarckstraße', 'Friedrichstraße',
  'Wilhelmstraße', 'Marktstraße', 'Parkstraße', 'Rosenstraße', 'Kastanienallee',
];

const STAEDTE = [
  'Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt am Main', 'Stuttgart',
  'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden', 'Hannover',
  'Nürnberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster',
];

const PLZ_PREFIXE = ['10', '20', '30', '40', '50', '60', '70', '80', '90', '01', '04', '28', '44', '48'];

const AKTIVITAET_TYPEN = ['ANRUF', 'EMAIL', 'MEETING', 'AUFGABE', 'NOTIZ'] as const;
const GEHALT_TYPEN = ['GRUNDGEHALT', 'BONUS', 'PROVISION', 'SONDERZAHLUNG'] as const;
const CHANCE_PHASEN = ['NEU', 'QUALIFIZIERT', 'ANGEBOT', 'VERHANDLUNG', 'GEWONNEN', 'VERLOREN'] as const;
const VERTRAG_STATI = ['ENTWURF', 'AKTIV', 'ABGELAUFEN', 'GEKUENDIGT'] as const;

const AKTIVITAET_SUBJECTS: Record<string, string[]> = {
  ANRUF: [
    'Erstgespräch geführt', 'Rückruf vereinbart', 'Produktpräsentation besprochen',
    'Angebot nachgefasst', 'Technische Fragen geklärt', 'Kundenfeedback eingeholt',
  ],
  EMAIL: [
    'Angebot versendet', 'Unterlagen zugesendet', 'Termin bestätigt',
    'Follow-up E-Mail', 'Newsletter versandt', 'Vertragsunterlagen übermittelt',
  ],
  MEETING: [
    'Kick-off Meeting', 'Projektbesprechung', 'Quartalsreview', 'Vertragsverhandlung',
    'Produktdemonstration', 'Statusmeeting', 'Strategiebesprechung',
  ],
  AUFGABE: [
    'Angebot erstellen', 'Unterlagen zusammenstellen', 'Präsentation vorbereiten',
    'Kunden kontaktieren', 'Vertrag prüfen', 'Rechnung erstellen',
  ],
  NOTIZ: [
    'Gesprächsnotiz', 'Interne Anmerkung', 'Kundenwunsch vermerkt',
    'Wichtige Information', 'Vereinbarung festgehalten', 'Feedback dokumentiert',
  ],
};

const CHANCE_TITEL_PREFIXE = [
  'Digitalisierungsprojekt', 'Systemumstellung', 'IT-Infrastruktur', 'Softwarelösung',
  'Beratungsmandat', 'Logistikoptimierung', 'Marketingkampagne', 'ERP-Einführung',
  'CRM-Implementierung', 'Cloud-Migration', 'Sicherheitslösung', 'Wartungsvertrag',
  'Servicevereinbarung', 'Liefervertrag', 'Rahmenvereinbarung',
];

const VERTRAG_TITEL_PREFIXE = [
  'Wartungsvertrag', 'Dienstleistungsvertrag', 'Liefervertrag', 'Rahmenvertrag',
  'Lizenzvertrag', 'Servicevertrag', 'Beratervertrag', 'Partnerschaftsvertrag',
  'Mietvertrag', 'Kooperationsvertrag',
];

// ─── Helper functions ─────────────────────────────────────────────────────────

function randPlz(): string {
  return pick(PLZ_PREFIXE) + String(randInt(100, 999));
}

function randPhone(): string {
  return `0${randInt(30, 99)} ${randInt(1000000, 9999999)}`;
}

function randEmail(first: string, last: string, domain: string): string {
  const normalise = (s: string) =>
    s.toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, '');
  return `${normalise(first)}.${normalise(last)}@${normalise(domain)}.de`;
}

function randFirmaEmail(name: string): string {
  const normalise = (s: string) =>
    s.toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const parts = name.split(' ');
  const base = normalise(parts[0]);
  return `info@${base}.de`;
}

function wahrscheinlichkeitForPhase(phase: string): number {
  switch (phase) {
    case 'NEU': return randInt(10, 20);
    case 'QUALIFIZIERT': return randInt(30, 50);
    case 'ANGEBOT': return randInt(50, 70);
    case 'VERHANDLUNG': return randInt(70, 90);
    case 'GEWONNEN': return 100;
    case 'VERLOREN': return 0;
    default: return randInt(10, 90);
  }
}

// ─── Main seeder ──────────────────────────────────────────────────────────────

export function runSeeder(): void {
  // Check if already seeded
  const count = (sqlite.prepare('SELECT COUNT(*) as cnt FROM firma').get() as { cnt: number }).cnt;
  if (count > 0) {
    console.log(`=== Seeder: Datenbank enthält bereits ${count} Firmen, übersprungen ===`);
    return;
  }

  const insertAll = sqlite.transaction(() => {
    // ── 1. Firma ──────────────────────────────────────────────────────────────
    const firmaIds: number[] = [];
    const firmaNamen: string[] = [];
    const firmaStmt = sqlite.prepare(
      `INSERT INTO firma (name, industry, website, phone, email, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    // Build 100 unique company names
    const usedFirmenNamen = new Set<string>();
    while (firmaIds.length < 100) {
      const prefix = pick(FIRMEN_PREFIXE);
      const suffix = pick(FIRMEN_SUFFIXE);
      const rechtsform = pick(FIRMEN_RECHTSFORMEN);
      const name = `${prefix} ${suffix} ${rechtsform}`;
      if (usedFirmenNamen.has(name)) continue;
      usedFirmenNamen.add(name);

      const branche = pick(BRANCHEN);
      const createdAt = randCreatedAt();
      const result = firmaStmt.run(
        name,
        branche,
        `www.${name.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.de`,
        randPhone(),
        randFirmaEmail(name),
        `${branche}-Unternehmen mit Sitz in Deutschland`,
        createdAt,
        createdAt,
      );
      const id = Number(result.lastInsertRowid);
      firmaIds.push(id);
      firmaNamen.push(name);
    }

    // ── 2. Abteilung (~250, 2-3 per firma) ───────────────────────────────────
    const abteilungIds: number[] = [];
    // Map firmaId -> abteilungId list for person assignment
    const firmaAbteilungMap = new Map<number, number[]>();
    const abteilungStmt = sqlite.prepare(
      `INSERT INTO abteilung (name, description, firmaId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`
    );

    for (const firmaId of firmaIds) {
      const count = randInt(2, 3);
      const names = pickN(ABTEILUNGEN_POOL, count);
      const abtIds: number[] = [];
      for (const abtName of names) {
        const createdAt = randCreatedAt();
        const result = abteilungStmt.run(abtName, null, firmaId, createdAt, createdAt);
        const id = Number(result.lastInsertRowid);
        abteilungIds.push(id);
        abtIds.push(id);
      }
      firmaAbteilungMap.set(firmaId, abtIds);
    }

    // ── 3. Person (~600, 5-7 per firma) ──────────────────────────────────────
    const personIds: number[] = [];
    // Map firmaId -> personId list for later use
    const firmaPersonMap = new Map<number, number[]>();
    const personStmt = sqlite.prepare(
      `INSERT INTO person (firstName, lastName, email, phone, position, notes, firmaId, abteilungId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const firmaId of firmaIds) {
      const count = randInt(5, 7);
      const persIds: number[] = [];
      const firmaAbtIds = firmaAbteilungMap.get(firmaId) ?? [];
      for (let i = 0; i < count; i++) {
        const firstName = pick(VORNAMEN);
        const lastName = pick(NACHNAMEN);
        const domain = firmaNamen[firmaIds.indexOf(firmaId)];
        const email = randEmail(firstName, lastName, domain.split(' ')[0]);
        const abteilungId = firmaAbtIds.length > 0 ? pick(firmaAbtIds) : null;
        const createdAt = randCreatedAt();
        const result = personStmt.run(
          firstName,
          lastName,
          email,
          randPhone(),
          pick(POSITIONEN),
          null,
          firmaId,
          abteilungId,
          createdAt,
          createdAt,
        );
        const id = Number(result.lastInsertRowid);
        personIds.push(id);
        persIds.push(id);
      }
      firmaPersonMap.set(firmaId, persIds);
    }

    // ── 4. Adresse (500: 200 firma + 300 person) ──────────────────────────────
    const adresseStmt = sqlite.prepare(
      `INSERT INTO adresse (street, houseNumber, postalCode, city, country, firmaId, personId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    // 200 firma addresses
    const firmaIdsSample = [...firmaIds];
    // Give each firma at least some addresses; cycle through them
    for (let i = 0; i < 200; i++) {
      const firmaId = firmaIdsSample[i % firmaIdsSample.length];
      const createdAt = randCreatedAt();
      adresseStmt.run(
        pick(STRASSEN),
        String(randInt(1, 150)),
        randPlz(),
        pick(STAEDTE),
        'Deutschland',
        firmaId,
        null,
        createdAt,
        createdAt,
      );
    }

    // 300 person addresses
    for (let i = 0; i < 300; i++) {
      const personId = personIds[i % personIds.length];
      const createdAt = randCreatedAt();
      adresseStmt.run(
        pick(STRASSEN),
        String(randInt(1, 99)),
        randPlz(),
        pick(STAEDTE),
        'Deutschland',
        null,
        personId,
        createdAt,
        createdAt,
      );
    }

    // ── 5. Gehalt (~1000, 1-2 per person) ────────────────────────────────────
    const gehaltStmt = sqlite.prepare(
      `INSERT INTO gehalt (amount, currency, typ, effectiveDate, personId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    let gehaltCount = 0;
    for (const personId of personIds) {
      const numGehaelter = randInt(1, 2);
      for (let g = 0; g < numGehaelter; g++) {
        // Distribute across correct GehaltTyp values
        const typRoll = rng();
        let typ: string;
        let amount: number;
        if (typRoll < 0.55) {
          typ = 'GRUNDGEHALT';
          amount = randInt(2800, 9500);
        } else if (typRoll < 0.75) {
          typ = 'BONUS';
          amount = randInt(1000, 20000);
        } else if (typRoll < 0.90) {
          typ = 'PROVISION';
          amount = randInt(500, 15000);
        } else {
          typ = 'SONDERZAHLUNG';
          amount = randInt(500, 10000);
        }
        const effectiveDate = toDateString(randDateBetween(daysAgo(3 * 365), NOW));
        const createdAt = randCreatedAt();
        gehaltStmt.run(
          amount,
          'EUR',
          typ,
          effectiveDate,
          personId,
          createdAt,
          createdAt,
        );
        gehaltCount++;
      }
    }

    // ── 6. Aktivitaet (1000) ──────────────────────────────────────────────────
    const aktivitaetStmt = sqlite.prepare(
      `INSERT INTO aktivitaet (typ, subject, description, datum, firmaId, personId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (let i = 0; i < 1000; i++) {
      const typ = pick(AKTIVITAET_TYPEN);
      const firmaId = pick(firmaIds);
      const firmaPersonIds = firmaPersonMap.get(firmaId) ?? [];
      const personId = firmaPersonIds.length > 0 && rng() > 0.2 ? pick(firmaPersonIds) : null;
      const datum = toIsoDatetime(randDateBetween(daysAgo(2 * 365), NOW));
      const createdAt = randCreatedAt();
      aktivitaetStmt.run(
        typ,
        pick(AKTIVITAET_SUBJECTS[typ]),
        `Aktivität vom Typ ${typ}`,
        datum,
        firmaId,
        personId,
        createdAt,
        createdAt,
      );
    }

    // ── 7. Vertrag (200) ──────────────────────────────────────────────────────
    const vertragStmt = sqlite.prepare(
      `INSERT INTO vertrag (titel, notes, wert, currency, status, startDate, endDate, firmaId, kontaktPersonId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    // Distribution: ~40% AKTIV, ~20% ENTWURF, ~25% ABGELAUFEN, ~15% GEKUENDIGT
    const vertragStatusPool: string[] = [];
    for (let i = 0; i < 40; i++) vertragStatusPool.push('AKTIV');
    for (let i = 0; i < 20; i++) vertragStatusPool.push('ENTWURF');
    for (let i = 0; i < 25; i++) vertragStatusPool.push('ABGELAUFEN');
    for (let i = 0; i < 15; i++) vertragStatusPool.push('GEKUENDIGT');

    for (let i = 0; i < 200; i++) {
      const firmaId = pick(firmaIds);
      const firmaPersonIds = firmaPersonMap.get(firmaId) ?? [];
      const kontaktPersonId = firmaPersonIds.length > 0 ? pick(firmaPersonIds) : null;
      const status = pick(vertragStatusPool);
      const wert = randInt(5000, 500000);
      const prefix = pick(VERTRAG_TITEL_PREFIXE);
      const titel = `${prefix} ${firmaNamen[firmaIds.indexOf(firmaId)].split(' ')[0]}`;

      let startDatum: string | null = null;
      let endDatum: string | null = null;

      if (status === 'AKTIV') {
        startDatum = toDateString(randDateBetween(daysAgo(2 * 365), daysAgo(30)));
        endDatum = toDateString(randDateBetween(daysFromNow(30), daysFromNow(2 * 365)));
      } else if (status === 'ABGELAUFEN') {
        startDatum = toDateString(randDateBetween(daysAgo(4 * 365), daysAgo(400)));
        endDatum = toDateString(randDateBetween(daysAgo(365), daysAgo(30)));
      } else if (status === 'GEKUENDIGT') {
        startDatum = toDateString(randDateBetween(daysAgo(3 * 365), daysAgo(180)));
        endDatum = toDateString(randDateBetween(daysAgo(180), daysAgo(30)));
      } else {
        // ENTWURF — no dates or future
        startDatum = rng() > 0.5 ? toDateString(randDateBetween(daysFromNow(1), daysFromNow(180))) : null;
      }

      const createdAt = randCreatedAt();
      vertragStmt.run(
        titel,
        `Vertrag über ${wert.toLocaleString('de-DE')} EUR`,
        wert,
        'EUR',
        status,
        startDatum,
        endDatum,
        firmaId,
        kontaktPersonId,
        createdAt,
        createdAt,
      );
    }

    // ── 8. Chance (300) ───────────────────────────────────────────────────────
    const chanceStmt = sqlite.prepare(
      `INSERT INTO chance (titel, beschreibung, wert, currency, phase, wahrscheinlichkeit, erwartetesDatum, firmaId, kontaktPersonId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (let i = 0; i < 300; i++) {
      const firmaId = pick(firmaIds);
      const firmaPersonIds = firmaPersonMap.get(firmaId) ?? [];
      const kontaktPersonId = firmaPersonIds.length > 0 ? pick(firmaPersonIds) : null;
      const phase = pick(CHANCE_PHASEN);
      const wahrscheinlichkeit = wahrscheinlichkeitForPhase(phase);
      const wert = randInt(10000, 800000);
      const prefix = pick(CHANCE_TITEL_PREFIXE);
      const titel = `${prefix} ${firmaNamen[firmaIds.indexOf(firmaId)].split(' ')[0]}`;

      // erwartetesDatum: spread across last 2 years and next 1 year
      const erwartetesDatum = toDateString(
        randDateBetween(daysAgo(2 * 365), daysFromNow(365))
      );

      const createdAt = randCreatedAt();
      chanceStmt.run(
        titel,
        `${phase}-Phase Chance im Wert von ${wert.toLocaleString('de-DE')} EUR`,
        wert,
        'EUR',
        phase,
        wahrscheinlichkeit,
        erwartetesDatum,
        firmaId,
        kontaktPersonId,
        createdAt,
        createdAt,
      );
    }

    return {
      firmen: firmaIds.length,
      abteilungen: abteilungIds.length,
      personen: personIds.length,
      gehaelter: gehaltCount,
    };
  });

  const counts = insertAll();

  // Count final values for log message
  const adrCount = (sqlite.prepare('SELECT COUNT(*) as cnt FROM adresse').get() as { cnt: number }).cnt;
  const aktCount = (sqlite.prepare('SELECT COUNT(*) as cnt FROM aktivitaet').get() as { cnt: number }).cnt;
  const vertCount = (sqlite.prepare('SELECT COUNT(*) as cnt FROM vertrag').get() as { cnt: number }).cnt;
  const chanceCount = (sqlite.prepare('SELECT COUNT(*) as cnt FROM chance').get() as { cnt: number }).cnt;

  console.log(
    `=== Seeder: ${counts.firmen} Firmen, ${counts.abteilungen} Abteilungen, ` +
    `${counts.personen} Personen, ${adrCount} Adressen, ${counts.gehaelter} Gehaelter, ` +
    `${aktCount} Aktivitaeten, ${vertCount} Vertraege, ${chanceCount} Chancen erstellt ===`
  );
}
