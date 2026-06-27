import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TicketType } from '../../../core/models/ticket.model';
import { TicketService } from '../../../core/services/ticket.service';

@Component({
  selector: 'app-ticket-create',
  imports: [ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">Neues Ticket erstellen</h5>
      <button type="button" class="btn-close" (click)="dismiss()" aria-label="Schließen"></button>
    </div>
    <div class="modal-body">
      @if (errorMessage) {
        <div class="alert alert-danger" role="alert">{{ errorMessage }}</div>
      }
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="mb-3">
          <label for="ticketType" class="form-label">Typ <span class="text-danger">*</span></label>
          <select id="ticketType" class="form-select" formControlName="type">
            <option value="FEATURE">Feature</option>
            <option value="BUG">Bug</option>
            <option value="CHORE">Aufgabe</option>
          </select>
          @if (form.controls.type.invalid && form.controls.type.touched) {
            <div class="invalid-feedback d-block">Bitte einen Typ wählen.</div>
          }
        </div>
        <div class="mb-3">
          <label for="ticketTitle" class="form-label">Titel <span class="text-danger">*</span></label>
          <input
            id="ticketTitle"
            type="text"
            class="form-control"
            formControlName="title"
            placeholder="Kurze Beschreibung"
          />
          @if (form.controls.title.invalid && form.controls.title.touched) {
            <div class="invalid-feedback d-block">Titel ist erforderlich.</div>
          }
        </div>
        <div class="mb-3">
          <label for="ticketBody" class="form-label">Beschreibung <span class="text-danger">*</span></label>
          <textarea
            id="ticketBody"
            class="form-control"
            formControlName="body"
            rows="6"
            placeholder="Detaillierte Beschreibung der Aufgabe"
          ></textarea>
          @if (form.controls.body.invalid && form.controls.body.touched) {
            <div class="invalid-feedback d-block">Beschreibung ist erforderlich.</div>
          }
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-secondary" (click)="dismiss()">Abbrechen</button>
      <button
        type="button"
        class="btn btn-primary"
        (click)="submit()"
        [disabled]="saving"
      >
        @if (saving) {
          <span class="spinner-border spinner-border-sm me-1" role="status"></span>
        }
        Erstellen
      </button>
    </div>
  `,
})
export class TicketCreateComponent {
  private fb = inject(FormBuilder);
  private ticketService = inject(TicketService);
  private activeModal = inject(NgbActiveModal);

  form = this.fb.nonNullable.group({
    type: ['FEATURE' as TicketType, Validators.required],
    title: ['', [Validators.required, Validators.minLength(1)]],
    body: ['', [Validators.required, Validators.minLength(1)]],
  });

  saving = false;
  errorMessage: string | null = null;

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.errorMessage = null;
    const { type, title, body } = this.form.getRawValue();
    this.ticketService.create({ type, title, body }).subscribe({
      next: (ticket) => {
        this.saving = false;
        this.activeModal.close(ticket);
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'Fehler beim Erstellen des Tickets.';
      },
    });
  }

  dismiss(): void {
    this.activeModal.dismiss();
  }
}
