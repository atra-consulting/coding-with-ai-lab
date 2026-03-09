import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Chance, ChancePhase } from '../../../core/models/chance.model';
import { ChanceService } from '../../../core/services/chance.service';
import { LanguageService } from '../../../core/services/language.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EurCurrencyPipe } from '../../../shared/pipes/currency.pipe';

@Component({
  selector: 'app-chance-detail',
  imports: [RouterLink, LoadingSpinnerComponent, DatePipe, EurCurrencyPipe, TranslateModule],
  templateUrl: './chance-detail.component.html',
})
export class ChanceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chanceService = inject(ChanceService);
  private modalService = inject(NgbModal);
  private notification = inject(NotificationService);
  public langService = inject(LanguageService);

  chance: Chance | null = null;
  loading = true;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.chanceService.getById(id).subscribe({
      next: (data) => {
        this.chance = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
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

  onDelete(): void {
    if (!this.chance) return;
    const modalRef = this.modalService.open(ConfirmDialogComponent);
    modalRef.componentInstance.title = 'Chance löschen';
    modalRef.componentInstance.message = `Möchten Sie die Chance "${this.chance.titel}" wirklich löschen?`;
    modalRef.result.then(
      () => {
        this.chanceService.delete(this.chance!.id).subscribe({
          next: () => {
            this.notification.success('Chance erfolgreich gelöscht');
            this.router.navigate(['/chancen']);
          },
          error: () => {},
        });
      },
      () => {},
    );
  }
}
