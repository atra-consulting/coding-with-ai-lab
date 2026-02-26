import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Gehalt } from '../../../core/models/gehalt.model';
import { Page } from '../../../core/models/page.model';
import { GehaltService } from '../../../core/services/gehalt.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EurCurrencyPipe } from '../../../shared/pipes/currency.pipe';

@Component({
  selector: 'app-gehalt-list',
  imports: [RouterLink, NgbPagination, LoadingSpinnerComponent, EurCurrencyPipe],
  templateUrl: './gehalt-list.component.html',
  styleUrl: './gehalt-list.component.scss',
})
export class GehaltListComponent implements OnInit {
  private gehaltService = inject(GehaltService);
  private modalService = inject(NgbModal);
  private notification = inject(NotificationService);

  page: Page<Gehalt> | null = null;
  currentPage = 1;
  pageSize = 10;
  loading = true;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.gehaltService.getAll(this.currentPage - 1, this.pageSize).subscribe({
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

  confirmDelete(gehalt: Gehalt): void {
    const modalRef = this.modalService.open(ConfirmDialogComponent);
    modalRef.componentInstance.title = 'Gehalt löschen';
    modalRef.componentInstance.message = `Möchten Sie den Gehaltseintrag für "${gehalt.personName}" (${gehalt.typ}) wirklich löschen?`;
    modalRef.result.then(
      () => {
        this.gehaltService.delete(gehalt.id).subscribe({
          next: () => {
            this.notification.success('Gehalt erfolgreich gelöscht');
            this.loadData();
          },
          error: () => {},
        });
      },
      () => {},
    );
  }
}
