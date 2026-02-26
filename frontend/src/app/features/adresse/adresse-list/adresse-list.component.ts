import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Adresse } from '../../../core/models/adresse.model';
import { Page } from '../../../core/models/page.model';
import { AdresseService } from '../../../core/services/adresse.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-adresse-list',
  imports: [RouterLink, NgbPagination, LoadingSpinnerComponent],
  templateUrl: './adresse-list.component.html',
  styleUrl: './adresse-list.component.scss',
})
export class AdresseListComponent implements OnInit {
  private adresseService = inject(AdresseService);
  private modalService = inject(NgbModal);
  private notification = inject(NotificationService);

  page: Page<Adresse> | null = null;
  currentPage = 1;
  pageSize = 10;
  loading = true;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.adresseService.getAll(this.currentPage - 1, this.pageSize).subscribe({
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

  confirmDelete(adresse: Adresse): void {
    const modalRef = this.modalService.open(ConfirmDialogComponent);
    modalRef.componentInstance.title = 'Adresse löschen';
    modalRef.componentInstance.message = `Möchten Sie die Adresse "${adresse.street} ${adresse.houseNumber}, ${adresse.postalCode} ${adresse.city}" wirklich löschen?`;
    modalRef.result.then(
      () => {
        this.adresseService.delete(adresse.id).subscribe({
          next: () => {
            this.notification.success('Adresse erfolgreich gelöscht');
            this.loadData();
          },
          error: () => {},
        });
      },
      () => {},
    );
  }
}
