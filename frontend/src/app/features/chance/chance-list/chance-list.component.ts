import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Chance, ChancePhase } from '../../../core/models/chance.model';
import { Page } from '../../../core/models/page.model';
import { ChanceService } from '../../../core/services/chance.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EurCurrencyPipe } from '../../../shared/pipes/currency.pipe';

@Component({
  selector: 'app-chance-list',
  imports: [RouterLink, NgbPagination, LoadingSpinnerComponent, EurCurrencyPipe],
  templateUrl: './chance-list.component.html',
})
export class ChanceListComponent implements OnInit {
  private chanceService = inject(ChanceService);
  private modalService = inject(NgbModal);
  private notification = inject(NotificationService);

  page: Page<Chance> | null = null;
  currentPage = 1;
  pageSize = 10;
  loading = true;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.chanceService.getAll(this.currentPage - 1, this.pageSize, 'titel,asc').subscribe({
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

  confirmDelete(chance: Chance): void {
    const modalRef = this.modalService.open(ConfirmDialogComponent);
    modalRef.componentInstance.title = 'Chance löschen';
    modalRef.componentInstance.message = `Möchten Sie die Chance "${chance.titel}" wirklich löschen?`;
    modalRef.result.then(
      () => {
        this.chanceService.delete(chance.id).subscribe({
          next: () => {
            this.notification.success('Chance erfolgreich gelöscht');
            this.loadData();
          },
          error: () => {},
        });
      },
      () => {},
    );
  }

  getPhaseBadgeClass(phase: ChancePhase): string {
    const map: Record<ChancePhase, string> = {
      NEU: 'bg-primary',
      QUALIFIZIERT: 'bg-info',
      ANGEBOT: 'bg-warning text-dark',
      VERHANDLUNG: 'bg-secondary',
      GEWONNEN: 'bg-success',
      VERLOREN: 'bg-danger',
    };
    return map[phase] || 'bg-secondary';
  }
}
