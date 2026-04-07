import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProduktKategorie } from '../../../core/models/produkt.model';
import { NotificationService } from '../../../core/services/notification.service';
import { ProduktService } from '../../../core/services/produkt.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-produkt-form',
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './produkt-form.component.html',
})
export class ProduktFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private produktService = inject(ProduktService);
  private notification = inject(NotificationService);

  form!: FormGroup;
  isEdit = false;
  produktId: number | null = null;
  loading = false;
  kategorieOptions: ProduktKategorie[] = [
    'SOFTWARE',
    'HARDWARE',
    'DIENSTLEISTUNG',
    'LIZENZ',
    'WARTUNG',
    'SONSTIGES',
  ];

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      beschreibung: [''],
      produktNummer: [''],
      preis: [null],
      currency: ['EUR'],
      einheit: [''],
      kategorie: ['', Validators.required],
      aktiv: [true],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.produktId = Number(id);
      this.loading = true;
      this.produktService.getById(this.produktId).subscribe({
        next: (produkt) => {
          this.form.patchValue(produkt);
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

    if (this.isEdit && this.produktId) {
      this.produktService.update(this.produktId, data).subscribe({
        next: () => {
          this.notification.success('Produkt erfolgreich aktualisiert');
          this.router.navigate(['/produkte', this.produktId]);
        },
        error: () => {},
      });
    } else {
      this.produktService.create(data).subscribe({
        next: (created) => {
          this.notification.success('Produkt erfolgreich erstellt');
          this.router.navigate(['/produkte', created.id]);
        },
        error: () => {},
      });
    }
  }
}
