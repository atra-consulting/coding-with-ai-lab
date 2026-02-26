import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Firma } from '../../../core/models/firma.model';
import { Person } from '../../../core/models/person.model';
import { AdresseService } from '../../../core/services/adresse.service';
import { FirmaService } from '../../../core/services/firma.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PersonService } from '../../../core/services/person.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-adresse-form',
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './adresse-form.component.html',
  styleUrl: './adresse-form.component.scss',
})
export class AdresseFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private adresseService = inject(AdresseService);
  private firmaService = inject(FirmaService);
  private personService = inject(PersonService);
  private notification = inject(NotificationService);

  form!: FormGroup;
  isEdit = false;
  adresseId: number | null = null;
  loading = false;
  assignmentType: 'firma' | 'person' = 'firma';
  firmen: Firma[] = [];
  personen: Person[] = [];

  ngOnInit(): void {
    this.form = this.fb.group({
      street: ['', Validators.required],
      houseNumber: [''],
      postalCode: ['', Validators.required],
      city: ['', Validators.required],
      country: ['Deutschland'],
      firmaId: [null as number | null],
      personId: [null as number | null],
    });

    this.loadFirmen();
    this.loadPersonen();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.adresseId = Number(id);
      this.loading = true;
      this.adresseService.getById(this.adresseId).subscribe({
        next: (adresse) => {
          this.form.patchValue(adresse);
          if (adresse.personId) {
            this.assignmentType = 'person';
          } else {
            this.assignmentType = 'firma';
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  loadFirmen(): void {
    this.firmaService.getAll(0, 1000, 'name,asc').subscribe({
      next: (page) => {
        this.firmen = page.content;
      },
      error: () => {},
    });
  }

  loadPersonen(): void {
    this.personService.getAll(0, 1000, 'lastName,asc').subscribe({
      next: (page) => {
        this.personen = page.content;
      },
      error: () => {},
    });
  }

  onAssignmentChange(type: 'firma' | 'person'): void {
    this.assignmentType = type;
    if (type === 'firma') {
      this.form.patchValue({ personId: null });
    } else {
      this.form.patchValue({ firmaId: null });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const data = this.form.value;

    if (this.assignmentType === 'firma') {
      data.personId = null;
    } else {
      data.firmaId = null;
    }

    if (this.isEdit && this.adresseId) {
      this.adresseService.update(this.adresseId, data).subscribe({
        next: () => {
          this.notification.success('Adresse erfolgreich aktualisiert');
          this.router.navigate(['/adressen']);
        },
        error: () => {},
      });
    } else {
      this.adresseService.create(data).subscribe({
        next: () => {
          this.notification.success('Adresse erfolgreich erstellt');
          this.router.navigate(['/adressen']);
        },
        error: () => {},
      });
    }
  }
}
