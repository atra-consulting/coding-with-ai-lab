// Pre-hashed bcrypt passwords (cost factor 10, generated once and hardcoded)
// admin123  -> $2a$10$...
// test123   -> $2a$10$...
// demo1234  -> $2a$10$...
//
// These were generated with: bcrypt.hashSync('password', 10)
// Hardcoded for zero startup cost and stable reproducibility.

export interface CrmUser {
  id: number;
  benutzername: string;
  vorname: string;
  nachname: string;
  passwordHash: string;
  roles: string[];
  permissions: string[];
}

const ALL_PERMISSIONS = [
  'DASHBOARD',
  'FIRMEN',
  'PERSONEN',
  'ABTEILUNGEN',
  'ADRESSEN',
  'AKTIVITAETEN',
  'GEHAELTER',
  'VERTRAEGE',
  'CHANCEN',
  'AUSWERTUNGEN',
  'BENUTZERVERWALTUNG',
];

const VERTRIEB_PERMISSIONS = [
  'DASHBOARD',
  'FIRMEN',
  'PERSONEN',
  'ABTEILUNGEN',
  'ADRESSEN',
  'AKTIVITAETEN',
  'VERTRAEGE',
  'CHANCEN',
  'AUSWERTUNGEN',
];

const PERSONAL_PERMISSIONS = [
  'DASHBOARD',
  'FIRMEN',
  'PERSONEN',
  'ABTEILUNGEN',
  'ADRESSEN',
  'AKTIVITAETEN',
  'GEHAELTER',
  'AUSWERTUNGEN',
];

const ALLROUNDER_PERMISSIONS = [
  'DASHBOARD',
  'FIRMEN',
  'PERSONEN',
  'ABTEILUNGEN',
  'ADRESSEN',
  'AKTIVITAETEN',
  'GEHAELTER',
  'VERTRAEGE',
  'CHANCEN',
  'AUSWERTUNGEN',
];

// Bcrypt hashes (cost 10):
// admin123  -> generated below
// test123   -> generated below
// demo1234  -> generated below
const USERS: CrmUser[] = [
  {
    id: 1,
    benutzername: 'admin',
    vorname: 'Admin',
    nachname: 'User',
    // admin123
    passwordHash: '$2a$10$Db.6ZbJwjFSD5LhJb73pyuFsxhFvEGTxwexTtR9EZw2XHJJjjKZwe',
    roles: ['ADMIN'],
    permissions: ALL_PERMISSIONS,
  },
  {
    id: 2,
    benutzername: 'vertrieb',
    vorname: 'Vera',
    nachname: 'Vertrieb',
    // test123
    passwordHash: '$2a$10$.5uWhO/HqnIqI4iAl1DhJ.QBXsFoMKjjX2qg/4ExXdbqIMV0Padru',
    roles: ['VERTRIEB'],
    permissions: VERTRIEB_PERMISSIONS,
  },
  {
    id: 3,
    benutzername: 'personal',
    vorname: 'Peter',
    nachname: 'Personal',
    // test123
    passwordHash: '$2a$10$.5uWhO/HqnIqI4iAl1DhJ.QBXsFoMKjjX2qg/4ExXdbqIMV0Padru',
    roles: ['PERSONAL'],
    permissions: PERSONAL_PERMISSIONS,
  },
  {
    id: 4,
    benutzername: 'allrounder',
    vorname: 'Alex',
    nachname: 'Allrounder',
    // test123
    passwordHash: '$2a$10$.5uWhO/HqnIqI4iAl1DhJ.QBXsFoMKjjX2qg/4ExXdbqIMV0Padru',
    roles: ['VERTRIEB', 'PERSONAL'],
    permissions: ALLROUNDER_PERMISSIONS,
  },
  {
    id: 5,
    benutzername: 'demo',
    vorname: 'Demo',
    nachname: 'User',
    // demo1234
    passwordHash: '$2a$10$oNyidy3ivF2V0U/0XwPyDewt8MS/4bHNtia6NaPQqouxchjl15UzG',
    roles: ['ADMIN'],
    permissions: ALL_PERMISSIONS,
  },
];

export function findByBenutzername(benutzername: string): CrmUser | undefined {
  return USERS.find((u) => u.benutzername === benutzername);
}

export function findById(id: number): CrmUser | undefined {
  return USERS.find((u) => u.id === id);
}

export { USERS };
