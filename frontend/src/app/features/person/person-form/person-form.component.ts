import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Abteilung } from '../../../core/models/abteilung.model';
import { Firma } from '../../../core/models/firma.model';
import { AbteilungService } from '../../../core/services/abteilung.service';
import { FirmaService } from '../../../core/services/firma.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PersonService } from '../../../core/services/person.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-person-form',
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './person-form.component.html',
})
export class PersonFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private personService = inject(PersonService);
  private firmaService = inject(FirmaService);
  private abteilungService = inject(AbteilungService);
  private notification = inject(NotificationService);

  form!: FormGroup;
  isEdit = false;
  personId: number | null = null;
  loading = false;
  firmen: Firma[] = [];
  abteilungen: Abteilung[] = [];

  ngOnInit(): void {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', Validators.email],
      phone: [''],
      position: [''],
      notes: [''],
      firmaId: [null, Validators.required],
      abteilungId: [null],
    });

    this.firmaService.getAll(0, 1000, 'name,asc').subscribe((page) => (this.firmen = page.content));

    this.form.get('firmaId')!.valueChanges.subscribe((firmaId) => {
      if (firmaId) {
        this.abteilungService
          .getAllByFirmaId(firmaId)
          .subscribe((data) => (this.abteilungen = data));
      } else {
        this.abteilungen = [];
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.personId = Number(id);
      this.loading = true;
      this.personService.getById(this.personId).subscribe({
        next: (person) => {
          if (person.firmaId) {
            this.abteilungService.getAllByFirmaId(person.firmaId).subscribe((data) => {
              this.abteilungen = data;
              this.form.patchValue(person);
              this.loading = false;
            });
          } else {
            this.form.patchValue(person);
            this.loading = false;
          }
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
    if (this.isEdit && this.personId) {
      this.personService.update(this.personId, data).subscribe({
        next: () => {
          this.notification.success('Person erfolgreich aktualisiert');
          this.router.navigate(['/personen', this.personId]);
        },
        error: () => {},
      });
    } else {
      this.personService.create(data).subscribe({
        next: (created) => {
          this.notification.success('Person erfolgreich erstellt');
          this.router.navigate(['/personen', created.id]);
        },
        error: () => {},
      });
    }
  }
}
