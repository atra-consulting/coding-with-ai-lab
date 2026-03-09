import { Component, inject, OnInit } from '@angular/core';
import { DashboardStats } from '../../core/models/dashboard.model';
import { DashboardService } from '../../core/services/dashboard.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { RecentActivitiesComponent } from './widgets/recent-activities/recent-activities.component';
import { SalaryStatisticsComponent } from './widgets/salary-statistics/salary-statistics.component';
import { StatsOverviewComponent } from './widgets/stats-overview/stats-overview.component';
import { TopCompaniesComponent } from './widgets/top-companies/top-companies.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  imports: [
    LoadingSpinnerComponent,
    StatsOverviewComponent,
    RecentActivitiesComponent,
    SalaryStatisticsComponent,
    TopCompaniesComponent,
    TranslateModule,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  stats: DashboardStats | null = null;
  loading = true;

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
