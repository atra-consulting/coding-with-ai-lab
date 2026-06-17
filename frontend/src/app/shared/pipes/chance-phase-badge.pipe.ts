import { Pipe, PipeTransform } from '@angular/core';
import { ChancePhase } from '../../core/models/chance.model';

export const PHASE_BADGE_CLASSES: Record<ChancePhase, string> = {
  NEU: 'bg-primary',
  QUALIFIZIERT: 'bg-info',
  ANGEBOT: 'bg-warning text-dark',
  VERHANDLUNG: 'bg-secondary',
  GEWONNEN: 'bg-success',
  VERLOREN: 'bg-danger',
};

@Pipe({ name: 'chancePhaseBadge' })
export class ChancePhaseBadgePipe implements PipeTransform {
  transform(phase: ChancePhase | string): string {
    return PHASE_BADGE_CLASSES[phase as ChancePhase] ?? 'bg-secondary';
  }
}
