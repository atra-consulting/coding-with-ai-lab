import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faEnvelope,
  faHandshake,
  faPhone,
  faStickyNote,
  faTasks,
} from '@fortawesome/free-solid-svg-icons';
import { Aktivitaet } from '../../../../core/models/aktivitaet.model';

@Component({
  selector: 'app-recent-activities',
  imports: [DatePipe, FaIconComponent],
  templateUrl: './recent-activities.component.html',
})
export class RecentActivitiesComponent {
  @Input({ required: true }) activities!: Aktivitaet[];

  private iconMap: Record<string, IconDefinition> = {
    ANRUF: faPhone,
    EMAIL: faEnvelope,
    MEETING: faHandshake,
    NOTIZ: faStickyNote,
    AUFGABE: faTasks,
  };

  getIcon(typ: string): IconDefinition {
    return this.iconMap[typ] || faStickyNote;
  }
}
