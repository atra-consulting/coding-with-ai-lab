import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBuilding,
  faCalendarCheck,
  faChartLine,
  faMapMarkerAlt,
  faSitemap,
  faTachometerAlt,
  faUsers,
  faAngleDoubleLeft,
  faAngleDoubleRight,
} from '@fortawesome/free-solid-svg-icons';
import { LayoutService } from '../../core/services/layout.service';

interface NavItem {
  label: string;
  route: string;
  icon: IconDefinition;
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
  layoutService = inject(LayoutService);

  faAngleDoubleLeft = faAngleDoubleLeft;
  faAngleDoubleRight = faAngleDoubleRight;

  sections: NavSection[] = [
    {
      title: 'Übersicht',
      items: [
        { label: 'Dashboard', route: '/dashboard', icon: faTachometerAlt },
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
      title: '',
      items: [
        { label: 'Chancen', route: '/chancen', icon: faChartLine },
        { label: 'Aktivitäten', route: '/aktivitaeten', icon: faCalendarCheck },
      ],
    },
  ];
}
