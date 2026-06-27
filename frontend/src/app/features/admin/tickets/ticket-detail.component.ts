import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faRobot,
  faUser,
  faComment,
  faBan,
} from '@fortawesome/free-solid-svg-icons';
import { Ticket, TicketComment } from '../../../core/models/ticket.model';
import { TicketService } from '../../../core/services/ticket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-ticket-detail',
  imports: [RouterLink, ReactiveFormsModule, FaIconComponent, LoadingSpinnerComponent, DatePipe],
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

            <pre class="ticket-body">{{ ticket.body }}</pre>

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
                    <div class="comment-body">{{ comment.body }}</div>
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
                    [disabled]="savingComment || ticket.owner !== 'HUMAN' || (commentForm.controls.body.value ?? '').trim().length === 0"
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

            <!-- Owner toggle -->
            <div class="mb-3">
              <label class="form-label fw-semibold">Eigentümer ändern</label>
              <div>
                <button
                  class="btn btn-outline-primary w-100"
                  (click)="toggleOwner()"
                  [disabled]="savingOwner"
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
        padding: 1rem;
        font-family: inherit;
        font-size: 0.9rem;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        color: #212529;
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
        white-space: pre-wrap;
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

  readonly faArrowLeft = faArrowLeft;
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

  toggleOwner(): void {
    if (!this.ticket) return;
    const newOwner = this.ticket.owner === 'AI' ? 'HUMAN' : 'AI';
    this.savingOwner = true;

    this.ticketService
      .setOwner(this.ticket.id, newOwner)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.ticket = updated;
          this.savingOwner = false;
          this.notification.success(`Eigentümer auf "${newOwner === 'AI' ? 'KI' : 'Mensch'}" gesetzt.`);
        },
        error: () => {
          this.savingOwner = false;
          this.notification.error('Fehler beim Ändern des Eigentümers.');
        },
      });
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
      case 'TODO':
        return 'Zu erledigen';
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
