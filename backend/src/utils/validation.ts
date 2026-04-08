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
  industry: z.string().max(255).optional().nullable(),
  website: z.string().max(500).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
});
export type FirmaCreateDTO = z.infer<typeof FirmaCreateSchema>;

// ─── Person ───────────────────────────────────────────────────────────────────
export const PersonCreateSchema = z.object({
  firstName: z.string().min(1, 'Vorname ist erforderlich').max(100),
  lastName: z.string().min(1, 'Nachname ist erforderlich').max(100),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().nullable().or(z.literal('')),
  phone: z.string().max(50).optional().nullable(),
  position: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
  firmaId: z.number().int().positive('Firma ist erforderlich'),
  abteilungId: z.number().int().positive().optional().nullable(),
});
export type PersonCreateDTO = z.infer<typeof PersonCreateSchema>;

// ─── Abteilung ────────────────────────────────────────────────────────────────
export const AbteilungCreateSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(255),
  description: z.string().optional().nullable(),
  firmaId: z.number().int().positive('Firma ist erforderlich'),
});
export type AbteilungCreateDTO = z.infer<typeof AbteilungCreateSchema>;

// ─── Adresse ──────────────────────────────────────────────────────────────────
export const AdresseCreateSchema = z.object({
  street: z.string().max(255).optional().nullable(),
  houseNumber: z.string().max(20).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  firmaId: z.number().int().positive().optional().nullable(),
  personId: z.number().int().positive().optional().nullable(),
});
export type AdresseCreateDTO = z.infer<typeof AdresseCreateSchema>;

// ─── Aktivitaet ───────────────────────────────────────────────────────────────
export const AktivitaetCreateSchema = z.object({
  typ: z.enum(AKTIVITAET_TYP, { errorMap: () => ({ message: 'Ungültiger Typ' }) }),
  subject: z.string().min(1, 'Betreff ist erforderlich').max(255),
  description: z.string().optional().nullable(),
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
  currency: z.string().max(10).optional(),
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
  notes: z.string().optional().nullable(),
  wert: z.number().optional().nullable(),
  currency: z.string().max(10).optional(),
  status: z.enum(VERTRAG_STATUS, { errorMap: () => ({ message: 'Ungültiger Status' }) }).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  firmaId: z.number().int().positive('Firma ist erforderlich'),
  kontaktPersonId: z.number().int().positive().optional().nullable(),
});
export type VertragCreateDTO = z.infer<typeof VertragCreateSchema>;

// ─── Gehalt ───────────────────────────────────────────────────────────────────
export const GehaltCreateSchema = z.object({
  amount: z.number().positive('Betrag muss positiv sein'),
  currency: z.string().max(10).optional(),
  typ: z.enum(GEHALT_TYP, { errorMap: () => ({ message: 'Ungültiger Typ' }) }).optional(),
  effectiveDate: z.string().min(1, 'Datum ist erforderlich'),
  personId: z.number().int().positive('Person ist erforderlich'),
});
export type GehaltCreateDTO = z.infer<typeof GehaltCreateSchema>;

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
