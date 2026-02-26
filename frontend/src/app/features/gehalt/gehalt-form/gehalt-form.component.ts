import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GehaltTyp } from '../../../core/models/gehalt.model';
import { Person } from '../../../core/models/person.model';
import { GehaltService } from '../../../core/services/gehalt.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PersonService } from '../../../core/services/person.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-gehalt-form',
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './gehalt-form.component.html',
  styleUrl: './gehalt-form.component.scss',
})
export class GehaltFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private gehaltService = inject(GehaltService);
  private personService = inject(PersonService);
  private notification = inject(NotificationService);

  form!: FormGroup;
  isEdit = false;
  gehaltId: number | null = null;
  loading = false;
  personen: Person[] = [];

  gehaltTypen: { value: GehaltTyp; label: string }[] = [
    { value: 'GRUNDGEHALT', label: 'Grundgehalt' },
    { value: 'BONUS', label: 'Bonus' },
    { value: 'PROVISION', label: 'Provision' },
    { value: 'SONDERZAHLUNG', label: 'Sonderzahlung' },
  ];

  ngOnInit(): void {
    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0)]],
      currency: ['EUR'],
      effectiveDate: ['', Validators.required],
      typ: ['', Validators.required],
      personId: [null, Validators.required],
    });

    this.loadPersonen();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.gehaltId = Number(id);
      this.loading = true;
      this.gehaltService.getById(this.gehaltId).subscribe({
        next: (gehalt) => {
          this.form.patchValue(gehalt);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  loadPersonen(): void {
    this.personService.getAll(0, 1000, 'lastName,asc').subscribe({
      next: (page) => {
        this.personen = page.content;
      },
      error: () => {},
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const data = this.form.value;

    if (this.isEdit && this.gehaltId) {
      this.gehaltService.update(this.gehaltId, data).subscribe({
        next: () => {
          this.notification.success('Gehalt erfolgreich aktualisiert');
          this.router.navigate(['/gehaelter']);
        },
        error: () => {},
      });
    } else {
      this.gehaltService.create(data).subscribe({
        next: () => {
          this.notification.success('Gehalt erfolgreich erstellt');
          this.router.navigate(['/gehaelter']);
        },
        error: () => {},
      });
    }
  }
}
