import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { BoardSummary, Chance, ChancePhase } from '../../../core/models/chance.model';
import { Page } from '../../../core/models/page.model';
import { ChanceService } from '../../../core/services/chance.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EurCurrencyPipe } from '../../../shared/pipes/currency.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

interface PhaseConfig {
  phase: ChancePhase;
  label: string;
  colorClass: string;
}

const PHASES: PhaseConfig[] = [
  { phase: 'NEU', label: 'Neu', colorClass: 'primary' },
  { phase: 'QUALIFIZIERT', label: 'Qualifiziert', colorClass: 'info' },
  { phase: 'ANGEBOT', label: 'Angebot', colorClass: 'warning' },
  { phase: 'VERHANDLUNG', label: 'Verhandlung', colorClass: 'secondary' },
  { phase: 'GEWONNEN', label: 'Gewonnen', colorClass: 'success' },
  { phase: 'VERLOREN', label: 'Verloren', colorClass: 'danger' },
];

@Component({
  selector: 'app-chance-board',
  imports: [RouterLink, CdkDrag, CdkDropList, EurCurrencyPipe, LoadingSpinnerComponent],
  templateUrl: './chance-board.component.html',
  styleUrl: './chance-board.component.scss',
})
export class ChanceBoardComponent implements OnInit {
  private chanceService = inject(ChanceService);
  private notification = inject(NotificationService);

  phases = PHASES;
  columns = new Map<ChancePhase, Chance[]>();
  columnPages = new Map<ChancePhase, Page<Chance>>();
  summary = new Map<ChancePhase, BoardSummary>();
  loading = true;
  dropListIds: string[] = PHASES.map((p) => 'drop-' + p.phase);

  ngOnInit(): void {
    this.loadSummary();
    for (const p of PHASES) {
      this.columns.set(p.phase, []);
      this.loadColumn(p.phase);
    }
  }

  loadSummary(): void {
    this.chanceService.getBoardSummary().subscribe({
      next: (summaries) => {
        this.summary.clear();
        for (const s of summaries) {
          this.summary.set(s.phase, s);
        }
      },
    });
  }

  loadColumn(phase: ChancePhase, page = 0): void {
    this.chanceService.getByPhase(phase, page, 20, 'wert,desc').subscribe({
      next: (data) => {
        if (page === 0) {
          this.columns.set(phase, data.content);
        } else {
          const existing = this.columns.get(phase) || [];
          this.columns.set(phase, [...existing, ...data.content]);
        }
        this.columnPages.set(phase, data);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadMore(phase: ChancePhase): void {
    const currentPage = this.columnPages.get(phase);
    if (currentPage && !currentPage.last) {
      this.loadColumn(phase, currentPage.number + 1);
    }
  }

  hasMore(phase: ChancePhase): boolean {
    const page = this.columnPages.get(phase);
    return !!page && !page.last;
  }

  getColumnItems(phase: ChancePhase): Chance[] {
    return this.columns.get(phase) || [];
  }

  getSummary(phase: ChancePhase): BoardSummary | undefined {
    return this.summary.get(phase);
  }

  onDrop(event: CdkDragDrop<Chance[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const chance = event.previousContainer.data[event.previousIndex];
    const targetPhase = this.getPhaseFromDropListId(event.container.id);
    if (!targetPhase) return;

    // Optimistic update
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );
    const previousPhase = chance.phase;
    chance.phase = targetPhase;

    this.chanceService.updatePhase(chance.id, targetPhase).subscribe({
      next: () => {
        this.loadSummary();
      },
      error: () => {
        // Rollback — error toast is shown by the interceptor
        chance.phase = previousPhase;
        transferArrayItem(
          event.container.data,
          event.previousContainer.data,
          event.currentIndex,
          event.previousIndex,
        );
      },
    });
  }

  private getPhaseFromDropListId(id: string): ChancePhase | null {
    const phase = id.replace('drop-', '') as ChancePhase;
    return PHASES.some((p) => p.phase === phase) ? phase : null;
  }

  getPhaseBadgeClass(phase: ChancePhase): string {
    const map: Record<ChancePhase, string> = {
      NEU: 'bg-primary',
      QUALIFIZIERT: 'bg-info',
      ANGEBOT: 'bg-warning text-dark',
      VERHANDLUNG: 'bg-secondary',
      GEWONNEN: 'bg-success',
      VERLOREN: 'bg-danger',
    };
    return map[phase] || 'bg-secondary';
  }
}
