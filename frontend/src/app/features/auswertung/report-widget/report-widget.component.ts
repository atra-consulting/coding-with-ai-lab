import { Component, inject, input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ReportService } from '../../../core/services/report.service';
import {
  ReportMetrik,
  ReportQuery,
  ReportResult,
  SavedReport,
} from '../../../core/models/report.model';

import { TranslateModule } from '@ngx-translate/core';

Chart.register(...registerables);

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

const METRIK_LABELS: Record<string, string> = {
  ANZAHL: 'Anzahl',
  SUMME_WERT: 'Summe Wert',
  DURCHSCHNITT_WERT: '\u00D8 Wert',
  GEWICHTETER_WERT: 'Gewichteter Wert',
  GEWINNRATE: 'Gewinnrate',
};

@Component({
  selector: 'app-report-widget',
  imports: [CurrencyPipe, DecimalPipe, BaseChartDirective, TranslateModule],
  templateUrl: './report-widget.component.html',
  styleUrl: './report-widget.component.scss',
})
export class ReportWidgetComponent implements OnInit, OnChanges {
  private reportService = inject(ReportService);

  widgetId = input.required<string>();
  savedReports = input.required<SavedReport[]>();

  loading = true;
  error: string | null = null;
  result: ReportResult | null = null;
  chartConfig: ChartConfiguration | null = null;
  anzeige: 'tabelle' | 'balken' | 'linie' | 'kreis' = 'tabelle';
  metriken: ReportMetrik[] = [];
  reportName = '';

  ngOnInit(): void {
    this.loadReport();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['savedReports'] && !changes['savedReports'].firstChange) {
      this.loadReport();
    }
  }

  private loadReport(): void {
    const reportId = this.extractReportId();
    if (reportId === null) {
      this.error = 'Ungültige Widget-ID';
      this.loading = false;
      return;
    }

    const report = this.savedReports().find(r => r.id === reportId);
    if (!report) {
      this.error = 'Report nicht gefunden';
      this.loading = false;
      return;
    }

    this.reportName = report.name;
    this.error = null;

    try {
      const config: ReportQuery & { anzeige?: string } = JSON.parse(report.config);
      this.anzeige = (config.anzeige as typeof this.anzeige) ?? 'tabelle';
      this.metriken = config.metriken;

      const query: ReportQuery = {
        dimension: config.dimension,
        metriken: config.metriken,
        filter: config.filter ?? null,
      };

      this.loading = true;
      this.reportService.executeReport(query).subscribe({
        next: (result) => {
          this.result = result;
          this.buildChart();
          this.loading = false;
        },
        error: () => {
          this.error = 'Fehler beim Laden der Daten';
          this.loading = false;
        },
      });
    } catch {
      this.error = 'Ungültige Report-Konfiguration';
      this.loading = false;
    }
  }

  private extractReportId(): number | null {
    const match = this.widgetId().match(/^report-(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }

  getMetrikLabel(metrik: string): string {
    return METRIK_LABELS[metrik] ?? metrik;
  }

  isCurrencyMetrik(metrik: string): boolean {
    return ['SUMME_WERT', 'DURCHSCHNITT_WERT', 'GEWICHTETER_WERT'].includes(metrik);
  }

  isRateMetrik(metrik: string): boolean {
    return metrik === 'GEWINNRATE';
  }

  getTotal(metrik: string): number | null {
    if (!this.result?.zeilen) return null;
    if (metrik === 'GEWINNRATE' || metrik === 'DURCHSCHNITT_WERT') {
      const values = this.result.zeilen.map(z => z.werte[metrik]).filter(v => v != null) as number[];
      if (values.length === 0) return null;
      return values.reduce((sum, v) => sum + v, 0) / values.length;
    }
    return this.result.zeilen.reduce((sum, z) => sum + ((z.werte[metrik] as number) ?? 0), 0);
  }

  private buildChart(): void {
    if (!this.result || this.anzeige === 'tabelle') {
      this.chartConfig = null;
      return;
    }

    const labels = this.result.zeilen.map(z => z.label);
    const firstMetrik = this.metriken[0];
    const data = this.result.zeilen.map(z => (z.werte[firstMetrik] as number) ?? 0);

    const dimension = this.result.dimension;
    const colors = dimension === 'PHASE'
      ? this.result.zeilen.map(z => PHASE_COLORS[z.label] ?? '#6c757d')
      : labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

    const metrikLabel = this.getMetrikLabel(firstMetrik);
    const isCurrency = this.isCurrencyMetrik(firstMetrik);

    if (this.anzeige === 'balken') {
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
                  ? `\u20AC ${Number(value).toLocaleString('de-DE')}`
                  : value.toLocaleString('de-DE'),
              },
            },
          },
        },
      };
    } else if (this.anzeige === 'linie') {
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
                  ? `\u20AC ${Number(value).toLocaleString('de-DE')}`
                  : value.toLocaleString('de-DE'),
              },
            },
          },
        },
      };
    } else if (this.anzeige === 'kreis') {
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
