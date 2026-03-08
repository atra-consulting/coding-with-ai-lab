import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Vertrag, VertragStatus } from '../../../core/models/vertrag.model';
import { NotificationService } from '../../../core/services/notification.service';
import { VertragService } from '../../../core/services/vertrag.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EurCurrencyPipe } from '../../../shared/pipes/currency.pipe';

@Component({
  selector: 'app-vertrag-detail',
  imports: [RouterLink, LoadingSpinnerComponent, DatePipe, EurCurrencyPipe],
  templateUrl: './vertrag-detail.component.html',
})
export class VertragDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vertragService = inject(VertragService);
  private modalService = inject(NgbModal);
  private notification = inject(NotificationService);

  vertrag: Vertrag | null = null;
  loading = true;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.vertragService.getById(id).subscribe({
      next: (data) => {
        this.vertrag = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
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

  onDelete(): void {
    if (!this.vertrag) return;
    const modalRef = this.modalService.open(ConfirmDialogComponent);
    modalRef.componentInstance.title = 'Vertrag löschen';
    modalRef.componentInstance.message = `Möchten Sie den Vertrag "${this.vertrag.titel}" wirklich löschen?`;
    modalRef.result.then(
      () => {
        this.vertragService.delete(this.vertrag!.id).subscribe({
          next: () => {
            this.notification.success('Vertrag erfolgreich gelöscht');
            this.router.navigate(['/vertraege']);
          },
        });
      },
      () => {},
    );
  }
}
