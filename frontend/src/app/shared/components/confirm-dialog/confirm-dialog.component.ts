import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-confirm-dialog',
  imports: [TranslateModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ title }}</h5>
      <button
        type="button"
        class="btn-close"
        [attr.aria-label]="'COMMON.CLOSE' | translate"
        (click)="modal.dismiss()"
      ></button>
    </div>
    <div class="modal-body">
      <p>{{ message }}</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="modal.dismiss()">{{ 'COMMON.CANCEL' | translate }}</button>
      <button type="button" class="btn btn-danger" (click)="modal.close(true)">
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
}
