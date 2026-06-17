import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ChancePhaseBadgePipe } from '../../../shared/pipes/chance-phase-badge.pipe';
import { ChancePhase } from '../../../core/models/chance.model';

@Component({
  imports: [ChancePhaseBadgePipe],
  template: `<span class="badge" [class]="phase | chancePhaseBadge">{{ phase }}</span>`,
})
export class PhaseBadgeCellRendererComponent implements ICellRendererAngularComp {
  phase: ChancePhase | string = '';

  agInit(params: ICellRendererParams): void {
    this.phase = params.value as ChancePhase;
  }

  refresh(params: ICellRendererParams): boolean {
    this.phase = params.value as ChancePhase;
    return true;
  }
}
