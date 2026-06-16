export const CHANCE_PHASE = [
  'NEU',
  'QUALIFIZIERT',
  'ANGEBOT',
  'VERHANDLUNG',
  'GEWONNEN',
  'VERLOREN',
] as const;
export type ChancePhase = (typeof CHANCE_PHASE)[number];

export const AKTIVITAET_TYP = [
  'ANRUF',
  'EMAIL',
  'MEETING',
  'NOTIZ',
  'AUFGABE',
] as const;
export type AktivitaetTyp = (typeof AKTIVITAET_TYP)[number];

export const AGENT_TASK_SOURCE = [
  'EMAIL',
  'GITHUB_ISSUE',
  'APP_LOG',
  'ERROR_REPORT',
] as const;
export type AgentTaskSource = (typeof AGENT_TASK_SOURCE)[number];

export const AGENT_TASK_STATUS = [
  'OPEN',
  'IN_PROGRESS',
  'DONE',
  'REJECTED',
] as const;
export type AgentTaskStatus = (typeof AGENT_TASK_STATUS)[number];
