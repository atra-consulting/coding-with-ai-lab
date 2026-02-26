import { Component, Input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBuilding,
  faCalendarCheck,
  faChartLine,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { DashboardStats } from '../../../../core/models/dashboard.model';
import { EurCurrencyPipe } from '../../../../shared/pipes/currency.pipe';

@Component({
  selector: 'app-stats-overview',
  imports: [EurCurrencyPipe, FaIconComponent],
  templateUrl: './stats-overview.component.html',
})
export class StatsOverviewComponent {
  @Input({ required: true }) stats!: DashboardStats;
  faBuilding = faBuilding;
  faUsers = faUsers;
  faCalendarCheck = faCalendarCheck;
  faChartLine = faChartLine;
}
