import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBuilding,
  faCalendarCheck,
  faChartLine,
  faChartPie,
  faFileContract,
  faMapMarkerAlt,
  faMoneyBillWave,
  faSitemap,
  faTachometerAlt,
  faUsers,
  faUsersCog,
  faAngleDoubleLeft,
  faAngleDoubleRight,
} from '@fortawesome/free-solid-svg-icons';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';

interface NavItem {
  labelKey: string;
  route: string;
  icon: IconDefinition;
  permission?: string;
}

interface NavSection {
  titleKey: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, FaIconComponent, TranslateModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private authService = inject(AuthService);
  layoutService = inject(LayoutService);

  faAngleDoubleLeft = faAngleDoubleLeft;
  faAngleDoubleRight = faAngleDoubleRight;

  sections: NavSection[] = [
    {
      titleKey: 'NAV.OVERVIEW',
      items: [
        { labelKey: 'SIDEBAR.DASHBOARD', route: '/dashboard', icon: faTachometerAlt, permission: 'DASHBOARD' },
      ],
    },
    {
      titleKey: 'NAV.CUSTOMERS_CONTACTS',
      items: [
        { labelKey: 'SIDEBAR.COMPANIES', route: '/firmen', icon: faBuilding, permission: 'FIRMEN' },
        { labelKey: 'SIDEBAR.PERSONS', route: '/personen', icon: faUsers, permission: 'PERSONEN' },
        { labelKey: 'SIDEBAR.DEPARTMENTS', route: '/abteilungen', icon: faSitemap, permission: 'ABTEILUNGEN' },
        { labelKey: 'SIDEBAR.ADDRESSES', route: '/adressen', icon: faMapMarkerAlt, permission: 'ADRESSEN' },
      ],
    },
    {
      titleKey: 'NAV.SALES',
      items: [
        { labelKey: 'SIDEBAR.OPPORTUNITIES', route: '/chancen', icon: faChartLine, permission: 'CHANCEN' },
        { labelKey: 'SIDEBAR.ACTIVITIES', route: '/aktivitaeten', icon: faCalendarCheck, permission: 'AKTIVITAETEN' },
        { labelKey: 'SIDEBAR.CONTRACTS', route: '/vertraege', icon: faFileContract, permission: 'VERTRAEGE' },
      ],
    },
    {
      titleKey: 'NAV.REPORTS',
      items: [
        { labelKey: 'SIDEBAR.PIPELINE', route: '/auswertungen/pipeline', icon: faChartPie, permission: 'AUSWERTUNGEN' },
      ],
    },
    {
      titleKey: 'NAV.HR',
      items: [
        { labelKey: 'SIDEBAR.SALARIES', route: '/gehaelter', icon: faMoneyBillWave, permission: 'GEHAELTER' },
      ],
    },
    {
      titleKey: 'NAV.ADMIN',
      items: [
        { labelKey: 'SIDEBAR.USERS', route: '/benutzer', icon: faUsersCog, permission: 'BENUTZERVERWALTUNG' },
      ],
    },
  ];

  filteredSections = computed(() =>
    this.sections
      .map((section) => ({
        ...section,
        visibleItems: section.items.filter(
          (item) => !item.permission || this.authService.hasPermission(item.permission),
        ),
      }))
      .filter((section) => section.visibleItems.length > 0),
  );
}
