import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
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
  faUsersCog,
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: IconDefinition;
  permission?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, FaIconComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private authService = inject(AuthService);

  sections: NavSection[] = [
    {
      title: 'Übersicht',
      items: [
        { label: 'Dashboard', route: '/dashboard', icon: faTachometerAlt, permission: 'DASHBOARD' },
      ],
    },
    {
      title: 'Kunden & Kontakte',
      items: [
        { label: 'Firmen', route: '/firmen', icon: faBuilding, permission: 'FIRMEN' },
        { label: 'Personen', route: '/personen', icon: faUsers, permission: 'PERSONEN' },
        { label: 'Abteilungen', route: '/abteilungen', icon: faSitemap, permission: 'ABTEILUNGEN' },
        { label: 'Adressen', route: '/adressen', icon: faMapMarkerAlt, permission: 'ADRESSEN' },
      ],
    },
    {
      title: 'Vertrieb',
      items: [
        { label: 'Chancen', route: '/chancen', icon: faChartLine, permission: 'CHANCEN' },
        { label: 'Aktivitäten', route: '/aktivitaeten', icon: faCalendarCheck, permission: 'AKTIVITAETEN' },
        { label: 'Verträge', route: '/vertraege', icon: faFileContract, permission: 'VERTRAEGE' },
      ],
    },
    {
      title: 'Personal',
      items: [
        { label: 'Gehälter', route: '/gehaelter', icon: faMoneyBillWave, permission: 'GEHAELTER' },
      ],
    },
    {
      title: 'Administration',
      items: [
        { label: 'Benutzer', route: '/benutzer', icon: faUsersCog, permission: 'BENUTZERVERWALTUNG' },
      ],
    },
  ];

  visibleItems(items: NavItem[]): NavItem[] {
    return items.filter((item) => !item.permission || this.authService.hasPermission(item.permission));
  }

  hasVisibleItems(section: NavSection): boolean {
    return this.visibleItems(section.items).length > 0;
  }
}
