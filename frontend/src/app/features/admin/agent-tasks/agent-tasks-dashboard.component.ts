import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowRight,
  faCircleCheck,
  faCircleXmark,
  faCodeBranch,
  faEnvelope,
  faFileLines,
  faFolderOpen,
  faRotateLeft,
  faSpinner,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { AgentTaskSource, AgentTaskSummary } from '../../../core/models/agent-task.model';
import { AgentTaskService } from '../../../core/services/agent-task.service';
import { AgentTaskListComponent } from './agent-task-list.component';

type StatusKey = 'open' | 'inProgress' | 'done' | 'rejected';

interface StatusMeta {
  key: StatusKey;
  label: string;
  short: string;
  field: keyof Pick<
    AgentTaskSummary,
    'openCount' | 'inProgressCount' | 'doneCount' | 'rejectedCount'
  >;
  icon: IconDefinition;
}

interface SourceMeta {
  label: string;
  icon: IconDefinition;
}

const STATUS_META: StatusMeta[] = [
  { key: 'open', label: 'Offen', short: 'Offen', field: 'openCount', icon: faFolderOpen },
  {
    key: 'inProgress',
    label: 'In Bearbeitung',
    short: 'Läuft',
    field: 'inProgressCount',
    icon: faSpinner,
  },
  { key: 'done', label: 'Erledigt', short: 'Fertig', field: 'doneCount', icon: faCircleCheck },
  {
    key: 'rejected',
    label: 'Abgelehnt',
    short: 'Abgel.',
    field: 'rejectedCount',
    icon: faCircleXmark,
  },
];

const SOURCE_META: Record<AgentTaskSource, SourceMeta> = {
  EMAIL: { label: 'Customer Emails', icon: faEnvelope },
  GITHUB_ISSUE: { label: 'GitHub Issues', icon: faCodeBranch },
  APP_LOG: { label: 'Application Logs', icon: faFileLines },
  ERROR_REPORT: { label: 'Error Reports', icon: faTriangleExclamation },
};

const ALL_SOURCES: AgentTaskSource[] = ['EMAIL', 'APP_LOG', 'ERROR_REPORT'];

@Component({
  selector: 'app-agent-tasks-dashboard',
  imports: [RouterLink, FaIconComponent, AgentTaskListComponent],
  template: `
    @if (activeSource) {
      <app-agent-task-list />
    } @else {
      <div class="page-header">
        <h2>Agent-Aufgaben</h2>
        <button class="btn btn-outline-danger" (click)="resetAllTasks()">
          <fa-icon [icon]="faRotateLeft" class="me-2" />Alle Aufgaben zurücksetzen
        </button>
      </div>

      @if (loading) {
        <div class="d-flex justify-content-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Lädt…</span>
          </div>
        </div>
      } @else if (errorMessage) {
        <div class="alert alert-danger" role="alert">{{ errorMessage }}</div>
      } @else {
        <!-- Aggregate KPI tiles -->
        <div class="row g-3 mb-4">
          @for (stat of statusMeta; track stat.key) {
            <div class="col-6 col-xl-3">
              <div class="card h-100 kpi-tile" [class]="'kpi-' + stat.key">
                <div class="card-body d-flex align-items-center gap-3">
                  <span class="kpi-icon"><fa-icon [icon]="stat.icon" /></span>
                  <div class="min-w-0">
                    <div class="kpi-value">{{ totalForStatus(stat.field) }}</div>
                    <div class="kpi-label text-truncate">{{ stat.label }}</div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Per-source cards -->
        <div class="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-4">
          @for (source of allSources; track source) {
            <div class="col">
              <div class="card h-100 source-card" [class]="'s-' + source">
                <div class="card-body d-flex flex-column">
                  <div class="d-flex align-items-center mb-3">
                    <span class="source-icon"><fa-icon [icon]="sourceIcon(source)" /></span>
                    <div class="ms-3 min-w-0">
                      <h3 class="source-title text-truncate mb-0">{{ sourceLabel(source) }}</h3>
                      <span class="text-muted small">{{ totalForSource(source) }} Aufgaben</span>
                    </div>
                  </div>

                  <div class="stat-grid mb-3">
                    @for (stat of statusMeta; track stat.key) {
                      <div class="stat-cell" [class]="'stat-' + stat.key">
                        <div class="stat-num">{{ countFor(source, stat.field) }}</div>
                        <div class="stat-name">{{ stat.short }}</div>
                      </div>
                    }
                  </div>

                  <div class="d-flex justify-content-between align-items-baseline mb-1">
                    <span class="small text-muted">Fortschritt</span>
                    <span class="small fw-semibold">{{ completion(source) }}%</span>
                  </div>
                  <div
                    class="progress source-progress mb-3"
                    role="progressbar"
                    [attr.aria-label]="'Fortschritt ' + sourceLabel(source)"
                    [attr.aria-valuenow]="completion(source)"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    <div class="progress-bar" [style.width.%]="completion(source)"></div>
                  </div>

                  <a
                    routerLink="/admin/agent-tasks"
                    [queryParams]="{ source: source }"
                    class="btn btn-outline-primary w-100 mt-auto"
                  >
                    Aufgaben anzeigen <fa-icon [icon]="faArrowRight" class="ms-1" />
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .min-w-0 {
        min-width: 0;
      }

      /* ---- Aggregate KPI tiles ---- */
      .kpi-tile {
        border-left: 4px solid transparent;
      }
      .kpi-icon {
        flex: 0 0 auto;
        width: 3rem;
        height: 3rem;
        border-radius: 0.85rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
      }
      .kpi-value {
        font-size: 1.9rem;
        font-weight: 700;
        line-height: 1;
      }
      .kpi-label {
        color: #6c757d;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-top: 0.3rem;
      }

      .kpi-open {
        border-left-color: #264892;
      }
      .kpi-open .kpi-icon {
        background: rgba(38, 72, 146, 0.12);
        color: #264892;
      }
      .kpi-inProgress {
        border-left-color: #d98a0b;
      }
      .kpi-inProgress .kpi-icon {
        background: rgba(217, 138, 11, 0.14);
        color: #b9770b;
      }
      .kpi-done {
        border-left-color: #198754;
      }
      .kpi-done .kpi-icon {
        background: rgba(25, 135, 84, 0.12);
        color: #198754;
      }
      .kpi-rejected {
        border-left-color: #dc421e;
      }
      .kpi-rejected .kpi-icon {
        background: rgba(220, 66, 30, 0.12);
        color: #dc421e;
      }

      /* ---- Per-source cards ---- */
      .source-card {
        border-top: 4px solid var(--accent);
        --accent: #264892;
      }
      .source-card.s-EMAIL {
        --accent: #264892;
        --accent-soft: rgba(38, 72, 146, 0.12);
      }
      .source-card.s-GITHUB_ISSUE {
        --accent: #6f42c1;
        --accent-soft: rgba(111, 66, 193, 0.12);
      }
      .source-card.s-APP_LOG {
        --accent: #0d9488;
        --accent-soft: rgba(13, 148, 136, 0.12);
      }
      .source-card.s-ERROR_REPORT {
        --accent: #dc421e;
        --accent-soft: rgba(220, 66, 30, 0.12);
      }

      .source-icon {
        flex: 0 0 auto;
        width: 2.75rem;
        height: 2.75rem;
        border-radius: 0.75rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        color: var(--accent);
        background: var(--accent-soft);
      }
      .source-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: #2c3e50;
      }

      .stat-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
      }
      .stat-cell {
        border-radius: 0.6rem;
        padding: 0.55rem 0.35rem;
        text-align: center;
      }
      .stat-num {
        font-size: 1.5rem;
        font-weight: 700;
        line-height: 1;
      }
      .stat-name {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: #6c757d;
        margin-top: 0.25rem;
      }

      .stat-open {
        background: rgba(38, 72, 146, 0.08);
      }
      .stat-open .stat-num {
        color: #264892;
      }
      .stat-inProgress {
        background: rgba(217, 138, 11, 0.1);
      }
      .stat-inProgress .stat-num {
        color: #b9770b;
      }
      .stat-done {
        background: rgba(25, 135, 84, 0.09);
      }
      .stat-done .stat-num {
        color: #198754;
      }
      .stat-rejected {
        background: rgba(220, 66, 30, 0.08);
      }
      .stat-rejected .stat-num {
        color: #dc421e;
      }

      .source-progress {
        height: 0.5rem;
        border-radius: 1rem;
        background: #eef0f4;
      }
      .source-progress .progress-bar {
        background-color: #198754;
        border-radius: 1rem;
      }
    `,
  ],
})
export class AgentTasksDashboardComponent implements OnInit {
  private agentTaskService = inject(AgentTaskService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  allSources = ALL_SOURCES;
  statusMeta = STATUS_META;
  summaries: AgentTaskSummary[] = [];
  loading = true;
  errorMessage: string | null = null;
  activeSource: AgentTaskSource | null = null;

  readonly faRotateLeft = faRotateLeft;
  readonly faArrowRight = faArrowRight;

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const src = params['source'] as AgentTaskSource | undefined;
      this.activeSource = src && ALL_SOURCES.includes(src) ? src : null;
      if (!this.activeSource) {
        this.loadSummary();
      }
    });
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
    this.loading = true;
    this.errorMessage = null;
    this.agentTaskService.resetAll().subscribe({
      next: () => {
        this.loadSummary();
      },
      error: () => {
        this.errorMessage = 'Fehler beim Zurücksetzen der Aufgaben.';
        this.loading = false;
      },
    });
  }

  sourceLabel(source: AgentTaskSource): string {
    return SOURCE_META[source].label;
  }

  sourceIcon(source: AgentTaskSource): IconDefinition {
    return SOURCE_META[source].icon;
  }

  summaryFor(source: AgentTaskSource): AgentTaskSummary | null {
    return this.summaries.find((s) => s.source === source) ?? null;
  }

  countFor(source: AgentTaskSource, field: StatusMeta['field']): number {
    return this.summaryFor(source)?.[field] ?? 0;
  }

  totalForSource(source: AgentTaskSource): number {
    const s = this.summaryFor(source);
    if (!s) {
      return 0;
    }
    return s.openCount + s.inProgressCount + s.doneCount + s.rejectedCount;
  }

  totalForStatus(field: StatusMeta['field']): number {
    return this.allSources.reduce((sum, source) => sum + this.countFor(source, field), 0);
  }

  /** Share of resolved (done) tasks for a source, 0–100. */
  completion(source: AgentTaskSource): number {
    const total = this.totalForSource(source);
    if (total === 0) {
      return 0;
    }
    return Math.round((this.countFor(source, 'doneCount') / total) * 100);
  }
}
