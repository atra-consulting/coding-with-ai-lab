import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── firma ────────────────────────────────────────────────────────────────────
export const firma = sqliteTable('firma', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  branche: text('branche'),
  website: text('website'),
  telefon: text('telefon'),
  email: text('email'),
  beschreibung: text('beschreibung'),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

// ─── abteilung ────────────────────────────────────────────────────────────────
export const abteilung = sqliteTable('abteilung', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  firmaId: integer('firmaId')
    .notNull()
    .references(() => firma.id, { onDelete: 'cascade' }),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

// ─── person ───────────────────────────────────────────────────────────────────
export const person = sqliteTable('person', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  firstName: text('firstName').notNull(),
  lastName: text('lastName').notNull(),
  email: text('email'),
  telefon: text('telefon'),
  position: text('position'),
  firmaId: integer('firmaId')
    .notNull()
    .references(() => firma.id, { onDelete: 'cascade' }),
  abteilungId: integer('abteilungId').references(() => abteilung.id, {
    onDelete: 'set null',
  }),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

// ─── adresse ──────────────────────────────────────────────────────────────────
export const adresse = sqliteTable('adresse', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  strasse: text('strasse'),
  hausnummer: text('hausnummer'),
  plz: text('plz'),
  stadt: text('stadt'),
  land: text('land'),
  typ: text('typ'),
  firmaId: integer('firmaId').references(() => firma.id, {
    onDelete: 'cascade',
  }),
  personId: integer('personId').references(() => person.id, {
    onDelete: 'cascade',
  }),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

// ─── aktivitaet ───────────────────────────────────────────────────────────────
export const aktivitaet = sqliteTable('aktivitaet', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  typ: text('typ').notNull(),
  subject: text('subject').notNull(),
  beschreibung: text('beschreibung'),
  datum: text('datum').notNull(),
  firmaId: integer('firmaId').references(() => firma.id, {
    onDelete: 'cascade',
  }),
  personId: integer('personId').references(() => person.id, {
    onDelete: 'cascade',
  }),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

// ─── chance ───────────────────────────────────────────────────────────────────
export const chance = sqliteTable('chance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  titel: text('titel').notNull(),
  beschreibung: text('beschreibung'),
  wert: real('wert'),
  phase: text('phase').notNull().default('LEAD'),
  wahrscheinlichkeit: integer('wahrscheinlichkeit'),
  erwartetesDatum: text('erwartetesDatum'),
  firmaId: integer('firmaId')
    .notNull()
    .references(() => firma.id, { onDelete: 'cascade' }),
  kontaktPersonId: integer('kontaktPersonId').references(() => person.id, {
    onDelete: 'set null',
  }),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

// ─── vertrag ──────────────────────────────────────────────────────────────────
export const vertrag = sqliteTable('vertrag', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  titel: text('titel').notNull(),
  beschreibung: text('beschreibung'),
  wert: real('wert'),
  status: text('status').notNull().default('ENTWURF'),
  startDatum: text('startDatum'),
  endDatum: text('endDatum'),
  firmaId: integer('firmaId')
    .notNull()
    .references(() => firma.id, { onDelete: 'cascade' }),
  kontaktPersonId: integer('kontaktPersonId').references(() => person.id, {
    onDelete: 'set null',
  }),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

// ─── gehalt ───────────────────────────────────────────────────────────────────
export const gehalt = sqliteTable('gehalt', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  amount: real('amount').notNull(),
  typ: text('typ').notNull().default('MONATLICH'),
  effectiveDate: text('effectiveDate').notNull(),
  beschreibung: text('beschreibung'),
  personId: integer('personId')
    .notNull()
    .references(() => person.id, { onDelete: 'cascade' }),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

// ─── savedReport ──────────────────────────────────────────────────────────────
export const savedReport = sqliteTable('savedReport', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  beschreibung: text('beschreibung'),
  queryJson: text('queryJson').notNull(),
  benutzerId: integer('benutzerId').notNull(),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

// ─── dashboardConfig ──────────────────────────────────────────────────────────
export const dashboardConfig = sqliteTable('dashboardConfig', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  benutzerId: integer('benutzerId').notNull().unique(),
  visibleWidgets: text('visibleWidgets').notNull(),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});
