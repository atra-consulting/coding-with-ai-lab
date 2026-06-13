export type AgentTaskSource = 'EMAIL' | 'GITHUB_ISSUE' | 'APP_LOG' | 'ERROR_REPORT';

export type AgentTaskStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';

export interface AgentTask {
  id: number;
  source: AgentTaskSource;
  title: string;
  body: string;
  status: AgentTaskStatus;
  comment: string | null;
  metadata: string | null;
  pickedUpAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentTaskSummary {
  source: AgentTaskSource;
  openCount: number;
  inProgressCount: number;
  doneCount: number;
  rejectedCount: number;
}
