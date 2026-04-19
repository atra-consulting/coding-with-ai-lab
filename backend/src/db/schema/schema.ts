import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── firma ────────────────────────────────────────────────────────────────────
export const firma = sqliteTable('firma', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  industry: text('industry'),
  website: text('website'),
  phone: text('phone'),
  email: text('email'),
  notes: text('notes'),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

// ─── abteilung ────────────────────────────────────────────────────────────────
export const abteilung = sqliteTable('abteilung', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
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
  phone: text('phone'),
  position: text('position'),
  notes: text('notes'),
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
  street: text('street'),
  houseNumber: text('houseNumber'),
  postalCode: text('postalCode'),
  city: text('city'),
  country: text('country'),
  latitude: real('latitude'),
  longitude: real('longitude'),
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
  description: text('description'),
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
  currency: text('currency').notNull().default('EUR'),
  phase: text('phase').notNull().default('NEU'),
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
  notes: text('notes'),
  wert: real('wert'),
  currency: text('currency').notNull().default('EUR'),
  status: text('status').notNull().default('ENTWURF'),
  startDate: text('startDate'),
  endDate: text('endDate'),
  firmaId: integer('firmaId')
    .notNull()
    .references(() => firma.id, { onDelete: 'cascade' }),
  kontaktPersonId: integer('kontaktPersonId').references(() => person.id, {
    onDelete: 'set null',
  }),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});


