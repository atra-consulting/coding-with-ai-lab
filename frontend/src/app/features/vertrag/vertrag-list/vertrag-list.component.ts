import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Page } from '../../../core/models/page.model';
import { Vertrag, VertragStatus } from '../../../core/models/vertrag.model';
import { NotificationService } from '../../../core/services/notification.service';
import { VertragService } from '../../../core/services/vertrag.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EurCurrencyPipe } from '../../../shared/pipes/currency.pipe';

@Component({
  selector: 'app-vertrag-list',
  imports: [RouterLink, NgbPagination, LoadingSpinnerComponent, DatePipe, EurCurrencyPipe],
  templateUrl: './vertrag-list.component.html',
})
export class VertragListComponent implements OnInit {
  private vertragService = inject(VertragService);
  private modalService = inject(NgbModal);
  private notification = inject(NotificationService);

  page: Page<Vertrag> | null = null;
  currentPage = 1;
  pageSize = 10;
  loading = true;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.vertragService.getAll(this.currentPage - 1, this.pageSize).subscribe({
      next: (data) => {
        this.page = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onPageChange(p: number): void {
    this.currentPage = p;
    this.loadData();
  }

  confirmDelete(vertrag: Vertrag): void {
    const modalRef = this.modalService.open(ConfirmDialogComponent);
    modalRef.componentInstance.title = 'Vertrag löschen';
    modalRef.componentInstance.message = `Möchten Sie den Vertrag "${vertrag.titel}" wirklich löschen?`;
    modalRef.result.then(
      () => {
        this.vertragService.delete(vertrag.id).subscribe({
          next: () => {
            this.notification.success('Vertrag erfolgreich gelöscht');
            this.loadData();
          },
          error: () => {},
        });
      },
      () => {},
    );
  }

  getStatusBadgeClass(status: VertragStatus): string {
    switch (status) {
      case 'AKTIV':
        return 'bg-success';
      case 'ENTWURF':
        return 'bg-secondary';
      case 'ABGELAUFEN':
        return 'bg-warning';
      case 'GEKUENDIGT':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }
}
