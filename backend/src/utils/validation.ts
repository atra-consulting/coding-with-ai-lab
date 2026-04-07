import { z } from 'zod';
import { ValidationError } from './errors.js';
import {
  CHANCE_PHASE,
  VERTRAG_STATUS,
  AKTIVITAET_TYP,
  GEHALT_TYP,
} from '../db/schema/enums.js';

// ─── Firma ────────────────────────────────────────────────────────────────────
export const FirmaCreateSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(255),
  branche: z.string().max(255).optional().nullable(),
  website: z.string().max(500).optional().nullable(),
  telefon: z.string().max(50).optional().nullable(),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().nullable().or(z.literal('')),
  beschreibung: z.string().optional().nullable(),
});
export type FirmaCreateDTO = z.infer<typeof FirmaCreateSchema>;

// ─── Person ───────────────────────────────────────────────────────────────────
export const PersonCreateSchema = z.object({
  firstName: z.string().min(1, 'Vorname ist erforderlich').max(100),
  lastName: z.string().min(1, 'Nachname ist erforderlich').max(100),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().nullable().or(z.literal('')),
  telefon: z.string().max(50).optional().nullable(),
  position: z.string().max(255).optional().nullable(),
  firmaId: z.number().int().positive('Firma ist erforderlich'),
  abteilungId: z.number().int().positive().optional().nullable(),
});
export type PersonCreateDTO = z.infer<typeof PersonCreateSchema>;

// ─── Abteilung ────────────────────────────────────────────────────────────────
export const AbteilungCreateSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(255),
  firmaId: z.number().int().positive('Firma ist erforderlich'),
});
export type AbteilungCreateDTO = z.infer<typeof AbteilungCreateSchema>;

// ─── Adresse ──────────────────────────────────────────────────────────────────
export const AdresseCreateSchema = z.object({
  strasse: z.string().max(255).optional().nullable(),
  hausnummer: z.string().max(20).optional().nullable(),
  plz: z.string().max(20).optional().nullable(),
  stadt: z.string().max(100).optional().nullable(),
  land: z.string().max(100).optional().nullable(),
  typ: z.string().max(50).optional().nullable(),
  firmaId: z.number().int().positive().optional().nullable(),
  personId: z.number().int().positive().optional().nullable(),
});
export type AdresseCreateDTO = z.infer<typeof AdresseCreateSchema>;

// ─── Aktivitaet ───────────────────────────────────────────────────────────────
export const AktivitaetCreateSchema = z.object({
  typ: z.enum(AKTIVITAET_TYP, { errorMap: () => ({ message: 'Ungültiger Typ' }) }),
  subject: z.string().min(1, 'Betreff ist erforderlich').max(255),
  beschreibung: z.string().optional().nullable(),
  datum: z.string().min(1, 'Datum ist erforderlich'),
  firmaId: z.number().int().positive().optional().nullable(),
  personId: z.number().int().positive().optional().nullable(),
});
export type AktivitaetCreateDTO = z.infer<typeof AktivitaetCreateSchema>;

// ─── Chance ───────────────────────────────────────────────────────────────────
export const ChanceCreateSchema = z.object({
  titel: z.string().min(1, 'Titel ist erforderlich').max(255),
  beschreibung: z.string().optional().nullable(),
  wert: z.number().optional().nullable(),
  phase: z.enum(CHANCE_PHASE, { errorMap: () => ({ message: 'Ungültige Phase' }) }).optional(),
  wahrscheinlichkeit: z.number().int().min(0).max(100).optional().nullable(),
  erwartetesDatum: z.string().optional().nullable(),
  firmaId: z.number().int().positive('Firma ist erforderlich'),
  kontaktPersonId: z.number().int().positive().optional().nullable(),
});
export type ChanceCreateDTO = z.infer<typeof ChanceCreateSchema>;

// ─── Vertrag ──────────────────────────────────────────────────────────────────
export const VertragCreateSchema = z.object({
  titel: z.string().min(1, 'Titel ist erforderlich').max(255),
  beschreibung: z.string().optional().nullable(),
  wert: z.number().optional().nullable(),
  status: z.enum(VERTRAG_STATUS, { errorMap: () => ({ message: 'Ungültiger Status' }) }).optional(),
  startDatum: z.string().optional().nullable(),
  endDatum: z.string().optional().nullable(),
  firmaId: z.number().int().positive('Firma ist erforderlich'),
  kontaktPersonId: z.number().int().positive().optional().nullable(),
});
export type VertragCreateDTO = z.infer<typeof VertragCreateSchema>;

// ─── Gehalt ───────────────────────────────────────────────────────────────────
export const GehaltCreateSchema = z.object({
  amount: z.number().positive('Betrag muss positiv sein'),
  typ: z.enum(GEHALT_TYP, { errorMap: () => ({ message: 'Ungültiger Typ' }) }).optional(),
  effectiveDate: z.string().min(1, 'Datum ist erforderlich'),
  beschreibung: z.string().optional().nullable(),
  personId: z.number().int().positive('Person ist erforderlich'),
});
export type GehaltCreateDTO = z.infer<typeof GehaltCreateSchema>;

// ─── SavedReport ──────────────────────────────────────────────────────────────
export const SavedReportCreateSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(255),
  beschreibung: z.string().optional().nullable(),
  queryJson: z.string().min(1, 'Query ist erforderlich'),
});
export type SavedReportCreateDTO = z.infer<typeof SavedReportCreateSchema>;

// ─── DashboardConfig ──────────────────────────────────────────────────────────
export const DashboardConfigSchema = z.object({
  visibleWidgets: z.array(z.string()).min(1, 'Mindestens ein Widget ist erforderlich'),
});
export type DashboardConfigDTO = z.infer<typeof DashboardConfigSchema>;

// ─── ReportQuery ──────────────────────────────────────────────────────────────
export const ReportQuerySchema = z.object({
  dimension: z.string().min(1, 'Dimension ist erforderlich'),
  metriken: z.array(z.string()).min(1, 'Mindestens eine Metrik ist erforderlich'),
  filter: z
    .object({
      phasen: z.array(z.string()).optional(),
      datumVon: z.string().optional(),
      datumBis: z.string().optional(),
    })
    .optional(),
});
export type ReportQueryDTO = z.infer<typeof ReportQuerySchema>;

// ─── validate() helper ────────────────────────────────────────────────────────
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      fieldErrors[path || '_'] = issue.message;
    }
    throw new ValidationError('Validierungsfehler', fieldErrors);
  }
  return result.data;
}
