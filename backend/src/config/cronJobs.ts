export interface CronJob {
  name: string;
  schedule: string;
  description: string;
  dispatchEventType: string;
}

export const CRON_JOBS: CronJob[] = [
  {
    name: 'solve-tasks',
    schedule: '*/10 * * * *',
    description: 'Drain all OPEN agent tasks via GitHub Actions',
    dispatchEventType: 'solve-agent-tasks',
  },
];
