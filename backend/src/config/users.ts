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
  'FIRMEN',
  'PERSONEN',
  'ABTEILUNGEN',
  'ADRESSEN',
  'AKTIVITAETEN',
  'CHANCEN',
  'BENUTZERVERWALTUNG',
];

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
    benutzername: 'user',
    vorname: 'Test',
    nachname: 'User',
    // test123
    passwordHash: '$2a$10$.5uWhO/HqnIqI4iAl1DhJ.QBXsFoMKjjX2qg/4ExXdbqIMV0Padru',
    roles: ['USER'],
    permissions: ALL_PERMISSIONS,
  },
  {
    id: 3,
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
