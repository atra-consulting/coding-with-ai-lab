import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChancePhase } from '../../../core/models/chance.model';
import { Firma } from '../../../core/models/firma.model';
import { Person } from '../../../core/models/person.model';
import { ChanceService } from '../../../core/services/chance.service';
import { FirmaService } from '../../../core/services/firma.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PersonService } from '../../../core/services/person.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-chance-form',
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent, TranslateModule],
  templateUrl: './chance-form.component.html',
})
export class ChanceFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private chanceService = inject(ChanceService);
  private firmaService = inject(FirmaService);
  private personService = inject(PersonService);
  private notification = inject(NotificationService);
  private translate = inject(TranslateService);

  form!: FormGroup;
  isEdit = false;
  chanceId: number | null = null;
  loading = false;

  firmen: Firma[] = [];
  personen: Person[] = [];

  phasen: ChancePhase[] = ['NEU', 'QUALIFIZIERT', 'ANGEBOT', 'VERHANDLUNG', 'GEWONNEN', 'VERLOREN'];

  ngOnInit(): void {
    this.form = this.fb.group({
      titel: ['', Validators.required],
      beschreibung: [''],
      wert: [null],
      currency: ['EUR'],
      phase: ['NEU', Validators.required],
      wahrscheinlichkeit: [null, [Validators.min(0), Validators.max(100)]],
      erwartetesDatum: [''],
      firmaId: [null, Validators.required],
      kontaktPersonId: [null],
    });

    this.firmaService.getAll(0, 1000, 'name,asc').subscribe({
      next: (data) => (this.firmen = data.content),
    });

    this.personService.getAll(0, 1000, 'lastName,asc').subscribe({
      next: (data) => (this.personen = data.content),
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.chanceId = Number(id);
      this.loading = true;
      this.chanceService.getById(this.chanceId).subscribe({
        next: (chance) => {
          this.form.patchValue(chance);
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

    if (this.isEdit && this.chanceId) {
      this.chanceService.update(this.chanceId, data).subscribe({
        next: () => {
          this.notification.success(this.translate.instant('CHANCE.UPDATED'));
          this.router.navigate(['/chancen', this.chanceId]);
        },
        error: () => {},
      });
    } else {
      this.chanceService.create(data).subscribe({
        next: (created) => {
          this.notification.success(this.translate.instant('CHANCE.CREATED'));
          this.router.navigate(['/chancen', created.id]);
        },
        error: () => {},
      });
    }
  }
}
