import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Produkt, ProduktKategorie } from '../../../core/models/produkt.model';
import { NotificationService } from '../../../core/services/notification.service';
import { ProduktService } from '../../../core/services/produkt.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EurCurrencyPipe } from '../../../shared/pipes/currency.pipe';

@Component({
  selector: 'app-produkt-detail',
  imports: [RouterLink, LoadingSpinnerComponent, DatePipe, EurCurrencyPipe],
  templateUrl: './produkt-detail.component.html',
})
export class ProduktDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private produktService = inject(ProduktService);
  private modalService = inject(NgbModal);
  private notification = inject(NotificationService);

  produkt: Produkt | null = null;
  loading = true;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.produktService.getById(id).subscribe({
      next: (data) => {
        this.produkt = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  getStatusBadgeClass(aktiv: boolean): string {
    return aktiv ? 'bg-success' : 'bg-secondary';
  }

  onDelete(): void {
    if (!this.produkt) return;
    const modalRef = this.modalService.open(ConfirmDialogComponent);
    modalRef.componentInstance.title = 'Produkt löschen';
    modalRef.componentInstance.message = `Möchten Sie das Produkt "${this.produkt.name}" wirklich löschen?`;
    modalRef.result.then(
      () => {
        this.produktService.delete(this.produkt!.id).subscribe({
          next: () => {
            this.notification.success('Produkt erfolgreich gelöscht');
            this.router.navigate(['/produkte']);
          },
          error: () => {},
        });
      },
      () => {},
    );
  }
}
