import { Component } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

export interface StarCellRendererParams extends ICellRendererParams {
  onToggle: (id: number, currentValue: boolean) => void;
}

@Component({
  imports: [FaIconComponent],
  template: `
    <button type="button" class="btn btn-link p-0" (click)="onClick($event)"
      style="line-height: 1; color: #ffc107;" [style.opacity]="isFavorit ? '1' : '0.3'"
      aria-label="Als Favorit markieren">
      <fa-icon [icon]="faStar"></fa-icon>
    </button>
  `,
})
export class StarCellRendererComponent implements ICellRendererAngularComp {
  faStar = faStar;
  isFavorit = false;
  private firmaId = 0;
  private onToggle!: (id: number, currentValue: boolean) => void;

  agInit(params: StarCellRendererParams): void {
    this.isFavorit = params.value as boolean;
    this.firmaId = (params.data as { id: number }).id;
    this.onToggle = params.onToggle;
  }

  refresh(params: StarCellRendererParams): boolean {
    this.isFavorit = params.value as boolean;
    return true;
  }

  onClick(event: MouseEvent): void {
    event.stopPropagation();
    this.onToggle(this.firmaId, this.isFavorit);
  }
}
