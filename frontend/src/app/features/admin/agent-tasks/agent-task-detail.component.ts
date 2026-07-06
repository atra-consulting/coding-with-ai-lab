import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AgentTask } from '../../../core/models/agent-task.model';
import { AgentTaskService } from '../../../core/services/agent-task.service';

@Component({
  selector: 'app-agent-task-detail',
  imports: [RouterLink],
  template: `
    @if (loading) {
      <div class="d-flex justify-content-center py-4">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Lädt…</span>
        </div>
      </div>
    } @else if (errorMessage) {
      <div class="alert alert-danger" role="alert">{{ errorMessage }}</div>
    } @else if (task) {
      <div class="page-header">
        <h2>App-Feedback #{{ task.id }}</h2>
        <a routerLink="/admin/agent-tasks" class="btn btn-sm btn-outline-secondary">Zurück</a>
      </div>

      <div class="table-container">
        <dl class="row">
          <dt class="col-sm-3">ID</dt>
          <dd class="col-sm-9">{{ task.id }}</dd>

          <dt class="col-sm-3">Quelle</dt>
          <dd class="col-sm-9">{{ task.source }}</dd>

          <dt class="col-sm-3">Titel</dt>
          <dd class="col-sm-9">{{ task.title }}</dd>

          <dt class="col-sm-3">Status</dt>
          <dd class="col-sm-9">
            <span [class]="statusBadgeClass(task.status)">{{ task.status }}</span>
          </dd>

          <dt class="col-sm-3">Kommentar</dt>
          <dd class="col-sm-9">{{ task.comment ?? '—' }}</dd>

          <dt class="col-sm-3">Aufgenommen am</dt>
          <dd class="col-sm-9">{{ task.pickedUpAt ?? '—' }}</dd>

          <dt class="col-sm-3">Abgeschlossen am</dt>
          <dd class="col-sm-9">{{ task.resolvedAt ?? '—' }}</dd>

          <dt class="col-sm-3">Erstellt am</dt>
          <dd class="col-sm-9">{{ task.createdAt }}</dd>

          <dt class="col-sm-3">Aktualisiert am</dt>
          <dd class="col-sm-9">{{ task.updatedAt }}</dd>
        </dl>

        <h5 class="mt-3">Inhalt</h5>
        <pre class="bg-light border rounded p-3 small" style="white-space: pre-wrap; overflow-wrap: anywhere;">{{ task.body }}</pre>

        @if (task.metadata) {
          <h5 class="mt-3">Metadaten</h5>
          <pre class="bg-light border rounded p-3 small font-monospace" style="white-space: pre-wrap; overflow-wrap: anywhere;">{{ prettyMetadata(task.metadata) }}</pre>
        }
      </div>
    }
  `,
})
export class AgentTaskDetailComponent implements OnInit {
  private agentTaskService = inject(AgentTaskService);
  private route = inject(ActivatedRoute);

  task: AgentTask | null = null;
  loading = true;
  errorMessage: string | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.agentTaskService.getById(id).subscribe({
      next: (data) => {
        this.task = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Aufgabe nicht gefunden oder Fehler beim Laden.';
        this.loading = false;
      },
    });
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

  prettyMetadata(metadata: string): string {
    try {
      return JSON.stringify(JSON.parse(metadata), null, 2);
    } catch {
      return metadata;
    }
  }
}
