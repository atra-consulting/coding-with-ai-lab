import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Chance, ChancePhase } from '../../../core/models/chance.model';
import { ChanceService } from '../../../core/services/chance.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EurCurrencyPipe } from '../../../shared/pipes/currency.pipe';

@Component({
  selector: 'app-chance-detail',
  imports: [RouterLink, LoadingSpinnerComponent, DatePipe, EurCurrencyPipe],
  templateUrl: './chance-detail.component.html',
})
export class ChanceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private chanceService = inject(ChanceService);

  chance: Chance | null = null;
  loading = true;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.chanceService.getById(id).subscribe({
      next: (data) => {
        this.chance = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
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
