import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminService } from './admin.service';
import { GeocodeResult } from '../../core/models/geocode-result.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-geocoding',
  imports: [],
  templateUrl: './admin-geocoding.component.html',
  styleUrl: './admin-geocoding.component.scss',
})
export class AdminGeocodingComponent {
  private modal = inject(NgbModal);
  private adminService = inject(AdminService);
  private triggerButton = viewChild<ElementRef<HTMLButtonElement>>('triggerButton');

  running = false;
  result: GeocodeResult | null = null;
  errorMessage: string | null = null;
  errorStatus: number | null = null;

  async startGeocode(): Promise<void> {
    const modalRef = this.modal.open(ConfirmDialogComponent);
    modalRef.componentInstance.title = 'Geokodierung starten';
    modalRef.componentInstance.message =
      'Dieser Vorgang kann mehrere Minuten dauern. Bitte nicht den Browser-Tab schließen. Fortfahren?';
    modalRef.componentInstance.confirmText = 'Fortfahren';
    modalRef.componentInstance.confirmButtonClass = 'btn btn-primary';

    try {
      await modalRef.result;
    } catch {
      this.restoreFocus();
      return;
    }

    this.running = true;
    this.result = null;
    this.errorMessage = null;
    this.errorStatus = null;

    this.adminService.geocodeAddresses().subscribe({
      next: (res) => {
        this.result = res;
      },
      error: (err: HttpErrorResponse) => {
        this.errorStatus = err.status;
        this.errorMessage =
          err.error?.message ?? 'Vorgang fehlgeschlagen. Bitte später erneut versuchen.';
        this.running = false;
        this.restoreFocus();
      },
      complete: () => {
        this.running = false;
        this.restoreFocus();
      },
    });
  }

  private restoreFocus(): void {
    queueMicrotask(() => this.triggerButton()?.nativeElement.focus());
  }
}
