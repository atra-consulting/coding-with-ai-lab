import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm-dialog',
  imports: [],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ title }}</h5>
      <button
        type="button"
        class="btn-close"
        aria-label="Schließen"
        (click)="modal.dismiss()"
      ></button>
    </div>
    <div class="modal-body">
      <p>{{ message }}</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="modal.dismiss()">Abbrechen</button>
      <button type="button" [class]="confirmButtonClass" (click)="modal.close(true)">
        {{ confirmText }}
      </button>
    </div>
  `,
})
export class ConfirmDialogComponent {
  modal = inject(NgbActiveModal);
  title = 'Bestätigung';
  message = 'Sind Sie sicher?';
  confirmText = 'Löschen';
  confirmButtonClass = 'btn btn-danger';
}
