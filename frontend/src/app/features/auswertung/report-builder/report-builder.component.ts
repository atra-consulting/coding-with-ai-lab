import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faChartBar,
  faChartLine,
  faChartPie,
  faFloppyDisk,
  faPlus,
  faTable,
  faTimes,
  faTrash,
  faSort,
  faSortUp,
  faSortDown,
} from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { ReportService } from '../../../core/services/report.service';
import { SavedReportService } from '../../../core/services/saved-report.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  ReportDimension,
  ReportMetrik,
  ReportQuery,
  ReportResult,
  ReportZeile,
  SavedReport,
} from '../../../core/models/report.model';
import { ChancePhase } from '../../../core/models/chance.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

Chart.register(...registerables);

interface DimensionOption {
  value: ReportDimension;
  label: string;
}

interface MetrikOption {
  value: ReportMetrik;
  label: string;
}

interface AnzeigeOption {
  value: 'tabelle' | 'balken' | 'linie' | 'kreis';
  label: string;
}

interface ZeitraumOption {
  value: string;
  label: string;
}

const DIMENSIONEN: DimensionOption[] = [
  { value: 'PHASE', label: 'Phase' },
  { value: 'FIRMA', label: 'Firma' },
  { value: 'PERSON', label: 'Person' },
  { value: 'MONAT', label: 'Monat' },
  { value: 'QUARTAL', label: 'Quartal' },
  { value: 'JAHR', label: 'Jahr' },
];

const METRIKEN: MetrikOption[] = [
  { value: 'ANZAHL', label: 'Anzahl' },
  { value: 'SUMME_WERT', label: 'Summe Wert' },
  { value: 'DURCHSCHNITT_WERT', label: 'Ø Wert' },
  { value: 'GEWICHTETER_WERT', label: 'Gewichteter Wert' },
  { value: 'GEWINNRATE', label: 'Gewinnrate' },
];

const ANZEIGE_OPTIONEN: AnzeigeOption[] = [
  { value: 'tabelle', label: 'Tabelle' },
  { value: 'balken', label: 'Balkendiagramm' },
  { value: 'linie', label: 'Liniendiagramm' },
  { value: 'kreis', label: 'Kreisdiagramm' },
];

const ZEITRAUM_OPTIONEN: ZeitraumOption[] = [
  { value: 'alle', label: 'Alle Daten' },
  { value: 'letztes_quartal', label: 'Letztes Quartal' },
  { value: 'letztes_jahr', label: 'Letztes Jahr' },
  { value: 'benutzerdefiniert', label: 'Benutzerdefiniert' },
];

const ALL_PHASES: ChancePhase[] = ['NEU', 'QUALIFIZIERT', 'ANGEBOT', 'VERHANDLUNG', 'GEWONNEN', 'VERLOREN'];

const PHASE_LABELS: Record<string, string> = {
  NEU: 'Neu',
  QUALIFIZIERT: 'Qualifiziert',
  ANGEBOT: 'Angebot',
  VERHANDLUNG: 'Verhandlung',
  GEWONNEN: 'Gewonnen',
  VERLOREN: 'Verloren',
};

const PHASE_COLORS: Record<string, string> = {
  NEU: '#0d6efd',
  QUALIFIZIERT: '#0dcaf0',
  ANGEBOT: '#ffc107',
  VERHANDLUNG: '#6c757d',
  GEWONNEN: '#198754',
  VERLOREN: '#dc3545',
};

const CHART_COLORS = [
  '#264892', '#0d6efd', '#0dcaf0', '#198754', '#ffc107',
  '#dc3545', '#6c757d', '#6610f2', '#d63384', '#fd7e14',
  '#20c997', '#0dcaf0',
];

@Component({
  selector: 'app-report-builder',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    FormsModule,
    BaseChartDirective,
    FaIconComponent,
  ],
  templateUrl: './report-builder.component.html',
  styleUrl: './report-builder.component.scss',
})
export class ReportBuilderComponent implements OnInit, OnDestroy {
  private reportService = inject(ReportService);
  private savedReportService = inject(SavedReportService);
  private notificationService = inject(NotificationService);
  private modalService = inject(NgbModal);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private queryTrigger$ = new Subject<void>();

  // Config options
  dimensionen = DIMENSIONEN;
  metrikOptionen = METRIKEN;
  anzeigeOptionen = ANZEIGE_OPTIONEN;
  zeitraumOptionen = ZEITRAUM_OPTIONEN;
  allPhases = ALL_PHASES;
  phaseLabels = PHASE_LABELS;

  // Current selections
  selectedDimension: ReportDimension = 'PHASE';
  selectedMetriken: ReportMetrik[] = ['SUMME_WERT'];
  selectedAnzeige: 'tabelle' | 'balken' | 'linie' | 'kreis' = 'tabelle';
  selectedZeitraum = 'alle';
  datumVon = '';
  datumBis = '';
  selectedPhasen: Set<ChancePhase> = new Set(ALL_PHASES);

  // State
  loading = false;
  initialLoading = true;
  result: ReportResult | null = null;
  savedReports: SavedReport[] = [];
  currentReportId: number | null = null;

  // Sorting
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  // Dropdowns
  showMetrikDropdown = false;
  showPhasenDropdown = false;

  // Chart
  chartConfig: ChartConfiguration | null = null;

  // Icons
  faFloppyDisk = faFloppyDisk;
  faPlus = faPlus;
  faTimes = faTimes;
  faTrash = faTrash;
  faTable = faTable;
  faChartBar = faChartBar;
  faChartLine = faChartLine;
  faChartPie = faChartPie;
  faSort = faSort;
  faSortUp = faSortUp;
  faSortDown = faSortDown;

  ngOnInit(): void {
    this.queryTrigger$.pipe(
      debounceTime(300),
      takeUntil(this.destroy$),
    ).subscribe(() => this.executeQuery());

    // Load saved reports
    this.savedReportService.getAll().subscribe({
      next: (reports) => {
        this.savedReports = reports;

        // Check for report query param
        const reportId = this.route.snapshot.queryParamMap.get('report');
        if (reportId) {
          const report = this.savedReports.find(r => r.id === +reportId);
          if (report) {
            this.loadReport(report);
            return;
          }
        }

        // Execute default query
        this.triggerQuery();
      },
      error: () => {
        this.triggerQuery();
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Toolbar actions
  onDimensionChange(): void {
    this.triggerQuery();
  }

  onAnzeigeChange(): void {
    this.buildChart();
  }

  onZeitraumChange(): void {
    if (this.selectedZeitraum !== 'benutzerdefiniert') {
      this.datumVon = '';
      this.datumBis = '';
    }
    this.triggerQuery();
  }

  onDatumChange(): void {
    this.triggerQuery();
  }

  // Metriken management
  addMetrik(metrik: ReportMetrik): void {
    if (!this.selectedMetriken.includes(metrik)) {
      this.selectedMetriken = [...this.selectedMetriken, metrik];
      this.showMetrikDropdown = false;
      this.triggerQuery();
    }
  }

  removeMetrik(metrik: ReportMetrik): void {
    if (this.selectedMetriken.length > 1) {
      this.selectedMetriken = this.selectedMetriken.filter(m => m !== metrik);
      this.triggerQuery();
    }
  }

  getMetrikLabel(metrik: ReportMetrik): string {
    return METRIKEN.find(m => m.value === metrik)?.label ?? metrik;
  }

  get availableMetriken(): MetrikOption[] {
    return METRIKEN.filter(m => !this.selectedMetriken.includes(m.value));
  }

  toggleMetrikDropdown(): void {
    this.showMetrikDropdown = !this.showMetrikDropdown;
    this.showPhasenDropdown = false;
  }

  // Phasen filter
  togglePhase(phase: ChancePhase): void {
    if (this.selectedPhasen.has(phase)) {
      if (this.selectedPhasen.size > 1) {
        this.selectedPhasen.delete(phase);
      }
    } else {
      this.selectedPhasen.add(phase);
    }
    this.selectedPhasen = new Set(this.selectedPhasen);
    this.triggerQuery();
  }

  isPhaseSelected(phase: ChancePhase): boolean {
    return this.selectedPhasen.has(phase);
  }

  get phasenFilterLabel(): string {
    if (this.selectedPhasen.size === ALL_PHASES.length) {
      return 'Alle Phasen';
    }
    if (this.selectedPhasen.size === 1) {
      return PHASE_LABELS[[...this.selectedPhasen][0]];
    }
    return `${this.selectedPhasen.size} Phasen`;
  }

  togglePhasenDropdown(): void {
    this.showPhasenDropdown = !this.showPhasenDropdown;
    this.showMetrikDropdown = false;
  }

  // Sorting
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  getSortIcon(column: string) {
    if (this.sortColumn !== column) return this.faSort;
    return this.sortDirection === 'asc' ? this.faSortUp : this.faSortDown;
  }

  get sortedZeilen(): ReportZeile[] {
    if (!this.result?.zeilen) return [];
    if (!this.sortColumn) return this.result.zeilen;

    return [...this.result.zeilen].sort((a, b) => {
      let valA: number | string | null;
      let valB: number | string | null;

      if (this.sortColumn === 'label') {
        valA = a.label;
        valB = b.label;
      } else {
        valA = a.werte[this.sortColumn!] ?? 0;
        valB = b.werte[this.sortColumn!] ?? 0;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return this.sortDirection === 'asc'
          ? valA.localeCompare(valB, 'de')
          : valB.localeCompare(valA, 'de');
      }

      const numA = valA as number;
      const numB = valB as number;
      return this.sortDirection === 'asc' ? numA - numB : numB - numA;
    });
  }

  // Totals
  getTotal(metrik: string): number | null {
    if (!this.result?.zeilen) return null;
    if (metrik === 'GEWINNRATE' || metrik === 'DURCHSCHNITT_WERT') {
      const values = this.result.zeilen.map(z => z.werte[metrik]).filter(v => v != null) as number[];
      if (values.length === 0) return null;
      return values.reduce((sum, v) => sum + v, 0) / values.length;
    }
    return this.result.zeilen.reduce((sum, z) => sum + ((z.werte[metrik] as number) ?? 0), 0);
  }

  isRateMetrik(metrik: string): boolean {
    return metrik === 'GEWINNRATE';
  }

  isCurrencyMetrik(metrik: string): boolean {
    return ['SUMME_WERT', 'DURCHSCHNITT_WERT', 'GEWICHTETER_WERT'].includes(metrik);
  }

  // Phase badge for PHASE dimension
  getPhaseBadgeClass(label: string): string {
    const map: Record<string, string> = {
      NEU: 'bg-primary',
      QUALIFIZIERT: 'bg-info',
      ANGEBOT: 'bg-warning text-dark',
      VERHANDLUNG: 'bg-secondary',
      GEWONNEN: 'bg-success',
      VERLOREN: 'bg-danger',
    };
    return map[label] ?? '';
  }

  getDimensionLabel(): string {
    return DIMENSIONEN.find(d => d.value === this.selectedDimension)?.label ?? '';
  }

  // Saved Reports
  loadReport(report: SavedReport): void {
    this.currentReportId = report.id;
    try {
      const config: ReportQuery & { anzeige?: string } = JSON.parse(report.config);
      this.selectedDimension = config.dimension;
      this.selectedMetriken = config.metriken;
      if (config.anzeige) {
        this.selectedAnzeige = config.anzeige as typeof this.selectedAnzeige;
      }
      if (config.filter) {
        if (config.filter.phasen?.length) {
          this.selectedPhasen = new Set(config.filter.phasen);
        } else {
          this.selectedPhasen = new Set(ALL_PHASES);
        }
        if (config.filter.datumVon) {
          this.selectedZeitraum = 'benutzerdefiniert';
          this.datumVon = config.filter.datumVon;
          this.datumBis = config.filter.datumBis ?? '';
        } else {
          this.selectedZeitraum = 'alle';
          this.datumVon = '';
          this.datumBis = '';
        }
      }
      this.triggerQuery();
      this.router.navigate([], {
        queryParams: { report: report.id },
        queryParamsHandling: 'merge',
      });
    } catch {
      this.notificationService.error('Report-Konfiguration konnte nicht geladen werden.');
    }
  }

  newReport(): void {
    this.currentReportId = null;
    this.selectedDimension = 'PHASE';
    this.selectedMetriken = ['SUMME_WERT'];
    this.selectedAnzeige = 'tabelle';
    this.selectedZeitraum = 'alle';
    this.datumVon = '';
    this.datumBis = '';
    this.selectedPhasen = new Set(ALL_PHASES);
    this.router.navigate([], { queryParams: {} });
    this.triggerQuery();
  }

  saveReport(): void {
    const name = prompt(
      this.currentReportId ? 'Report-Name ändern:' : 'Name für den Report:',
      this.currentReportId
        ? this.savedReports.find(r => r.id === this.currentReportId)?.name ?? ''
        : ''
    );
    if (!name?.trim()) return;

    const config = JSON.stringify({
      dimension: this.selectedDimension,
      metriken: this.selectedMetriken,
      anzeige: this.selectedAnzeige,
      filter: this.buildFilter(),
    });

    if (this.currentReportId) {
      this.savedReportService.update(this.currentReportId, { name: name.trim(), config }).subscribe({
        next: (updated) => {
          const idx = this.savedReports.findIndex(r => r.id === updated.id);
          if (idx >= 0) this.savedReports[idx] = updated;
          this.notificationService.success('Report aktualisiert.');
        },
        error: () => this.notificationService.error('Fehler beim Aktualisieren.'),
      });
    } else {
      this.savedReportService.create({ name: name.trim(), config }).subscribe({
        next: (created) => {
          this.savedReports = [created, ...this.savedReports];
          this.currentReportId = created.id;
          this.router.navigate([], {
            queryParams: { report: created.id },
            queryParamsHandling: 'merge',
          });
          this.notificationService.success('Report gespeichert.');
        },
        error: () => this.notificationService.error('Fehler beim Speichern.'),
      });
    }
  }

  deleteReport(report: SavedReport, event: Event): void {
    event.stopPropagation();
    const ref = this.modalService.open(ConfirmDialogComponent);
    ref.componentInstance.title = 'Report löschen';
    ref.componentInstance.message = `Soll der Report "${report.name}" wirklich gelöscht werden?`;
    ref.componentInstance.confirmText = 'Löschen';
    ref.result.then(
      () => {
        this.savedReportService.delete(report.id).subscribe({
          next: () => {
            this.savedReports = this.savedReports.filter(r => r.id !== report.id);
            if (this.currentReportId === report.id) {
              this.currentReportId = null;
              this.router.navigate([], { queryParams: {} });
            }
            this.notificationService.success('Report gelöscht.');
          },
          error: () => this.notificationService.error('Fehler beim Löschen.'),
        });
      },
      () => {},
    );
  }

  // Close dropdowns on outside click
  closeDropdowns(): void {
    this.showMetrikDropdown = false;
    this.showPhasenDropdown = false;
  }

  // Private helpers
  private triggerQuery(): void {
    this.queryTrigger$.next();
  }

  private executeQuery(): void {
    this.loading = true;
    this.sortColumn = null;

    const query: ReportQuery = {
      dimension: this.selectedDimension,
      metriken: this.selectedMetriken,
      filter: this.buildFilter(),
    };

    this.reportService.executeReport(query).subscribe({
      next: (result) => {
        this.result = result;
        this.buildChart();
        this.loading = false;
        this.initialLoading = false;
      },
      error: () => {
        this.loading = false;
        this.initialLoading = false;
      },
    });
  }

  private buildFilter() {
    const phasen = this.selectedPhasen.size < ALL_PHASES.length
      ? [...this.selectedPhasen]
      : null;

    let datumVon: string | null = null;
    let datumBis: string | null = null;

    if (this.selectedZeitraum === 'benutzerdefiniert') {
      datumVon = this.datumVon || null;
      datumBis = this.datumBis || null;
    } else if (this.selectedZeitraum === 'letztes_quartal') {
      const now = new Date();
      const qMonth = Math.floor((now.getMonth()) / 3) * 3;
      const start = new Date(now.getFullYear(), qMonth - 3, 1);
      const end = new Date(now.getFullYear(), qMonth, 0);
      datumVon = this.formatDate(start);
      datumBis = this.formatDate(end);
    } else if (this.selectedZeitraum === 'letztes_jahr') {
      const year = new Date().getFullYear() - 1;
      datumVon = `${year}-01-01`;
      datumBis = `${year}-12-31`;
    }

    if (!phasen && !datumVon && !datumBis) return null;
    return { phasen, datumVon, datumBis };
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private buildChart(): void {
    if (!this.result || this.selectedAnzeige === 'tabelle') {
      this.chartConfig = null;
      return;
    }

    const labels = this.result.zeilen.map(z => z.label);
    const firstMetrik = this.selectedMetriken[0];
    const data = this.result.zeilen.map(z => (z.werte[firstMetrik] as number) ?? 0);

    const colors = this.selectedDimension === 'PHASE'
      ? this.result.zeilen.map(z => PHASE_COLORS[z.label] ?? '#6c757d')
      : labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

    const metrikLabel = this.getMetrikLabel(firstMetrik);
    const isCurrency = this.isCurrencyMetrik(firstMetrik);

    if (this.selectedAnzeige === 'balken') {
      this.chartConfig = {
        type: 'bar',
        data: {
          labels,
          datasets: [{ data, backgroundColor: colors, label: metrikLabel }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => isCurrency
                  ? `€ ${Number(value).toLocaleString('de-DE')}`
                  : value.toLocaleString('de-DE'),
              },
            },
          },
        },
      };
    } else if (this.selectedAnzeige === 'linie') {
      this.chartConfig = {
        type: 'line',
        data: {
          labels,
          datasets: [{
            data,
            borderColor: '#264892',
            backgroundColor: 'rgba(38, 72, 146, 0.1)',
            fill: true,
            tension: 0.3,
            label: metrikLabel,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => isCurrency
                  ? `€ ${Number(value).toLocaleString('de-DE')}`
                  : value.toLocaleString('de-DE'),
              },
            },
          },
        },
      };
    } else if (this.selectedAnzeige === 'kreis') {
      this.chartConfig = {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data, backgroundColor: colors }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
        },
      };
    }
  }
}
