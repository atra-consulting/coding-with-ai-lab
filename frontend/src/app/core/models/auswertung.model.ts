import { ChancePhase } from './chance.model';

export interface PipelineKpis {
  gesamtwert: number;
  anzahlOffen: number;
  gewinnrate: number | null;
  durchschnittlicherWert: number;
}

export interface PhaseAggregate {
  phase: ChancePhase;
  anzahl: number;
  summeWert: number;
  durchschnittWert: number;
  summeGewichtet: number;
}

export interface TopFirma {
  firmaId: number;
  firmaName: string;
  anzahlChancen: number;
  summeWert: number;
}
