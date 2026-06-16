export interface CronJob {
  name: string;
  schedule: string;
  description: string;
  dispatchEventType: string;
}

export const CRON_JOBS: CronJob[] = [
  {
    name: 'solve-tasks',
    schedule: '0 2 * * *',
    description: 'Drain all OPEN agent tasks via GitHub Actions (daily; trigger manually anytime from the dashboard)',
    dispatchEventType: 'solve-agent-tasks',
  },
];
