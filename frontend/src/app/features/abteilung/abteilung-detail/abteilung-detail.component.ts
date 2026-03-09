import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Abteilung } from '../../../core/models/abteilung.model';
import { AbteilungService } from '../../../core/services/abteilung.service';
import { LanguageService } from '../../../core/services/language.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-abteilung-detail',
  imports: [RouterLink, LoadingSpinnerComponent, TranslateModule],
  templateUrl: './abteilung-detail.component.html',
})
export class AbteilungDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private abteilungService = inject(AbteilungService);
  private modalService = inject(NgbModal);
  private notification = inject(NotificationService);
  public langService = inject(LanguageService);

  abteilung: Abteilung | null = null;
  loading = true;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.abteilungService.getById(id).subscribe({
      next: (data) => {
        this.abteilung = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onDelete(): void {
    if (!this.abteilung) return;
    const modalRef = this.modalService.open(ConfirmDialogComponent);
    modalRef.componentInstance.title = 'Abteilung löschen';
    modalRef.componentInstance.message = `Möchten Sie die Abteilung "${this.abteilung.name}" wirklich löschen?`;
    modalRef.result.then(
      () => {
        this.abteilungService.delete(this.abteilung!.id).subscribe({
          next: () => {
            this.notification.success('Abteilung erfolgreich gelöscht');
            this.router.navigate(['/abteilungen']);
          },
          error: () => {},
        });
      },
      () => {},
    );
  }
}
