import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AgentTaskSource, AgentTaskSummary } from '../../../core/models/agent-task.model';
import { AgentTaskService } from '../../../core/services/agent-task.service';
import { AgentTaskListComponent } from './agent-task-list.component';

const SOURCE_LABELS: Record<AgentTaskSource, string> = {
  EMAIL: 'Customer Emails',
  GITHUB_ISSUE: 'GitHub Issues',
  APP_LOG: 'Application Logs',
  ERROR_REPORT: 'Error Reports',
};

const ALL_SOURCES: AgentTaskSource[] = ['EMAIL', 'GITHUB_ISSUE', 'APP_LOG', 'ERROR_REPORT'];

@Component({
  selector: 'app-agent-tasks-dashboard',
  imports: [RouterLink, AgentTaskListComponent],
  template: `
    @if (activeSource) {
      <app-agent-task-list />
    } @else {
      <div class="page-header d-flex justify-content-between align-items-center">
        <h2>Agent-Aufgaben</h2>
        <button class="btn btn-outline-danger" (click)="resetAllTasks()">
          Alle Aufgaben zurücksetzen
        </button>
      </div>

      @if (loading) {
        <div class="d-flex justify-content-center py-4">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Lädt…</span>
          </div>
        </div>
      } @else if (errorMessage) {
        <div class="alert alert-danger" role="alert">{{ errorMessage }}</div>
      } @else {
        <div class="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3">
          @for (source of allSources; track source) {
            <div class="col">
              <div class="card h-100">
                <div class="card-header">
                  <strong>{{ sourceLabel(source) }}</strong>
                </div>
                <div class="card-body">
                  @if (summaryFor(source); as s) {
                    <dl class="row mb-2">
                      <dt class="col-8">Open</dt>
                      <dd class="col-4 text-end">{{ s.openCount }}</dd>
                      <dt class="col-8">In Progress</dt>
                      <dd class="col-4 text-end">{{ s.inProgressCount }}</dd>
                      <dt class="col-8">Done</dt>
                      <dd class="col-4 text-end">{{ s.doneCount }}</dd>
                      <dt class="col-8">Rejected</dt>
                      <dd class="col-4 text-end">{{ s.rejectedCount }}</dd>
                    </dl>
                  } @else {
                    <dl class="row mb-2">
                      <dt class="col-8">Open</dt>
                      <dd class="col-4 text-end">0</dd>
                      <dt class="col-8">In Progress</dt>
                      <dd class="col-4 text-end">0</dd>
                      <dt class="col-8">Done</dt>
                      <dd class="col-4 text-end">0</dd>
                      <dt class="col-8">Rejected</dt>
                      <dd class="col-4 text-end">0</dd>
                    </dl>
                  }
                  <a
                    routerLink="/admin/agent-tasks"
                    [queryParams]="{ source: source }"
                    class="btn btn-sm btn-outline-primary w-100"
                  >Aufgaben anzeigen</a>
                </div>
              </div>
            </div>
          }
        </div>
      }
    }
  `,
})
export class AgentTasksDashboardComponent implements OnInit {
  private agentTaskService = inject(AgentTaskService);
  private route = inject(ActivatedRoute);

  allSources = ALL_SOURCES;
  summaries: AgentTaskSummary[] = [];
  loading = true;
  errorMessage: string | null = null;
  activeSource: AgentTaskSource | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const src = params['source'] as AgentTaskSource | undefined;
      this.activeSource = src && ALL_SOURCES.includes(src) ? src : null;
    });

    this.loadSummary();
  }

  loadSummary(): void {
    this.loading = true;
    this.errorMessage = null;
    this.agentTaskService.getSummary().subscribe({
      next: (data) => {
        this.summaries = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Fehler beim Laden der Zusammenfassung.';
        this.loading = false;
      },
    });
  }

  resetAllTasks(): void {
    if (!window.confirm('Alle Agent-Aufgaben auf OPEN zurücksetzen?')) {
      return;
    }
    this.agentTaskService.resetAll().subscribe({
      next: () => {
        this.loadSummary();
      },
    });
  }

  sourceLabel(source: AgentTaskSource): string {
    return SOURCE_LABELS[source];
  }

  summaryFor(source: AgentTaskSource): AgentTaskSummary | null {
    return this.summaries.find((s) => s.source === source) ?? null;
  }
}
