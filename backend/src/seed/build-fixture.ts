// DEV TOOL — not called at runtime.
// Regenerates backend/src/seed/fixture.json after schema changes.
// Run with: cd backend && npx tsx src/seed/build-fixture.ts
// The 25 firma addresses are real, geocoded via Nominatim (OpenStreetMap).
// All other data is deterministically generated via mulberry32(seed=42).
//
// When adding a new column or entity: update the Drizzle schema and
// config/migrate.ts, extend this generator to emit the new column,
// regenerate fixture.json, and add the column to INSERT_SQL in
// seed/dataMigration.ts.

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
const randInt = (min: number, max: number): number =>
  Math.floor(rng() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => {
  const tagged = arr.map((x) => ({ x, r: rng() }));
  tagged.sort((a, b) => a.r - b.r);
  return tagged.slice(0, n).map((t) => t.x);
};

// ─── Dates ────────────────────────────────────────────────────────────────────
const NOW = new Date('2026-04-07T00:00:00Z');
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86400000);
const daysFromNow = (d: number) => new Date(NOW.getTime() + d * 86400000);
const randDateBetween = (from: Date, to: Date) =>
  new Date(from.getTime() + rng() * (to.getTime() - from.getTime()));
const toIsoDt = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 19);
const toDate = (d: Date) => d.toISOString().substring(0, 10);
const randCreatedAt = () => toIsoDt(randDateBetween(daysAgo(3 * 365), NOW));

// ─── 25 Firma seeds with real geocoded addresses ──────────────────────────────
interface FirmaSeed {
  name: string;
  industry: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  latitude: number;
  longitude: number;
}
const FIRMA_SEEDS: FirmaSeed[] = [
  { name: 'Müller Technik GmbH',            industry: 'Technologie',      street: 'Unter den Linden',   houseNumber: '5',   postalCode: '10117', city: 'Berlin',            latitude: 52.5171465, longitude: 13.3961451 },
  { name: 'Schmidt Bau AG',                 industry: 'Bauwesen',         street: 'Potsdamer Platz',    houseNumber: '1',   postalCode: '10785', city: 'Berlin',            latitude: 52.5087373, longitude: 13.3744724 },
  { name: 'Weber Handel GmbH & Co. KG',     industry: 'Handel',           street: 'Friedrichstraße',    houseNumber: '100', postalCode: '10117', city: 'Berlin',            latitude: 52.5204347, longitude: 13.3884072 },
  { name: 'Fischer Logistik GmbH',          industry: 'Logistik',         street: 'Kurfürstendamm',     houseNumber: '20',  postalCode: '10719', city: 'Berlin',            latitude: 52.5038972, longitude: 13.3304268 },
  { name: 'Meyer Consulting AG',            industry: 'Beratung',         street: 'Alexanderplatz',     houseNumber: '1',   postalCode: '10178', city: 'Berlin',            latitude: 52.5215059, longitude: 13.4123809 },
  { name: 'Wagner Services GmbH',           industry: 'Beratung',         street: 'Mönckebergstraße',   houseNumber: '10',  postalCode: '20095', city: 'Hamburg',           latitude: 53.5515853, longitude: 10.0025436 },
  { name: 'Becker Solutions GmbH',          industry: 'Technologie',      street: 'Jungfernstieg',      houseNumber: '30',  postalCode: '20354', city: 'Hamburg',           latitude: 53.5537296, longitude: 9.9906367  },
  { name: 'Schulz Industrie AG',            industry: 'Industrie',        street: 'Reeperbahn',         houseNumber: '1',   postalCode: '20359', city: 'Hamburg',           latitude: 53.5496762, longitude: 9.9676124  },
  { name: 'Hoffmann Systeme GmbH',          industry: 'Technologie',      street: 'Marienplatz',        houseNumber: '1',   postalCode: '80331', city: 'München',           latitude: 48.1374990, longitude: 11.5747545 },
  { name: 'Schäfer Gruppe AG',              industry: 'Handel',           street: 'Maximilianstraße',   houseNumber: '10',  postalCode: '80539', city: 'München',           latitude: 48.1389277, longitude: 11.5800675 },
  { name: 'Koch Engineering GmbH',          industry: 'Maschinenbau',     street: 'Sendlinger Straße',  houseNumber: '20',  postalCode: '80331', city: 'München',           latitude: 48.1354975, longitude: 11.5704575 },
  { name: 'Richter Digital GmbH',           industry: 'Medien',           street: 'Hohe Straße',        houseNumber: '50',  postalCode: '50667', city: 'Köln',              latitude: 50.9361803, longitude: 6.9563345  },
  { name: 'Klein Media AG',                 industry: 'Medien',           street: 'Schildergasse',      houseNumber: '100', postalCode: '50667', city: 'Köln',              latitude: 50.9367333, longitude: 6.9508161  },
  { name: 'Wolf Energie GmbH',              industry: 'Energie',          street: 'Zeil',               houseNumber: '80',  postalCode: '60313', city: 'Frankfurt am Main', latitude: 50.1144314, longitude: 8.6829851  },
  { name: 'Schröder Finanz AG',             industry: 'Finanzen',         street: 'Goethestraße',       houseNumber: '5',   postalCode: '60313', city: 'Frankfurt am Main', latitude: 50.1136040, longitude: 8.6756465  },
  { name: 'Neumann Software GmbH',          industry: 'Technologie',      street: 'Königstraße',        houseNumber: '40',  postalCode: '70173', city: 'Stuttgart',         latitude: 48.7772022, longitude: 9.1768236  },
  { name: 'Schwarz Automotive AG',          industry: 'Automobilbranche', street: 'Schlossplatz',       houseNumber: '1',   postalCode: '70173', city: 'Stuttgart',         latitude: 48.7783234, longitude: 9.1775761  },
  { name: 'Zimmermann Immobilien GmbH',     industry: 'Immobilien',       street: 'Königsallee',        houseNumber: '30',  postalCode: '40212', city: 'Düsseldorf',        latitude: 51.2244563, longitude: 6.7800349  },
  { name: 'Braun Transport GmbH',           industry: 'Logistik',         street: 'Grimmaische Straße', houseNumber: '10',  postalCode: '04109', city: 'Leipzig',           latitude: 51.3394072, longitude: 12.3774194 },
  { name: 'Krüger Industrie GmbH & Co. KG', industry: 'Industrie',        street: 'Westenhellweg',      houseNumber: '50',  postalCode: '44137', city: 'Dortmund',          latitude: 51.5141100, longitude: 7.4588044  },
  { name: 'Hartmann Technik GmbH',          industry: 'Elektroindustrie', street: 'Kettwiger Straße',   houseNumber: '20',  postalCode: '45127', city: 'Essen',             latitude: 51.4537482, longitude: 7.0130673  },
  { name: 'Lange Handel GmbH',              industry: 'Handel',           street: 'Obernstraße',        houseNumber: '30',  postalCode: '28195', city: 'Bremen',            latitude: 53.0769690, longitude: 8.8052611  },
  { name: 'Schmitt Engineering AG',         industry: 'Maschinenbau',     street: 'Prager Straße',      houseNumber: '10',  postalCode: '01069', city: 'Dresden',           latitude: 51.0458039, longitude: 13.7365873 },
  { name: 'Werner Holding AG',              industry: 'Finanzen',         street: 'Georgstraße',        houseNumber: '15',  postalCode: '30159', city: 'Hannover',          latitude: 52.3757617, longitude: 9.7342961  },
  { name: 'Schneider Automotive GmbH',      industry: 'Automobilbranche', street: 'Karolinenstraße',    houseNumber: '10',  postalCode: '90402', city: 'Nürnberg',          latitude: 49.4509645, longitude: 11.0777527 },
];

// ─── 25 Niederlassung (branch) addresses, parallel to FIRMA_SEEDS by index ────
interface BranchSeed {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  latitude: number;
  longitude: number;
}
const BRANCH_SEEDS: BranchSeed[] = [
  { street: 'Leopoldstraße',        houseNumber: '5',   postalCode: '80802', city: 'München',      latitude: 48.1541199, longitude: 11.5823151 },
  { street: 'Spitalerstraße',       houseNumber: '10',  postalCode: '20095', city: 'Hamburg',      latitude: 53.5522627, longitude: 10.0029745 },
  { street: 'Breite Straße',        houseNumber: '20',  postalCode: '50667', city: 'Köln',         latitude: 50.9391523, longitude: 6.9526733  },
  { street: 'Kaiserstraße',         houseNumber: '30',  postalCode: '60329', city: 'Frankfurt am Main', latitude: 50.1100651, longitude: 8.6732525 },
  { street: 'Calwer Straße',        houseNumber: '10',  postalCode: '70173', city: 'Stuttgart',    latitude: 48.7752655, longitude: 9.1730846  },
  { street: 'Leipziger Straße',     houseNumber: '50',  postalCode: '10117', city: 'Berlin',       latitude: 52.5107184, longitude: 13.4008696 },
  { street: 'Theatinerstraße',      houseNumber: '10',  postalCode: '80333', city: 'München',      latitude: 48.1395683, longitude: 11.5759151 },
  { street: 'Kampstraße',           houseNumber: '40',  postalCode: '44137', city: 'Dortmund',     latitude: 51.5150944, longitude: 7.4596355  },
  { street: 'Breite Gasse',         houseNumber: '20',  postalCode: '90402', city: 'Nürnberg',     latitude: 49.4501087, longitude: 11.0762691 },
  { street: 'Petersstraße',         houseNumber: '15',  postalCode: '04109', city: 'Leipzig',      latitude: 51.3387894, longitude: 12.3750043 },
  { street: 'Annastraße',           houseNumber: '10',  postalCode: '86150', city: 'Augsburg',     latitude: 48.3691463, longitude: 10.8961117 },
  { street: 'Schadowstraße',        houseNumber: '40',  postalCode: '40212', city: 'Düsseldorf',   latitude: 51.2266071, longitude: 6.7830266  },
  { street: 'Remigiusstraße',       houseNumber: '20',  postalCode: '53111', city: 'Bonn',         latitude: 50.7345280, longitude: 7.1000316  },
  { street: 'Am Brand',             houseNumber: '10',  postalCode: '55116', city: 'Mainz',        latitude: 50.0002675, longitude: 8.2743815  },
  { street: 'Kirchgasse',           houseNumber: '20',  postalCode: '65183', city: 'Wiesbaden',    latitude: 50.0793140, longitude: 8.2378751  },
  { street: 'Kaiserstraße',         houseNumber: '50',  postalCode: '76133', city: 'Karlsruhe',    latitude: 49.0096142, longitude: 8.4068933  },
  { street: 'Theresienstraße',      houseNumber: '5',   postalCode: '85049', city: 'Ingolstadt',   latitude: 48.7642731, longitude: 11.4236893 },
  { street: 'Limbecker Platz',      houseNumber: '1',   postalCode: '45127', city: 'Essen',        latitude: 51.4561430, longitude: 7.0050310  },
  { street: 'Leipziger Straße',     houseNumber: '10',  postalCode: '06108', city: 'Halle',        latitude: 51.4820153, longitude: 11.9733705 },
  { street: 'Kortumstraße',         houseNumber: '30',  postalCode: '44787', city: 'Bochum',       latitude: 51.4778879, longitude: 7.2169847  },
  { street: 'Königstraße',          houseNumber: '20',  postalCode: '47051', city: 'Duisburg',     latitude: 51.4495969, longitude: 6.7142880  },
  { street: 'Lange Straße',         houseNumber: '40',  postalCode: '26122', city: 'Oldenburg',    latitude: 53.1397384, longitude: 8.2132708  },
  { street: 'Innere Klosterstraße', houseNumber: '5',   postalCode: '09111', city: 'Chemnitz',     latitude: 50.8340275, longitude: 12.9180671 },
  { street: 'Damm',                 houseNumber: '10',  postalCode: '38100', city: 'Braunschweig', latitude: 52.2623618, longitude: 10.5245457 },
  { street: 'Maximilianstraße',     houseNumber: '5',   postalCode: '93047', city: 'Regensburg',   latitude: 49.0173304, longitude: 12.1007100 },
];

// ─── Data pools ───────────────────────────────────────────────────────────────
const VORNAMEN = [
  'Alexander','Anna','Benjamin','Christian','Daniel','Elena','Felix','Franziska','Hannah','Jan',
  'Julia','Katharina','Laura','Lukas','Maria','Markus','Martin','Michael','Nicole','Oliver',
  'Peter','Philipp','Sandra','Sebastian','Sophia','Stefan','Thomas','Tobias',
];
const NACHNAMEN = [
  'Bauer','Becker','Dietrich','Engel','Fischer','Frank','Friedrich','Graf','Hartmann','Herrmann',
  'Hoffmann','Kaiser','Klein','König','Krause','Krüger','Lange','Lehmann','Maier','Neumann',
  'Peters','Richter','Schäfer','Schmidt','Schmitt','Schneider','Schröder','Schulz','Schwarz',
  'Simon','Wagner','Weber','Werner','Zimmermann',
];
const ABTEILUNGEN_POOL = [
  'Vertrieb','Marketing','IT','HR','Finanzen','Produktion','Einkauf','Recht','Forschung','Logistik',
];
const POSITIONEN = [
  'Geschäftsführer','Prokurist','Abteilungsleiter','Teamleiter','Manager','Projektleiter',
  'Sachbearbeiter','Consultant','Vertriebsleiter','Key Account Manager','Entwickler',
  'Buchhalter','Controller','HR Business Partner','Einkäufer',
];
const STRASSEN_PERSON = [
  'Hauptstraße','Bahnhofstraße','Gartenstraße','Schulstraße','Kirchstraße','Ringstraße',
  'Bergstraße','Waldstraße','Lindenstraße','Mozartstraße','Goethestraße','Schillerstraße',
  'Marktstraße','Parkstraße','Rosenstraße',
];
const PERSON_STAEDTE = [
  'Berlin','Hamburg','München','Köln','Frankfurt am Main','Stuttgart','Düsseldorf','Leipzig',
  'Dortmund','Essen','Bremen','Dresden','Hannover','Nürnberg','Bonn','Münster','Bielefeld',
];
const AKTIVITAET_TYPEN = ['ANRUF','EMAIL','MEETING','AUFGABE','NOTIZ'] as const;
const AKTIVITAET_SUBJECTS: Record<string, string[]> = {
  ANRUF: ['Erstgespräch geführt','Rückruf vereinbart','Produktpräsentation besprochen','Angebot nachgefasst','Technische Fragen geklärt','Kundenfeedback eingeholt'],
  EMAIL: ['Angebot versendet','Unterlagen zugesendet','Termin bestätigt','Follow-up E-Mail','Newsletter versandt','Angebotsunterlagen übermittelt'],
  MEETING: ['Kick-off Meeting','Projektbesprechung','Quartalsreview','Preisverhandlung','Produktdemonstration','Statusmeeting','Strategiebesprechung'],
  AUFGABE: ['Angebot erstellen','Unterlagen zusammenstellen','Präsentation vorbereiten','Kunden kontaktieren','Angebot prüfen','Rechnung erstellen'],
  NOTIZ: ['Gesprächsnotiz','Interne Anmerkung','Kundenwunsch vermerkt','Wichtige Information','Vereinbarung notiert','Feedback dokumentiert'],
};
const CHANCE_PHASEN = ['NEU','QUALIFIZIERT','ANGEBOT','VERHANDLUNG','GEWONNEN','VERLOREN'] as const;
const CHANCE_TITEL_PREFIXE = [
  'Digitalisierungsprojekt','Systemumstellung','IT-Infrastruktur','Softwarelösung','Beratungsmandat',
  'Logistikoptimierung','ERP-Einführung','CRM-Implementierung','Cloud-Migration','Sicherheitslösung',
  'Wartungspaket','Lieferauftrag',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
const randPhone = () => `0${randInt(30, 99)} ${randInt(1000000, 9999999)}`;
const randPlz = () => `${randInt(10, 99)}${String(randInt(100, 999))}`;
function wahrscheinlichkeitForPhase(p: string): number {
  switch (p) {
    case 'NEU': return randInt(10, 20);
    case 'QUALIFIZIERT': return randInt(30, 50);
    case 'ANGEBOT': return randInt(50, 70);
    case 'VERHANDLUNG': return randInt(70, 90);
    case 'GEWONNEN': return 100;
    case 'VERLOREN': return 0;
    default: return randInt(10, 90);
  }
}

// ─── Row containers ───────────────────────────────────────────────────────────
interface FirmaRow { id: number; name: string; industry: string; website: string; phone: string; email: string; notes: string; createdAt: string; updatedAt: string; }
interface AbteilungRow { id: number; name: string; description: string | null; firmaId: number; createdAt: string; updatedAt: string; }
interface PersonRow { id: number; firstName: string; lastName: string; email: string; phone: string; position: string; notes: string | null; firmaId: number; abteilungId: number | null; createdAt: string; updatedAt: string; }
interface AdresseRow { id: number; street: string; houseNumber: string; postalCode: string; city: string; country: string; latitude: number | null; longitude: number | null; typ: string | null; firmaId: number | null; personId: number | null; createdAt: string; updatedAt: string; }
interface AktivitaetRow { id: number; typ: string; subject: string; description: string; datum: string; firmaId: number | null; personId: number | null; createdAt: string; updatedAt: string; }
interface ChanceRow { id: number; titel: string; beschreibung: string; wert: number; currency: string; phase: string; wahrscheinlichkeit: number; erwartetesDatum: string; firmaId: number; kontaktPersonId: number | null; createdAt: string; updatedAt: string; }

const firma: FirmaRow[] = [];
const abteilung: AbteilungRow[] = [];
const person: PersonRow[] = [];
const adresse: AdresseRow[] = [];
const aktivitaet: AktivitaetRow[] = [];
const chance: ChanceRow[] = [];

const firmaAbteilungenMap = new Map<number, number[]>();
const firmaPersonenMap = new Map<number, number[]>();

// ─── 1. Firma (25) ────────────────────────────────────────────────────────────
FIRMA_SEEDS.forEach((seed, idx) => {
  const id = idx + 1;
  const createdAt = randCreatedAt();
  const slug = normalise(seed.name.split(' ')[0]);
  firma.push({
    id,
    name: seed.name,
    industry: seed.industry,
    website: `www.${slug}.de`,
    phone: randPhone(),
    email: `info@${slug}.de`,
    notes: `${seed.industry}-Unternehmen mit Sitz in ${seed.city}`,
    createdAt,
    updatedAt: createdAt,
  });
});

// ─── 2. Abteilung (50, 2 per firma) ───────────────────────────────────────────
let abteilungCounter = 1;
for (const f of firma) {
  const names = pickN(ABTEILUNGEN_POOL, 2);
  const ids: number[] = [];
  for (const abtName of names) {
    const createdAt = randCreatedAt();
    const id = abteilungCounter++;
    abteilung.push({ id, name: abtName, description: null, firmaId: f.id, createdAt, updatedAt: createdAt });
    ids.push(id);
  }
  firmaAbteilungenMap.set(f.id, ids);
}

// ─── 3. Person (100, 4 per firma) ─────────────────────────────────────────────
let personCounter = 1;
for (const f of firma) {
  const ids: number[] = [];
  const slug = normalise(f.name.split(' ')[0]);
  const abtIds = firmaAbteilungenMap.get(f.id)!;
  for (let i = 0; i < 4; i++) {
    const firstName = pick(VORNAMEN);
    const lastName = pick(NACHNAMEN);
    const createdAt = randCreatedAt();
    const id = personCounter++;
    person.push({
      id,
      firstName,
      lastName,
      email: `${normalise(firstName)}.${normalise(lastName)}@${slug}.de`,
      phone: randPhone(),
      position: pick(POSITIONEN),
      notes: null,
      firmaId: f.id,
      abteilungId: pick(abtIds),
      createdAt,
      updatedAt: createdAt,
    });
    ids.push(id);
  }
  firmaPersonenMap.set(f.id, ids);
}

// ─── 4. Adresse (25 HQ + 25 Niederlassung + 50 person = 100) ──────────────────
let adresseCounter = 1;
// Hauptquartier: one per firma
FIRMA_SEEDS.forEach((seed, idx) => {
  const firmaId = idx + 1;
  const createdAt = randCreatedAt();
  adresse.push({
    id: adresseCounter++,
    street: seed.street,
    houseNumber: seed.houseNumber,
    postalCode: seed.postalCode,
    city: seed.city,
    country: 'Deutschland',
    latitude: seed.latitude,
    longitude: seed.longitude,
    typ: 'HAUPTQUARTIER',
    firmaId,
    personId: null,
    createdAt,
    updatedAt: createdAt,
  });
});
// Niederlassung: one per firma
BRANCH_SEEDS.forEach((branch, idx) => {
  const firmaId = idx + 1;
  const createdAt = randCreatedAt();
  adresse.push({
    id: adresseCounter++,
    street: branch.street,
    houseNumber: branch.houseNumber,
    postalCode: branch.postalCode,
    city: branch.city,
    country: 'Deutschland',
    latitude: branch.latitude,
    longitude: branch.longitude,
    typ: 'NIEDERLASSUNG',
    firmaId,
    personId: null,
    createdAt,
    updatedAt: createdAt,
  });
});
// Person addresses (no typ, no coords)
const personenSample = pickN(person, 50);
for (const p of personenSample) {
  const createdAt = randCreatedAt();
  adresse.push({
    id: adresseCounter++,
    street: pick(STRASSEN_PERSON),
    houseNumber: String(randInt(1, 99)),
    postalCode: randPlz(),
    city: pick(PERSON_STAEDTE),
    country: 'Deutschland',
    latitude: null,
    longitude: null,
    typ: null,
    firmaId: null,
    personId: p.id,
    createdAt,
    updatedAt: createdAt,
  });
}

// ─── 5. Aktivitaet (75) ───────────────────────────────────────────────────────
for (let i = 0; i < 75; i++) {
  const typ = pick([...AKTIVITAET_TYPEN]);
  const f = pick(firma);
  const persIds = firmaPersonenMap.get(f.id)!;
  const personId = rng() > 0.2 ? pick(persIds) : null;
  const datum = toIsoDt(randDateBetween(daysAgo(2 * 365), NOW));
  const createdAt = randCreatedAt();
  aktivitaet.push({
    id: i + 1,
    typ,
    subject: pick(AKTIVITAET_SUBJECTS[typ]),
    description: `Aktivität vom Typ ${typ}`,
    datum,
    firmaId: f.id,
    personId,
    createdAt,
    updatedAt: createdAt,
  });
}

// ─── 6. Chance (40) ───────────────────────────────────────────────────────────
for (let i = 0; i < 40; i++) {
  const f = pick(firma);
  const persIds = firmaPersonenMap.get(f.id)!;
  const kontaktPersonId = pick(persIds);
  const phase = pick([...CHANCE_PHASEN]);
  const wahrscheinlichkeit = wahrscheinlichkeitForPhase(phase);
  const wert = randInt(10000, 800000);
  const prefix = pick(CHANCE_TITEL_PREFIXE);
  const erwartetesDatum = toDate(randDateBetween(daysAgo(2 * 365), daysFromNow(365)));
  const createdAt = randCreatedAt();
  chance.push({
    id: i + 1,
    titel: `${prefix} ${f.name.split(' ')[0]}`,
    beschreibung: `${phase}-Phase Chance im Wert von ${wert.toLocaleString('de-DE')} EUR`,
    wert,
    currency: 'EUR',
    phase,
    wahrscheinlichkeit,
    erwartetesDatum,
    firmaId: f.id,
    kontaktPersonId,
    createdAt,
    updatedAt: createdAt,
  });
}

// ─── Write ────────────────────────────────────────────────────────────────────
const fixture = { firma, abteilung, person, adresse, aktivitaet, chance };
const outPath = join(__dirname, 'fixture.json');
writeFileSync(outPath, JSON.stringify(fixture, null, 2) + '\n', 'utf8');

const total = firma.length + abteilung.length + person.length + adresse.length
  + aktivitaet.length + chance.length;
console.log(`Wrote ${outPath}`);
console.log(`  firma:      ${firma.length}`);
console.log(`  abteilung:  ${abteilung.length}`);
console.log(`  person:     ${person.length}`);
console.log(`  adresse:    ${adresse.length}  (${FIRMA_SEEDS.length} HQ + ${BRANCH_SEEDS.length} Niederlassung, all with lat/lng, + ${adresse.length - FIRMA_SEEDS.length - BRANCH_SEEDS.length} person)`);
console.log(`  aktivitaet: ${aktivitaet.length}`);
console.log(`  chance:     ${chance.length}`);
console.log(`  TOTAL:      ${total}`);
