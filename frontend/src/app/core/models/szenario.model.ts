import { ProzessKey } from './prozess-defaults';

export interface ProzessDauer {
  works: number[];
  waits: number[];
}

export interface Szenario {
  id: number;
  name: string;
  humanSteps: ProzessDauer;
  agileKiSteps: ProzessDauer;
  semiAutomatedSteps: ProzessDauer;
  automatedSteps: ProzessDauer;
  createdAt: string;
  updatedAt: string;
}

export interface SzenarioCreate {
  name: string;
  humanSteps: ProzessDauer;
  agileKiSteps: ProzessDauer;
  semiAutomatedSteps: ProzessDauer;
  automatedSteps: ProzessDauer;
}

export type SzenarioUpdate = SzenarioCreate;

/** The Szenario field name that stores a given process's step durations. */
export type SzenarioProzessFeld =
  | 'humanSteps'
  | 'agileKiSteps'
  | 'semiAutomatedSteps'
  | 'automatedSteps';

/** Bridges the component's ProzessKey to the Szenario/SzenarioCreate field that stores it. */
export const PROZESS_SZENARIO_FELD: Record<ProzessKey, SzenarioProzessFeld> = {
  menschlich: 'humanSteps',
  agileKi: 'agileKiSteps',
  halbautomatisch: 'semiAutomatedSteps',
  vollautomatisch: 'automatedSteps',
};
