import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Firma } from '../../../core/models/firma.model';
import { Page } from '../../../core/models/page.model';
import { FirmaService } from '../../../core/services/firma.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-firma-list',
  imports: [RouterLink, FormsModule, NgbPagination, LoadingSpinnerComponent],
  templateUrl: './firma-list.component.html',
})
export class FirmaListComponent implements OnInit {
  private firmaService = inject(FirmaService);
  private modalService = inject(NgbModal);
  private notification = inject(NotificationService);

  page: Page<Firma> | null = null;
  currentPage = 1;
  pageSize = 10;
  search = '';
  loading = true;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.firmaService
      .getAll(this.currentPage - 1, this.pageSize, 'name,asc', this.search)
      .subscribe({
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

  onSearch(): void {
    this.currentPage = 1;
    this.loadData();
  }

  confirmDelete(firma: Firma): void {
    const modalRef = this.modalService.open(ConfirmDialogComponent);
    modalRef.componentInstance.title = 'Firma löschen';
    modalRef.componentInstance.message = `Möchten Sie die Firma "${firma.name}" wirklich löschen?`;
    modalRef.result.then(
      () => {
        this.firmaService.delete(firma.id).subscribe({
          next: () => {
            this.notification.success('Firma erfolgreich gelöscht');
            this.loadData();
          },
          error: () => {},
        });
      },
      () => {},
    );
  }
}
