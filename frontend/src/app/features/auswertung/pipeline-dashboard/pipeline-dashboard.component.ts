import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faChartBar,
  faChartPie,
  faEuroSign,
  faGripVertical,
  faHandshake,
  faBuilding,
  faPen,
  faPlus,
  faRotateLeft,
  faCheck,
  faTable,
  faCubes,
  faTimes,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons';
import { forkJoin } from 'rxjs';
import { AuswertungService } from '../../../core/services/auswertung.service';
import { DashboardConfigService } from '../../../core/services/dashboard-config.service';
import { SavedReportService } from '../../../core/services/saved-report.service';
import { PhaseAggregate, PipelineKpis, TopFirma } from '../../../core/models/auswertung.model';
import { SavedReport } from '../../../core/models/report.model';
import { ChancePhase } from '../../../core/models/chance.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ReportBuilderComponent } from '../report-builder/report-builder.component';
import { ReportWidgetComponent } from '../report-widget/report-widget.component';

Chart.register(...registerables);

interface WidgetDefinition {
  id: string;
  title: string;
  icon: IconDefinition;
}

const WIDGET_REGISTRY: WidgetDefinition[] = [
  { id: 'kpi-cards', title: 'KPI-Kacheln', icon: faEuroSign },
  { id: 'bar-chart', title: 'Pipeline-Wert nach Phase', icon: faChartBar },
  { id: 'doughnut-chart', title: 'Verteilung nach Phase', icon: faChartPie },
  { id: 'top-firmen', title: 'Top 10 Firmen', icon: faBuilding },
  { id: 'pivot-table', title: 'Übersicht nach Phase', icon: faTable },
];

const DEFAULT_WIDGET_ORDER = ['kpi-cards', 'bar-chart', 'doughnut-chart', 'top-firmen', 'pivot-table'];

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
  imports: [CurrencyPipe, DecimalPipe, BaseChartDirective, FaIconComponent, LoadingSpinnerComponent, CdkDrag, CdkDropList, ReportBuilderComponent, ReportWidgetComponent],
  templateUrl: './pipeline-dashboard.component.html',
  styleUrl: './pipeline-dashboard.component.scss',
})
export class PipelineDashboardComponent implements OnInit {
  private auswertungService = inject(AuswertungService);
  private dashboardConfigService = inject(DashboardConfigService);
  private savedReportService = inject(SavedReportService);

  loading = true;
  editMode = false;
  kpis: PipelineKpis | null = null;
  phaseAggregates: PhaseAggregate[] = [];
  topFirmen: TopFirma[] = [];
  savedReports: SavedReport[] = [];

  // Widget state
  visibleWidgets: string[] = [...DEFAULT_WIDGET_ORDER];

  // Report Builder slide-over
  reportBuilderOpen = false;

  // Icons
  faEuroSign = faEuroSign;
  faHandshake = faHandshake;
  faTrophy = faTrophy;
  faChartBar = faChartBar;
  faCubes = faCubes;
  faGripVertical = faGripVertical;
  faPen = faPen;
  faPlus = faPlus;
  faRotateLeft = faRotateLeft;
  faCheck = faCheck;
  faTimes = faTimes;

  // Chart configs
  barChartConfig: ChartConfiguration<'bar'> = { type: 'bar', data: { labels: [], datasets: [] } };
  doughnutChartConfig: ChartConfiguration<'doughnut'> = { type: 'doughnut', data: { labels: [], datasets: [] } };
  horizontalBarChartConfig: ChartConfiguration<'bar'> = { type: 'bar', data: { labels: [], datasets: [] } };

  // Pivot totals
  totalAnzahl = 0;
  totalSummeWert = 0;
  totalDurchschnittWert = 0;
  totalSummeGewichtet = 0;

  // Add-widget dropdown
  showAddDropdown = false;

  ngOnInit(): void {
    forkJoin({
      kpis: this.auswertungService.getPipelineKpis(),
      phases: this.auswertungService.getPhaseAggregates(),
      firmen: this.auswertungService.getTopFirmen(10),
      config: this.dashboardConfigService.getConfig(),
      savedReports: this.savedReportService.getAll(),
    }).subscribe({
      next: ({ kpis, phases, firmen, config, savedReports }) => {
        this.kpis = kpis;
        this.phaseAggregates = this.sortByPhaseOrder(phases);
        this.topFirmen = firmen;
        this.savedReports = savedReports;

        if (config?.visibleWidgets?.length) {
          // Filter out any invalid widget IDs (static or report-based)
          this.visibleWidgets = config.visibleWidgets.filter(
            (id) => this.isValidWidgetId(id)
          );
        }

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

  // Widget management
  isWidgetVisible(id: string): boolean {
    return this.visibleWidgets.includes(id);
  }

  getWidgetTitle(id: string): string {
    if (id.startsWith('report-')) {
      const reportId = parseInt(id.replace('report-', ''), 10);
      return this.savedReports.find(r => r.id === reportId)?.name ?? 'Unbekannter Report';
    }
    return WIDGET_REGISTRY.find((w) => w.id === id)?.title ?? id;
  }

  get removedWidgets(): WidgetDefinition[] {
    return WIDGET_REGISTRY.filter((w) => !this.visibleWidgets.includes(w.id));
  }

  get removedReportWidgets(): SavedReport[] {
    return this.savedReports.filter(
      (r) => !this.visibleWidgets.includes(`report-${r.id}`)
    );
  }

  private isValidWidgetId(id: string): boolean {
    if (WIDGET_REGISTRY.some((w) => w.id === id)) return true;
    if (id.startsWith('report-')) {
      const reportId = parseInt(id.replace('report-', ''), 10);
      return this.savedReports.some((r) => r.id === reportId);
    }
    return false;
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    this.showAddDropdown = false;
    if (!this.editMode) {
      this.saveConfig();
    }
  }

  onWidgetDrop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.visibleWidgets, event.previousIndex, event.currentIndex);
  }

  removeWidget(id: string): void {
    this.visibleWidgets = this.visibleWidgets.filter((w) => w !== id);
  }

  addWidget(id: string): void {
    this.visibleWidgets.push(id);
    this.showAddDropdown = false;
  }

  resetWidgets(): void {
    this.visibleWidgets = [...DEFAULT_WIDGET_ORDER];
  }

  toggleAddDropdown(): void {
    this.showAddDropdown = !this.showAddDropdown;
  }

  private saveConfig(): void {
    this.dashboardConfigService.saveConfig({ visibleWidgets: this.visibleWidgets }).subscribe();
  }

  // Report Builder
  openReportBuilder(): void {
    this.reportBuilderOpen = true;
  }

  closeReportBuilder(): void {
    this.reportBuilderOpen = false;
    // Reload saved reports to pick up any changes made in the builder
    this.savedReportService.getAll().subscribe({
      next: (reports) => {
        this.savedReports = reports;
        // Re-validate visible widgets (remove deleted report widgets)
        this.visibleWidgets = this.visibleWidgets.filter((id) => this.isValidWidgetId(id));
      },
    });
  }

  // Phase helpers
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
