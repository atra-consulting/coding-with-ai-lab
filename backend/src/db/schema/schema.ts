import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { TICKET_STATUS } from './enums.js';

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

// ─── agentTask ────────────────────────────────────────────────────────────────
export const agentTask = sqliteTable('agent_task', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  source: text('source').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  status: text('status').notNull().default('OPEN'),
  comment: text('comment'),
  metadata: text('metadata'),
  pickedUpAt: text('pickedUpAt'),
  resolvedAt: text('resolvedAt'),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

// ─── ticket ───────────────────────────────────────────────────────────────────
export const ticket = sqliteTable('ticket', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  owner: text('owner').notNull().default('HUMAN'),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  status: text('status', { enum: TICKET_STATUS }).notNull().default('DEFINITION'),
  solution: text('solution'),
  pickedUpAt: text('pickedUpAt'),
  resolvedAt: text('resolvedAt'),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

// ─── ticketComment ────────────────────────────────────────────────────────────
export const ticketComment = sqliteTable('ticket_comment', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticketId: integer('ticketId')
    .notNull()
    .references(() => ticket.id, { onDelete: 'cascade' }),
  author: text('author').notNull(),
  authorName: text('authorName'),
  body: text('body').notNull(),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
});

// ─── cronRun ──────────────────────────────────────────────────────────────────
export const cronRun = sqliteTable('cron_run', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  job:          text('job').notNull(),
  status:       text('status').notNull(),       // RUNNING | SUCCESS | FAILED | SKIPPED
  trigger:      text('trigger').notNull(),       // CRON | MANUAL
  startedAt:    text('startedAt').notNull(),     // ISO-8601 set explicitly by service — no default
  finishedAt:   text('finishedAt'),
  durationMs:   integer('durationMs'),
  result:       text('result'),
  githubRunUrl: text('githubRunUrl'),
  error:        text('error'),
});

// ─── szenario ─────────────────────────────────────────────────────────────────
export const szenario = sqliteTable('szenario', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  humanSteps: text('humanSteps').notNull(),
  semiAutomatedSteps: text('semiAutomatedSteps').notNull(),
  automatedSteps: text('automatedSteps').notNull(),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

// ─── sessions ─────────────────────────────────────────────────────────────────
// DOCUMENTARY ONLY — the session store (middleware/libsqlSessionStore.ts) reads
// and writes this table via raw client.execute() calls, not through Drizzle.
// Keep in sync with the CREATE TABLE in config/migrate.ts.
export const sessions = sqliteTable('sessions', {
  sid: text('sid').primaryKey(),
  sess: text('sess').notNull(),
  expire: text('expire').notNull(),
});



