import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faRobot,
  faUser,
  faComment,
  faBan,
} from '@fortawesome/free-solid-svg-icons';
import { Ticket, TicketComment } from '../../../core/models/ticket.model';
import { MarkdownPipe } from '../../../core/pipes/markdown.pipe';
import { TicketService } from '../../../core/services/ticket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-ticket-detail',
  imports: [RouterLink, ReactiveFormsModule, FaIconComponent, LoadingSpinnerComponent, DatePipe, MarkdownPipe],
  template: `
    @if (loading) {
      <app-loading-spinner />
    } @else if (errorMessage) {
      <div class="alert alert-danger" role="alert">{{ errorMessage }}</div>
    } @else if (ticket) {
      <div class="page-header">
        <h2>Ticket #{{ ticket.id }}</h2>
        <a routerLink="/admin/tickets" class="btn btn-sm btn-outline-secondary">
          <fa-icon [icon]="faArrowLeft" class="me-1" />Zurück
        </a>
      </div>

      <div class="row g-4">
        <!-- Left: Ticket details -->
        <div class="col-12 col-lg-8">
          <div class="table-container mb-4">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <h3 class="ticket-title mb-0">{{ ticket.title }}</h3>
              <div class="d-flex gap-2 flex-wrap">
                <span [class]="typeBadgeClass(ticket.type)">{{ typeLabel(ticket.type) }}</span>
                <span [class]="statusBadgeClass(ticket.status)">{{ statusLabel(ticket.status) }}</span>
                <span [class]="ownerBadgeClass(ticket.owner)">
                  <fa-icon [icon]="ticket.owner === 'AI' ? faRobot : faUser" class="me-1" />{{ ownerLabel(ticket.owner) }}
                </span>
                @if (ticket.solution) {
                  <span [class]="solutionBadgeClass(ticket.solution)">{{ solutionLabel(ticket.solution) }}</span>
                }
              </div>
            </div>

            <div class="ticket-body markdown-body" [innerHTML]="ticket.body | markdown"></div>

            <dl class="row mt-3 text-muted small">
              <dt class="col-sm-4">Erstellt</dt>
              <dd class="col-sm-8">{{ ticket.createdAt | date:'dd.MM.yyyy HH:mm' }}</dd>

              <dt class="col-sm-4">Aktualisiert</dt>
              <dd class="col-sm-8">{{ ticket.updatedAt | date:'dd.MM.yyyy HH:mm' }}</dd>

              @if (ticket.pickedUpAt) {
                <dt class="col-sm-4">Aufgenommen</dt>
                <dd class="col-sm-8">{{ ticket.pickedUpAt | date:'dd.MM.yyyy HH:mm' }}</dd>
              }

              @if (ticket.resolvedAt) {
                <dt class="col-sm-4">Abgeschlossen</dt>
                <dd class="col-sm-8">{{ ticket.resolvedAt | date:'dd.MM.yyyy HH:mm' }}</dd>
              }
            </dl>
          </div>

          <!-- Comment thread -->
          <div class="table-container">
            <h5 class="mb-3">
              <fa-icon [icon]="faComment" class="me-2 text-muted" />Kommentare
              @if (ticket.comments && ticket.comments.length > 0) {
                <span class="badge bg-secondary ms-1">{{ ticket.comments.length }}</span>
              }
            </h5>

            @if (!ticket.comments || ticket.comments.length === 0) {
              <p class="text-muted fst-italic">Noch keine Kommentare.</p>
            } @else {
              <div class="comment-thread">
                @for (comment of ticket.comments; track comment.id) {
                  <div class="comment-item" [class.comment-agent]="comment.author === 'AGENT'" [class.comment-human]="comment.author === 'HUMAN'">
                    <div class="comment-header">
                      <span class="comment-author">
                        <fa-icon [icon]="comment.author === 'AGENT' ? faRobot : faUser" class="me-1" />
                        {{ comment.author === 'AGENT' ? 'Claude Code' : (comment.authorName ?? 'Mensch') }}
                      </span>
                      <span class="comment-time text-muted small">{{ comment.createdAt | date:'dd.MM.yyyy HH:mm' }}</span>
                    </div>
                    <div class="comment-body markdown-body" [innerHTML]="comment.body | markdown"></div>
                  </div>
                }
              </div>
            }

            <!-- Add comment form -->
            <div class="mt-4">
              <h6 class="mb-2">Kommentar hinzufügen</h6>
              @if (commentError) {
                <div class="alert alert-danger py-2" role="alert">{{ commentError }}</div>
              }
              <form [formGroup]="commentForm" (ngSubmit)="addComment(false)">
                <div class="mb-3">
                  <textarea
                    class="form-control"
                    formControlName="body"
                    rows="4"
                    placeholder="Kommentar eingeben..."
                  ></textarea>
                  @if (commentForm.controls.body.invalid && commentForm.controls.body.touched) {
                    <div class="invalid-feedback d-block">Kommentar darf nicht leer sein.</div>
                  }
                </div>
                <div class="d-flex gap-2 flex-wrap">
                  <button
                    type="submit"
                    class="btn btn-primary"
                    [disabled]="savingComment"
                  >
                    @if (savingComment && !handingBack) {
                      <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                    }
                    Kommentar senden
                  </button>

                  <button
                    type="button"
                    class="btn btn-outline-primary"
                    (click)="addComment(true)"
                    [disabled]="savingComment || ticket.owner !== 'HUMAN' || commentForm.controls.body.value.trim().length === 0"
                    title="Kommentar senden und Ticket an KI übergeben"
                  >
                    @if (savingComment && handingBack) {
                      <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                    }
                    <fa-icon [icon]="faRobot" class="me-1" />Zurück an KI
                  </button>
                </div>
                @if (ticket.owner === 'AI') {
                  <div class="form-text text-muted mt-1">Die KI ist bereits Eigentümer.</div>
                } @else if (ticket.owner !== 'HUMAN') {
                  <div class="form-text text-muted mt-1">"Zurück an KI" ist nur möglich, wenn der Eigentümer "Mensch" ist.</div>
                }
              </form>
            </div>
          </div>
        </div>

        <!-- Right: Actions -->
        <div class="col-12 col-lg-4">
          <div class="table-container">
            <h5 class="mb-3">Aktionen</h5>

            <!-- Definition actions -->
            @if (ticket.status === 'DEFINITION') {
              <div class="mb-3">
                <label class="form-label fw-semibold">Definition abschließen</label>
                <div class="d-flex flex-column gap-2">
                  <button
                    class="btn btn-outline-primary w-100"
                    (click)="assignToAi()"
                    [disabled]="savingAssignAi || savingMoveToReady || ticket.owner === 'AI'"
                    title="Eigentümer auf KI setzen, Ticket bleibt in &quot;Definition&quot;"
                  >
                    @if (savingAssignAi) {
                      <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                    }
                    <fa-icon [icon]="faRobot" class="me-1" />An KI übergeben
                  </button>
                  <button
                    class="btn btn-outline-secondary w-100"
                    (click)="moveToReady()"
                    [disabled]="savingAssignAi || savingMoveToReady"
                    title="Eigentümer auf KI setzen und nach &quot;Bereit&quot; verschieben"
                  >
                    @if (savingMoveToReady) {
                      <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                    }
                    <fa-icon [icon]="faArrowRight" class="me-1" />Nach Bereit
                  </button>
                </div>
              </div>
            }

            <!-- Owner toggle -->
            @if (ticket.status !== 'DEFINITION') {
              <div class="mb-3">
                <label class="form-label fw-semibold">Eigentümer ändern</label>
                <div>
                  <button
                    class="btn btn-outline-primary w-100"
                    (click)="toggleOwner()"
                    [disabled]="savingOwner"
                    [title]="toggleOwnerTitle"
                  >
                    @if (savingOwner) {
                      <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                    }
                    @if (ticket.owner === 'HUMAN') {
                      <fa-icon [icon]="faRobot" class="me-1" />An KI übergeben
                    } @else {
                      <fa-icon [icon]="faUser" class="me-1" />An Mensch übergeben
                    }
                  </button>
                </div>
              </div>
            }

            <!-- Won't Do -->
            @if (ticket.owner === 'HUMAN' && ticket.status !== 'DONE') {
              <div class="mb-3">
                <label class="form-label fw-semibold">Abschließen als</label>
                <div>
                  <button
                    class="btn btn-outline-danger w-100"
                    (click)="markWontDo()"
                    [disabled]="savingWontDo"
                  >
                    @if (savingWontDo) {
                      <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                    }
                    <fa-icon [icon]="faBan" class="me-1" />Wird nicht gemacht
                  </button>
                </div>
              </div>
            }

            <!-- Info -->
            <div class="border-top pt-3 mt-2">
              <dl class="mb-0 small">
                <dt class="text-muted">ID</dt>
                <dd>#{{ ticket.id }}</dd>
                <dt class="text-muted">Status</dt>
                <dd><span [class]="statusBadgeClass(ticket.status)">{{ statusLabel(ticket.status) }}</span></dd>
                <dt class="text-muted">Eigentümer</dt>
                <dd><span [class]="ownerBadgeClass(ticket.owner)">{{ ownerLabel(ticket.owner) }}</span></dd>
                <dt class="text-muted">Typ</dt>
                <dd><span [class]="typeBadgeClass(ticket.type)">{{ typeLabel(ticket.type) }}</span></dd>
                @if (ticket.solution) {
                  <dt class="text-muted">Lösung</dt>
                  <dd><span [class]="solutionBadgeClass(ticket.solution)">{{ solutionLabel(ticket.solution) }}</span></dd>
                }
              </dl>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .ticket-title {
        font-size: 1.3rem;
        font-weight: 700;
        color: #212529;
      }

      .ticket-body {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 0.4rem;
        padding: 1rem 1.25rem;
        font-size: 0.9rem;
        overflow-wrap: anywhere;
        color: #212529;
      }

      /* Markdown rendering (ticket body + comments) */
      .markdown-body {
        overflow-wrap: anywhere;
      }
      .markdown-body > :first-child {
        margin-top: 0;
      }
      .markdown-body > :last-child {
        margin-bottom: 0;
      }
      .markdown-body h1,
      .markdown-body h2,
      .markdown-body h3,
      .markdown-body h4 {
        font-weight: 700;
        line-height: 1.25;
        margin: 1rem 0 0.5rem;
      }
      .markdown-body h1 {
        font-size: 1.25rem;
      }
      .markdown-body h2 {
        font-size: 1.1rem;
      }
      .markdown-body h3 {
        font-size: 1rem;
      }
      .markdown-body h4 {
        font-size: 0.92rem;
      }
      .markdown-body p {
        margin: 0 0 0.6rem;
      }
      .markdown-body ul,
      .markdown-body ol {
        margin: 0 0 0.6rem;
        padding-left: 1.4rem;
      }
      .markdown-body li {
        margin-bottom: 0.2rem;
      }
      .markdown-body code {
        background: rgba(175, 184, 193, 0.25);
        padding: 0.1rem 0.35rem;
        border-radius: 0.25rem;
        font-size: 0.85em;
      }
      .markdown-body pre {
        background: #f0f1f3;
        border: 1px solid #e0e2e6;
        border-radius: 0.4rem;
        padding: 0.75rem 1rem;
        overflow-x: auto;
      }
      .markdown-body pre code {
        background: none;
        padding: 0;
        font-size: 0.85rem;
      }
      .markdown-body a {
        color: #264892;
        text-decoration: underline;
      }
      .markdown-body blockquote {
        border-left: 3px solid #ced4da;
        margin: 0 0 0.6rem;
        padding-left: 0.8rem;
        color: #6c757d;
      }
      .markdown-body table {
        border-collapse: collapse;
        margin-bottom: 0.6rem;
      }
      .markdown-body th,
      .markdown-body td {
        border: 1px solid #dee2e6;
        padding: 0.3rem 0.6rem;
      }

      /* Comment thread */
      .comment-thread {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .comment-item {
        border-radius: 0.5rem;
        padding: 0.75rem 1rem;
        border-left: 3px solid transparent;
      }

      .comment-agent {
        background: rgba(38, 72, 146, 0.06);
        border-left-color: #264892;
      }

      .comment-human {
        background: rgba(25, 135, 84, 0.06);
        border-left-color: #198754;
      }

      .comment-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.35rem;
      }

      .comment-author {
        font-weight: 600;
        font-size: 0.85rem;
      }

      .comment-body {
        font-size: 0.88rem;
        overflow-wrap: anywhere;
        color: #212529;
      }

      /* Badges */
      .badge-type-feature {
        background-color: #264892;
        color: #fff;
      }
      .badge-type-bug {
        background-color: #dc421e;
        color: #fff;
      }
      .badge-type-chore {
        background-color: #d98a0b;
        color: #fff;
      }
      .badge-owner-ai {
        background-color: #6f42c1;
        color: #fff;
      }
      .badge-owner-human {
        background-color: #6c757d;
        color: #fff;
      }
      .badge-solution-done {
        background-color: #198754;
        color: #fff;
      }
      .badge-solution-wontdo {
        background-color: #adb5bd;
        color: #212529;
      }
    `,
  ],
})
export class TicketDetailComponent implements OnInit {
  private ticketService = inject(TicketService);
  private notification = inject(NotificationService);
  private modalService = inject(NgbModal);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  ticket: Ticket | null = null;
  loading = true;
  errorMessage: string | null = null;
  commentError: string | null = null;
  savingComment = false;
  handingBack = false;
  savingOwner = false;
  savingWontDo = false;
  savingAssignAi = false;
  savingMoveToReady = false;

  readonly faArrowLeft = faArrowLeft;
  readonly faArrowRight = faArrowRight;
  readonly faRobot = faRobot;
  readonly faUser = faUser;
  readonly faComment = faComment;
  readonly faBan = faBan;

  commentForm = this.fb.nonNullable.group({
    body: ['', [Validators.required, Validators.minLength(1)]],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTicket(id);
  }

  loadTicket(id: number): void {
    this.loading = true;
    this.errorMessage = null;
    this.ticketService
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.ticket = data;
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Ticket nicht gefunden oder Fehler beim Laden.';
          this.loading = false;
        },
      });
  }

  reload(): void {
    if (this.ticket) {
      this.loadTicket(this.ticket.id);
    }
  }

  addComment(handBackToAi: boolean): void {
    if (this.commentForm.invalid || !this.ticket) {
      this.commentForm.markAllAsTouched();
      return;
    }
    const body = this.commentForm.getRawValue().body.trim();
    if (!body) {
      this.commentForm.markAllAsTouched();
      return;
    }

    this.savingComment = true;
    this.handingBack = handBackToAi;
    this.commentError = null;

    this.ticketService
      .addComment(this.ticket.id, { body, handBackToAi })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.ticket = updated;
          this.commentForm.reset();
          this.savingComment = false;
          this.handingBack = false;
          this.notification.success(
            handBackToAi ? 'Ticket an KI übergeben.' : 'Kommentar gespeichert.',
          );
        },
        error: () => {
          this.savingComment = false;
          this.handingBack = false;
          this.commentError = 'Fehler beim Speichern des Kommentars.';
        },
      });
  }

  // "An KI übergeben": assign owner to AI, ticket stays in DEFINITION.
  assignToAi(): void {
    if (!this.ticket) return;
    const ticketId = this.ticket.id;
    this.savingAssignAi = true;

    this.ticketService
      .setOwner(ticketId, 'AI')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.ticket = updated;
          this.savingAssignAi = false;
          this.notification.success('Ticket der KI zugewiesen. Es bleibt in "Definition".');
        },
        error: () => {
          this.savingAssignAi = false;
          this.notification.error('Fehler beim Zuweisen des Tickets an die KI.');
        },
      });
  }

  // "Nach Bereit": assign owner to AI and move to TODO ("Bereit").
  moveToReady(): void {
    if (!this.ticket) return;
    const ticketId = this.ticket.id;
    this.savingMoveToReady = true;

    this.ticketService
      .handToAi(ticketId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.ticket = updated;
          this.savingMoveToReady = false;
          this.notification.success('Ticket der KI zugewiesen und nach "Bereit" verschoben.');
        },
        error: () => {
          this.savingMoveToReady = false;
          this.notification.error('Fehler beim Verschieben des Tickets.');
        },
      });
  }

  toggleOwner(): void {
    if (!this.ticket) return;
    const newOwner = this.ticket.owner === 'AI' ? 'HUMAN' : 'AI';
    const ticketId = this.ticket.id;
    const originalStatus = this.ticket.status;
    this.savingOwner = true;

    const willResetStatus = newOwner === 'AI' && originalStatus !== 'DONE' && originalStatus !== 'TODO';

    const request$ =
      willResetStatus
        ? this.ticketService
            .setOwner(ticketId, newOwner)
            .pipe(switchMap(() => this.ticketService.setStatus(ticketId, 'TODO')))
        : this.ticketService.setOwner(ticketId, newOwner);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => {
        this.ticket = updated;
        this.savingOwner = false;
        const message =
          willResetStatus
            ? 'Eigentümer auf "KI" gesetzt und Status auf "Bereit" zurückgesetzt.'
            : `Eigentümer auf "${newOwner === 'AI' ? 'KI' : 'Mensch'}" gesetzt.`;
        this.notification.success(message);
      },
      error: () => {
        this.savingOwner = false;
        this.notification.error(
          willResetStatus
            ? 'Fehler beim Setzen des Status. Eigentümer wurde möglicherweise geändert.'
            : 'Fehler beim Ändern des Eigentümers.',
        );
        this.loadTicket(ticketId);
      },
    });
  }

  get toggleOwnerTitle(): string {
    if (!this.ticket) return '';
    if (this.ticket.owner === 'HUMAN' && this.ticket.status !== 'DONE' && this.ticket.status !== 'TODO') {
      return 'Eigentümer auf KI setzen und Status auf "Bereit" zurücksetzen';
    }
    if (this.ticket.owner === 'HUMAN') {
      return 'Eigentümer auf KI setzen';
    }
    return 'Eigentümer auf Mensch setzen';
  }

  markWontDo(): void {
    if (!this.ticket) return;
    const ticketId = this.ticket.id;
    const modalRef = this.modalService.open(ConfirmDialogComponent);
    modalRef.componentInstance.title = 'Ticket schließen';
    modalRef.componentInstance.message = 'Dieses Ticket als "Wird nicht gemacht" markieren?';
    modalRef.componentInstance.confirmText = 'Wird nicht gemacht';
    modalRef.componentInstance.confirmButtonClass = 'btn btn-danger';
    modalRef.result.then(
      () => {
        this.savingWontDo = true;
        this.ticketService
          .wontDo(ticketId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (updated) => {
              this.ticket = updated;
              this.savingWontDo = false;
              this.notification.success('Ticket als "Wird nicht gemacht" markiert.');
            },
            error: () => {
              this.savingWontDo = false;
              this.notification.error('Fehler beim Schließen des Tickets.');
            },
          });
      },
      () => {},
    );
  }

  typeBadgeClass(type: string): string {
    switch (type) {
      case 'FEATURE':
        return 'badge badge-type-feature';
      case 'BUG':
        return 'badge badge-type-bug';
      case 'CHORE':
        return 'badge badge-type-chore';
      default:
        return 'badge bg-secondary';
    }
  }

  typeLabel(type: string): string {
    switch (type) {
      case 'FEATURE':
        return 'Feature';
      case 'BUG':
        return 'Bug';
      case 'CHORE':
        return 'Aufgabe';
      default:
        return type;
    }
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'DEFINITION':
        return 'badge bg-info text-dark';
      case 'TODO':
        return 'badge bg-primary';
      case 'IN_PROGRESS':
        return 'badge bg-warning text-dark';
      case 'ON_HOLD':
        return 'badge bg-secondary';
      case 'DONE':
        return 'badge bg-success';
      default:
        return 'badge bg-secondary';
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'DEFINITION':
        return 'Definition';
      case 'TODO':
        return 'Bereit';
      case 'IN_PROGRESS':
        return 'In Arbeit';
      case 'ON_HOLD':
        return 'Wartet';
      case 'DONE':
        return 'Erledigt';
      default:
        return status;
    }
  }

  ownerBadgeClass(owner: string): string {
    return owner === 'AI' ? 'badge badge-owner-ai' : 'badge badge-owner-human';
  }

  ownerLabel(owner: string): string {
    return owner === 'AI' ? 'KI' : 'Mensch';
  }

  solutionBadgeClass(solution: string): string {
    return solution === 'DONE' ? 'badge badge-solution-done' : 'badge badge-solution-wontdo';
  }

  solutionLabel(solution: string): string {
    return solution === 'DONE' ? 'Erledigt' : 'Wird nicht gemacht';
  }
}
