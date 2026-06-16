import { Page } from './page.model';

export type CronRunStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';

export type CronTrigger = 'CRON' | 'MANUAL';

export interface CronRun {
  id: number;
  job: string;
  status: CronRunStatus;
  trigger: CronTrigger;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  result: string | null;
  githubRunUrl: string | null;
  error: string | null;
}

export interface CronJobLastRun {
  status: CronRunStatus;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
}

export interface CronJob {
  name: string;
  schedule: string;
  description: string;
  dispatchEventType: string;
  lastRun: CronJobLastRun | null;
}

export type { Page };
