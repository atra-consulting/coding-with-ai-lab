import { ChancePhase } from './chance.model';
import { AktivitaetTyp } from './aktivitaet.model';

export type { ChancePhase, AktivitaetTyp };

export interface RecentChance {
  id: number;
  titel: string;
  wert: number | null;
  currency: string;
  phase: ChancePhase;
  firmaName: string;
  createdAt: string;
}

export interface RecentAktivitaet {
  id: number;
  typ: AktivitaetTyp;
  subject: string;
  datum: string;
  firmaName: string | null;
  personName: string | null;
  createdAt: string;
}

export interface DashboardData {
  firmenCount: number;
  personenCount: number;
  offeneChancenCount: number;
  gewonneneChancenSumme: number;
  recentChancen: RecentChance[];
  recentAktivitaeten: RecentAktivitaet[];
}
