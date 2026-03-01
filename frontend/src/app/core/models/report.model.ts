import { ChancePhase } from './chance.model';

export type ReportDimension = 'PHASE' | 'FIRMA' | 'PERSON' | 'MONAT' | 'QUARTAL' | 'JAHR';

export type ReportMetrik = 'ANZAHL' | 'SUMME_WERT' | 'DURCHSCHNITT_WERT' | 'GEWICHTETER_WERT' | 'GEWINNRATE';

export interface ReportFilter {
  phasen?: ChancePhase[] | null;
  datumVon?: string | null;
  datumBis?: string | null;
}

export interface ReportQuery {
  dimension: ReportDimension;
  metriken: ReportMetrik[];
  filter?: ReportFilter | null;
}

export interface ReportZeile {
  label: string;
  id: number | null;
  werte: Record<string, number | null>;
}

export interface ReportResult {
  dimension: ReportDimension;
  metriken: ReportMetrik[];
  zeilen: ReportZeile[];
}

export interface SavedReport {
  id: number;
  name: string;
  config: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedReportCreate {
  name: string;
  config: string;
}
