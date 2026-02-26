import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBuilding,
  faCalendarCheck,
  faChartLine,
  faFileContract,
  faMapMarkerAlt,
  faMoneyBillWave,
  faSitemap,
  faTachometerAlt,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, FaIconComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  faTachometerAlt = faTachometerAlt;
  faBuilding = faBuilding;
  faUsers = faUsers;
  faSitemap = faSitemap;
  faMapMarkerAlt = faMapMarkerAlt;
  faMoneyBillWave = faMoneyBillWave;
  faCalendarCheck = faCalendarCheck;
  faFileContract = faFileContract;
  faChartLine = faChartLine;
}
