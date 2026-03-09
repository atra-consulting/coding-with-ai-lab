import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AktivitaetTyp } from '../../../core/models/aktivitaet.model';
import { Firma } from '../../../core/models/firma.model';
import { Person } from '../../../core/models/person.model';
import { AktivitaetService } from '../../../core/services/aktivitaet.service';
import { FirmaService } from '../../../core/services/firma.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PersonService } from '../../../core/services/person.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-aktivitaet-form',
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent, TranslateModule],
  templateUrl: './aktivitaet-form.component.html',
})
export class AktivitaetFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private aktivitaetService = inject(AktivitaetService);
  private firmaService = inject(FirmaService);
  private personService = inject(PersonService);
  private notification = inject(NotificationService);
  private translate = inject(TranslateService);

  form!: FormGroup;
  isEdit = false;
  aktivitaetId: number | null = null;
  loading = false;
  firmen: Firma[] = [];
  personen: Person[] = [];
  typOptions: AktivitaetTyp[] = ['ANRUF', 'EMAIL', 'MEETING', 'NOTIZ', 'AUFGABE'];

  ngOnInit(): void {
    this.form = this.fb.group({
      typ: ['', Validators.required],
      subject: ['', Validators.required],
      description: [''],
      datum: ['', Validators.required],
      firmaId: [null],
      personId: [null],
    });

    this.firmaService.getAll(0, 1000, 'name,asc').subscribe((page) => (this.firmen = page.content));
    this.personService
      .getAll(0, 1000, 'lastName,asc')
      .subscribe((page) => (this.personen = page.content));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.aktivitaetId = Number(id);
      this.loading = true;
      this.aktivitaetService.getById(this.aktivitaetId).subscribe({
        next: (aktivitaet) => {
          this.form.patchValue({
            ...aktivitaet,
            datum: aktivitaet.datum ? aktivitaet.datum.substring(0, 16) : '',
          });
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const data = this.form.value;

    if (this.isEdit && this.aktivitaetId) {
      this.aktivitaetService.update(this.aktivitaetId, data).subscribe({
        next: () => {
          this.notification.success(this.translate.instant('AKTIVITAET.UPDATED'));
          this.router.navigate(['/aktivitaeten']);
        },
        error: () => {},
      });
    } else {
      this.aktivitaetService.create(data).subscribe({
        next: () => {
          this.notification.success(this.translate.instant('AKTIVITAET.CREATED'));
          this.router.navigate(['/aktivitaeten']);
        },
        error: () => {},
      });
    }
  }
}
