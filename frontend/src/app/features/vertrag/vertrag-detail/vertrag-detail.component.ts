import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Vertrag, VertragStatus } from '../../../core/models/vertrag.model';
import { VertragService } from '../../../core/services/vertrag.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EurCurrencyPipe } from '../../../shared/pipes/currency.pipe';

@Component({
  selector: 'app-vertrag-detail',
  imports: [RouterLink, LoadingSpinnerComponent, DatePipe, EurCurrencyPipe],
  templateUrl: './vertrag-detail.component.html',
})
export class VertragDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private vertragService = inject(VertragService);

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
}
