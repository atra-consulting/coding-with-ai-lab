import { Component, Input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBuilding,
  faCalendarCheck,
  faChartLine,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardStats } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-stats-overview',
  imports: [FaIconComponent, TranslateModule],
  templateUrl: './stats-overview.component.html',
})
export class StatsOverviewComponent {
  @Input({ required: true }) stats!: DashboardStats;
  faBuilding = faBuilding;
  faUsers = faUsers;
  faCalendarCheck = faCalendarCheck;
  faChartLine = faChartLine;
}
