import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { AgentTask, AgentTaskSource } from '../../../core/models/agent-task.model';
import { Page } from '../../../core/models/page.model';
import { AgentTaskService } from '../../../core/services/agent-task.service';

@Component({
  selector: 'app-agent-task-list',
  imports: [RouterLink, NgbPagination],
  template: `
    <div class="page-header">
      <h2>App-Feedback{{ activeSource ? ' – ' + activeSource : '' }}</h2>
      <a routerLink="/admin/agent-tasks" class="btn btn-sm btn-outline-secondary">Zurück</a>
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
      <div class="table-container">
        <table class="table table-hover table-sm align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Titel</th>
              <th>Status</th>
              <th>Aufgenommen</th>
              <th>Abgeschlossen</th>
              <th>Vorschau</th>
            </tr>
          </thead>
          <tbody>
            @for (task of tasksPage?.content ?? []; track task.id) {
              <tr
                class="cursor-pointer"
                [routerLink]="['/admin/agent-tasks', task.id]"
                style="cursor: pointer"
              >
                <td>{{ task.id }}</td>
                <td>{{ task.title }}</td>
                <td><span [class]="statusBadgeClass(task.status)">{{ task.status }}</span></td>
                <td>{{ task.pickedUpAt ? task.pickedUpAt : '—' }}</td>
                <td>{{ task.resolvedAt ? task.resolvedAt : '—' }}</td>
                <td>{{ bodyPreview(task.body) }}</td>
              </tr>
            }
            @if (!tasksPage || tasksPage.content.length === 0) {
              <tr>
                <td colspan="6" class="text-center text-muted">Keine Aufgaben vorhanden.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (tasksPage && tasksPage.totalPages > 1) {
        <ngb-pagination
          [collectionSize]="tasksPage.totalElements"
          [(page)]="currentPage"
          [pageSize]="pageSize"
          (pageChange)="onPageChange($event)"
          [maxSize]="5"
        ></ngb-pagination>
      }
    }
  `,
})
export class AgentTaskListComponent implements OnInit {
  private agentTaskService = inject(AgentTaskService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  tasksPage: Page<AgentTask> | null = null;
  currentPage = 1;
  pageSize = 20;
  loading = true;
  errorMessage: string | null = null;
  activeSource: AgentTaskSource | null = null;

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const src = params['source'] as AgentTaskSource | undefined;
      this.activeSource = src ?? null;
      this.currentPage = 1;
      this.loadTasks();
    });
  }

  loadTasks(): void {
    this.loading = true;
    this.errorMessage = null;
    this.agentTaskService
      .getAll(this.currentPage - 1, this.pageSize, 'createdAt,desc', this.activeSource ?? undefined)
      .subscribe({
        next: (data) => {
          this.tasksPage = data;
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Fehler beim Laden der Aufgaben.';
          this.loading = false;
        },
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadTasks();
  }

  bodyPreview(body: string): string {
    return body.length > 80 ? body.substring(0, 80) + '…' : body;
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'badge bg-info';
      case 'IN_PROGRESS':
        return 'badge bg-warning text-dark';
      case 'DONE':
        return 'badge bg-success';
      case 'REJECTED':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }
}
