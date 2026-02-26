import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Abteilung } from '../../../core/models/abteilung.model';
import { Page } from '../../../core/models/page.model';
import { AbteilungService } from '../../../core/services/abteilung.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-abteilung-list',
  imports: [RouterLink, NgbPagination, LoadingSpinnerComponent],
  templateUrl: './abteilung-list.component.html',
})
export class AbteilungListComponent implements OnInit {
  private abteilungService = inject(AbteilungService);
  private modalService = inject(NgbModal);
  private notification = inject(NotificationService);

  page: Page<Abteilung> | null = null;
  currentPage = 1;
  pageSize = 10;
  loading = true;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.abteilungService.getAll(this.currentPage - 1, this.pageSize).subscribe({
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

  confirmDelete(abteilung: Abteilung): void {
    const modalRef = this.modalService.open(ConfirmDialogComponent);
    modalRef.componentInstance.title = 'Abteilung löschen';
    modalRef.componentInstance.message = `Möchten Sie die Abteilung "${abteilung.name}" wirklich löschen?`;
    modalRef.result.then(
      () => {
        this.abteilungService.delete(abteilung.id).subscribe({
          next: () => {
            this.notification.success('Abteilung erfolgreich gelöscht');
            this.loadData();
          },
          error: () => {},
        });
      },
      () => {},
    );
  }
}
