import { Component } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faPhone,
  faEnvelope,
  faUsers,
  faNoteSticky,
  faListCheck,
  faQuestion,
} from '@fortawesome/free-solid-svg-icons';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

const TYP_MAP: Record<string, { icon: IconDefinition; label: string }> = {
  ANRUF: { icon: faPhone, label: 'Anruf' },
  EMAIL: { icon: faEnvelope, label: 'E-Mail' },
  MEETING: { icon: faUsers, label: 'Meeting' },
  NOTIZ: { icon: faNoteSticky, label: 'Notiz' },
  AUFGABE: { icon: faListCheck, label: 'Aufgabe' },
};

@Component({
  imports: [FaIconComponent],
  template: `<fa-icon [icon]="icon" class="me-1"></fa-icon>{{ label }}`,
})
export class TypIconCellRendererComponent implements ICellRendererAngularComp {
  icon: IconDefinition = faQuestion;
  label = '';

  agInit(params: ICellRendererParams): void {
    this.update(params.value as string);
  }

  refresh(params: ICellRendererParams): boolean {
    this.update(params.value as string);
    return true;
  }

  private update(value: string): void {
    const entry = value ? TYP_MAP[value] : undefined;
    this.icon = entry?.icon ?? faQuestion;
    this.label = entry?.label ?? (value ?? '');
  }
}
