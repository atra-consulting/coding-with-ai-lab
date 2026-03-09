import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Person } from '../../../core/models/person.model';
import { LanguageService } from '../../../core/services/language.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PersonService } from '../../../core/services/person.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-person-detail',
  imports: [RouterLink, LoadingSpinnerComponent, DatePipe, TranslateModule],
  templateUrl: './person-detail.component.html',
})
export class PersonDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private personService = inject(PersonService);
  private modalService = inject(NgbModal);
  private notification = inject(NotificationService);
  public langService = inject(LanguageService);

  person: Person | null = null;
  loading = true;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.personService.getById(id).subscribe({
      next: (data) => {
        this.person = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onDelete(): void {
    if (!this.person) return;
    const modalRef = this.modalService.open(ConfirmDialogComponent);
    modalRef.componentInstance.title = 'Person löschen';
    modalRef.componentInstance.message = `Möchten Sie "${this.person.firstName} ${this.person.lastName}" wirklich löschen?`;
    modalRef.result.then(
      () => {
        this.personService.delete(this.person!.id).subscribe({
          next: () => {
            this.notification.success('Person erfolgreich gelöscht');
            this.router.navigate(['/personen']);
          },
          error: () => {},
        });
      },
      () => {},
    );
  }
}
