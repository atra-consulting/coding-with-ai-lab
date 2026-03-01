import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

Chart.register(...registerables);
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faChartBar,
  faEuroSign,
  faHandshake,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons';
import { forkJoin } from 'rxjs';
import { AuswertungService } from '../../../core/services/auswertung.service';
import { PhaseAggregate, PipelineKpis, TopFirma } from '../../../core/models/auswertung.model';
import { ChancePhase } from '../../../core/models/chance.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

const PHASE_CONFIG: { phase: ChancePhase; label: string; color: string }[] = [
  { phase: 'NEU', label: 'Neu', color: '#0d6efd' },
  { phase: 'QUALIFIZIERT', label: 'Qualifiziert', color: '#0dcaf0' },
  { phase: 'ANGEBOT', label: 'Angebot', color: '#ffc107' },
  { phase: 'VERHANDLUNG', label: 'Verhandlung', color: '#6c757d' },
  { phase: 'GEWONNEN', label: 'Gewonnen', color: '#198754' },
  { phase: 'VERLOREN', label: 'Verloren', color: '#dc3545' },
];

@Component({
  selector: 'app-pipeline-dashboard',
  imports: [CurrencyPipe, DecimalPipe, BaseChartDirective, FaIconComponent, LoadingSpinnerComponent],
  templateUrl: './pipeline-dashboard.component.html',
  styleUrl: './pipeline-dashboard.component.scss',
})
export class PipelineDashboardComponent implements OnInit {
  private auswertungService = inject(AuswertungService);

  loading = true;
  kpis: PipelineKpis | null = null;
  phaseAggregates: PhaseAggregate[] = [];
  topFirmen: TopFirma[] = [];

  // Icons
  faEuroSign = faEuroSign;
  faHandshake = faHandshake;
  faTrophy = faTrophy;
  faChartBar = faChartBar;

  // Chart configs
  barChartConfig: ChartConfiguration<'bar'> = { type: 'bar', data: { labels: [], datasets: [] } };
  doughnutChartConfig: ChartConfiguration<'doughnut'> = { type: 'doughnut', data: { labels: [], datasets: [] } };
  horizontalBarChartConfig: ChartConfiguration<'bar'> = { type: 'bar', data: { labels: [], datasets: [] } };

  // Pivot totals
  totalAnzahl = 0;
  totalSummeWert = 0;
  totalDurchschnittWert = 0;
  totalSummeGewichtet = 0;

  ngOnInit(): void {
    forkJoin({
      kpis: this.auswertungService.getPipelineKpis(),
      phases: this.auswertungService.getPhaseAggregates(),
      firmen: this.auswertungService.getTopFirmen(10),
    }).subscribe({
      next: ({ kpis, phases, firmen }) => {
        this.kpis = kpis;
        this.phaseAggregates = this.sortByPhaseOrder(phases);
        this.topFirmen = firmen;
        this.calculateTotals();
        this.buildBarChart();
        this.buildDoughnutChart();
        this.buildHorizontalBarChart();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  getPhaseLabel(phase: ChancePhase): string {
    return PHASE_CONFIG.find((p) => p.phase === phase)?.label ?? phase;
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
    return map[phase] ?? 'bg-secondary';
  }

  private sortByPhaseOrder(phases: PhaseAggregate[]): PhaseAggregate[] {
    const order = PHASE_CONFIG.map((p) => p.phase);
    return [...phases].sort((a, b) => order.indexOf(a.phase) - order.indexOf(b.phase));
  }

  private calculateTotals(): void {
    this.totalAnzahl = this.phaseAggregates.reduce((sum, p) => sum + p.anzahl, 0);
    this.totalSummeWert = this.phaseAggregates.reduce((sum, p) => sum + p.summeWert, 0);
    this.totalDurchschnittWert = this.totalAnzahl > 0 ? this.totalSummeWert / this.totalAnzahl : 0;
    this.totalSummeGewichtet = this.phaseAggregates.reduce((sum, p) => sum + p.summeGewichtet, 0);
  }

  private buildBarChart(): void {
    const labels = this.phaseAggregates.map((p) => this.getPhaseLabel(p.phase));
    const colors = this.phaseAggregates.map(
      (p) => PHASE_CONFIG.find((c) => c.phase === p.phase)?.color ?? '#6c757d'
    );

    this.barChartConfig = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: this.phaseAggregates.map((p) => p.summeWert),
            backgroundColor: colors,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `€ ${(ctx.raw as number).toLocaleString('de-DE', { minimumFractionDigits: 2 })}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `€ ${Number(value).toLocaleString('de-DE')}`,
            },
          },
        },
      },
    };
  }

  private buildDoughnutChart(): void {
    const labels = this.phaseAggregates.map((p) => this.getPhaseLabel(p.phase));
    const colors = this.phaseAggregates.map(
      (p) => PHASE_CONFIG.find((c) => c.phase === p.phase)?.color ?? '#6c757d'
    );

    this.doughnutChartConfig = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: this.phaseAggregates.map((p) => p.anzahl),
            backgroundColor: colors,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    };
  }

  private buildHorizontalBarChart(): void {
    this.horizontalBarChartConfig = {
      type: 'bar',
      data: {
        labels: this.topFirmen.map((f) => f.firmaName),
        datasets: [
          {
            data: this.topFirmen.map((f) => f.summeWert),
            backgroundColor: '#264892',
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `€ ${(ctx.raw as number).toLocaleString('de-DE', { minimumFractionDigits: 2 })}`,
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `€ ${Number(value).toLocaleString('de-DE')}`,
            },
          },
        },
      },
    };
  }
}
