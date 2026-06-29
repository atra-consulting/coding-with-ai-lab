export interface ProzessDauer {
  works: number[];
  waits: number[];
}

export interface Szenario {
  id: number;
  name: string;
  humanSteps: ProzessDauer;
  semiAutomatedSteps: ProzessDauer;
  automatedSteps: ProzessDauer;
  createdAt: string;
  updatedAt: string;
}

export interface SzenarioCreate {
  name: string;
  humanSteps: ProzessDauer;
  semiAutomatedSteps: ProzessDauer;
  automatedSteps: ProzessDauer;
}

export type SzenarioUpdate = SzenarioCreate;
