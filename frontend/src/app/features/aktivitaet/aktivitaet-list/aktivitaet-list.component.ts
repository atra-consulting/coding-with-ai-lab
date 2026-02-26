import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Aktivitaet, AktivitaetTyp } from '../../../core/models/aktivitaet.model';
import { Page } from '../../../core/models/page.model';
import { AktivitaetService } from '../../../core/services/aktivitaet.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-aktivitaet-list',
  imports: [RouterLink, NgbPagination, LoadingSpinnerComponent, DatePipe],
  templateUrl: './aktivitaet-list.component.html',
})
export class AktivitaetListComponent implements OnInit {
  private aktivitaetService = inject(AktivitaetService);
  private modalService = inject(NgbModal);
  private notification = inject(NotificationService);

  page: Page<Aktivitaet> | null = null;
  currentPage = 1;
  pageSize = 10;
  loading = true;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.aktivitaetService.getAll(this.currentPage - 1, this.pageSize).subscribe({
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

  confirmDelete(aktivitaet: Aktivitaet): void {
    const modalRef = this.modalService.open(ConfirmDialogComponent);
    modalRef.componentInstance.title = 'Aktivität löschen';
    modalRef.componentInstance.message = `Möchten Sie die Aktivität "${aktivitaet.subject}" wirklich löschen?`;
    modalRef.result.then(
      () => {
        this.aktivitaetService.delete(aktivitaet.id).subscribe({
          next: () => {
            this.notification.success('Aktivität erfolgreich gelöscht');
            this.loadData();
          },
          error: () => {},
        });
      },
      () => {},
    );
  }

  getTypBadgeClass(typ: AktivitaetTyp): string {
    switch (typ) {
      case 'ANRUF':
        return 'bg-primary';
      case 'EMAIL':
        return 'bg-info';
      case 'MEETING':
        return 'bg-success';
      case 'NOTIZ':
        return 'bg-secondary';
      case 'AUFGABE':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  }
}
