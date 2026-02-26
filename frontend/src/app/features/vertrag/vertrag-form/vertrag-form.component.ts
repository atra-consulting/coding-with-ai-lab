import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Firma } from '../../../core/models/firma.model';
import { Person } from '../../../core/models/person.model';
import { VertragStatus } from '../../../core/models/vertrag.model';
import { FirmaService } from '../../../core/services/firma.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PersonService } from '../../../core/services/person.service';
import { VertragService } from '../../../core/services/vertrag.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-vertrag-form',
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './vertrag-form.component.html',
})
export class VertragFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private vertragService = inject(VertragService);
  private firmaService = inject(FirmaService);
  private personService = inject(PersonService);
  private notification = inject(NotificationService);

  form!: FormGroup;
  isEdit = false;
  vertragId: number | null = null;
  loading = false;
  firmen: Firma[] = [];
  personen: Person[] = [];
  statusOptions: VertragStatus[] = ['ENTWURF', 'AKTIV', 'ABGELAUFEN', 'GEKUENDIGT'];

  ngOnInit(): void {
    this.form = this.fb.group({
      titel: ['', Validators.required],
      wert: [null],
      currency: ['EUR'],
      status: ['', Validators.required],
      startDate: [''],
      endDate: [''],
      notes: [''],
      firmaId: [null, Validators.required],
      kontaktPersonId: [null],
    });

    this.firmaService.getAll(0, 1000, 'name,asc').subscribe((page) => (this.firmen = page.content));
    this.personService
      .getAll(0, 1000, 'lastName,asc')
      .subscribe((page) => (this.personen = page.content));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.vertragId = Number(id);
      this.loading = true;
      this.vertragService.getById(this.vertragId).subscribe({
        next: (vertrag) => {
          this.form.patchValue(vertrag);
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

    if (this.isEdit && this.vertragId) {
      this.vertragService.update(this.vertragId, data).subscribe({
        next: () => {
          this.notification.success('Vertrag erfolgreich aktualisiert');
          this.router.navigate(['/vertraege', this.vertragId]);
        },
        error: () => {},
      });
    } else {
      this.vertragService.create(data).subscribe({
        next: (created) => {
          this.notification.success('Vertrag erfolgreich erstellt');
          this.router.navigate(['/vertraege', created.id]);
        },
        error: () => {},
      });
    }
  }
}
