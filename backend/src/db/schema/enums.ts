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

export const TICKET_OWNER = ['AI', 'HUMAN'] as const;
export type TicketOwner = (typeof TICKET_OWNER)[number];

export const TICKET_TYPE = ['FEATURE', 'BUG', 'CHORE'] as const;
export type TicketType = (typeof TICKET_TYPE)[number];

export const TICKET_STATUS = ['DEFINITION', 'TODO', 'IN_PROGRESS', 'ON_HOLD', 'DONE'] as const;
export type TicketStatus = (typeof TICKET_STATUS)[number];

export const TICKET_SOLUTION = ['DONE', 'WONT_DO'] as const;
export type TicketSolution = (typeof TICKET_SOLUTION)[number];

export const TICKET_COMMENT_AUTHOR = ['HUMAN', 'AGENT'] as const;
export type TicketCommentAuthor = (typeof TICKET_COMMENT_AUTHOR)[number];
