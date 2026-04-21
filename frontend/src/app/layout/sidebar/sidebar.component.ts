import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBuilding,
  faCalendarCheck,
  faChartLine,
  faMapLocationDot,
  faMapMarkerAlt,
  faSitemap,
  faTachometerAlt,
  faUsers,
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faUserShield,
} from '@fortawesome/free-solid-svg-icons';
import { LayoutService } from '../../core/services/layout.service';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: IconDefinition;
  requiredRole?: string;
  requiredPermission?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, FaIconComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  layoutService = inject(LayoutService);
  private authService = inject(AuthService);

  faAngleDoubleLeft = faAngleDoubleLeft;
  faAngleDoubleRight = faAngleDoubleRight;

  sections: NavSection[] = [
    {
      title: 'Übersicht',
      items: [
        { label: 'Dashboard', route: '/dashboard', icon: faTachometerAlt },
        {
          label: 'Karte',
          route: '/karte',
          icon: faMapLocationDot,
          requiredPermission: 'MAP_VIEW',
        },
      ],
    },
    {
      title: 'Kunden & Kontakte',
      items: [
        { label: 'Firmen', route: '/firmen', icon: faBuilding },
        { label: 'Personen', route: '/personen', icon: faUsers },
        { label: 'Abteilungen', route: '/abteilungen', icon: faSitemap },
        { label: 'Adressen', route: '/adressen', icon: faMapMarkerAlt },
      ],
    },
    {
      items: [
        { label: 'Chancen', route: '/chancen', icon: faChartLine },
        { label: 'Aktivitäten', route: '/aktivitaeten', icon: faCalendarCheck },
      ],
    },
    {
      title: 'Administration',
      items: [
        {
          label: 'Adressen geokodieren',
          route: '/admin/geocoding',
          icon: faUserShield,
          requiredRole: 'ROLE_ADMIN',
        },
      ],
    },
  ];

  hasRole(role: string): boolean {
    return this.authService.currentUser()?.rollen.includes(role) ?? false;
  }

  hasPermission(permission: string): boolean {
    return this.authService.currentUser()?.permissions.includes(permission) ?? false;
  }

  visibleItems(items: NavItem[]): NavItem[] {
    return items.filter(
      (i) =>
        (!i.requiredRole || this.hasRole(i.requiredRole)) &&
        (!i.requiredPermission || this.hasPermission(i.requiredPermission))
    );
  }
}
