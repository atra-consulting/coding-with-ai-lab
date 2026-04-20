import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardData, RecentAktivitaet } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  template: `
    <main>
      <div class="page-header">
        <h2>Dashboard</h2>
      </div>

      @if (loading()) {
        <div class="text-muted" role="status" aria-live="polite">Lade…</div>
      } @else if (error()) {
        <div class="alert alert-danger" role="alert">{{ error() }}</div>
      } @else if (data()) {
        <!-- KPI tiles -->
        <div class="row g-3">
          <div class="col-md-6 col-lg-3">
            <a class="card h-100 text-decoration-none text-reset kpi-tile" routerLink="/firmen">
              <dl class="card-body overflow-hidden mb-0">
                <dt class="text-muted small fw-normal">Firmen</dt>
                <dd class="display-6 text-truncate mb-0">{{ data()!.firmenCount }}</dd>
              </dl>
            </a>
          </div>
          <div class="col-md-6 col-lg-3">
            <a class="card h-100 text-decoration-none text-reset kpi-tile" routerLink="/personen">
              <dl class="card-body overflow-hidden mb-0">
                <dt class="text-muted small fw-normal">Personen</dt>
                <dd class="display-6 text-truncate mb-0">{{ data()!.personenCount }}</dd>
              </dl>
            </a>
          </div>
          <div class="col-md-6 col-lg-3">
            <a class="card h-100 text-decoration-none text-reset kpi-tile" routerLink="/chancen">
              <dl class="card-body overflow-hidden mb-0">
                <dt class="text-muted small fw-normal">Offene Chancen</dt>
                <dd class="display-6 text-truncate mb-0">{{ data()!.offeneChancenCount }}</dd>
              </dl>
            </a>
          </div>
          <div class="col-md-6 col-lg-3">
            <a class="card h-100 text-decoration-none text-reset kpi-tile" routerLink="/chancen">
              <dl class="card-body overflow-hidden mb-0">
                <dt class="text-muted small fw-normal">Gewonnener Umsatz</dt>
                <dd class="display-6 text-truncate mb-0"
                    [title]="(data()!.gewonneneChancenSumme | currency:'EUR':'symbol':'1.0-0':'de-DE') ?? ''">
                  {{ data()!.gewonneneChancenSumme | currency:'EUR':'symbol':'1.0-0':'de-DE' }}
                </dd>
              </dl>
            </a>
          </div>
        </div>

        <!-- Recent lists -->
        <div class="row g-3 mt-1">
          <div class="col-md-6">
            <div class="card">
              <div class="card-header fw-semibold">Letzte Chancen</div>
              @if (data()!.recentChancen.length === 0) {
                <div class="card-body text-muted">Noch keine Chancen</div>
              } @else {
                <ul class="list-group list-group-flush">
                  @for (c of data()!.recentChancen; track c.id) {
                    <li class="list-group-item list-group-item-action p-0">
                      <a class="d-block text-decoration-none text-reset px-3 py-2" [routerLink]="['/chancen', c.id]">
                        <div class="d-flex justify-content-between align-items-start">
                          <div>
                            <div class="fw-medium">{{ c.titel }}</div>
                            <small class="text-muted">{{ c.firmaName }}</small>
                          </div>
                          @if (c.wert !== null) {
                            <span class="badge bg-secondary text-white ms-2">
                              {{ c.wert | currency:'EUR':'symbol':'1.0-0':'de-DE' }}
                            </span>
                          }
                        </div>
                      </a>
                    </li>
                  }
                </ul>
              }
            </div>
          </div>

          <div class="col-md-6">
            <div class="card">
              <div class="card-header fw-semibold">Letzte Aktivitäten</div>
              @if (data()!.recentAktivitaeten.length === 0) {
                <div class="card-body text-muted">Noch keine Aktivitäten</div>
              } @else {
                <ul class="list-group list-group-flush">
                  @for (a of data()!.recentAktivitaeten; track a.id) {
                    <li class="list-group-item list-group-item-action p-0">
                      <a class="d-block text-decoration-none text-reset px-3 py-2" [routerLink]="['/aktivitaeten', a.id]">
                        <div class="d-flex justify-content-between align-items-start">
                          <div>
                            <div class="fw-medium">{{ a.subject }}</div>
                            <small class="text-muted">
                              {{ a.datum | date:'dd.MM.yyyy' }}{{ aktivitaetContext(a) }}
                            </small>
                          </div>
                          <span class="badge bg-secondary text-white ms-2">{{ a.typ }}</span>
                        </div>
                      </a>
                    </li>
                  }
                </ul>
              }
            </div>
          </div>
        </div>
      }
    </main>
  `,
  styles: [
    `
      .kpi-tile {
        transition: box-shadow 0.15s ease, transform 0.15s ease;
      }
      .kpi-tile:hover,
      .kpi-tile:focus-visible {
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
        transform: translateY(-1px);
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  loading = signal(true);
  data = signal<DashboardData | null>(null);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (result) => {
        this.data.set(result);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Dashboard konnte nicht geladen werden.');
        this.loading.set(false);
      },
    });
  }

  aktivitaetContext(a: RecentAktivitaet): string {
    const parts = [a.firmaName, a.personName].filter(Boolean);
    return parts.length > 0 ? ` — ${parts.join(', ')}` : '';
  }
}
