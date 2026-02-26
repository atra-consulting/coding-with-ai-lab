import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Firma } from '../../../core/models/firma.model';
import { AbteilungService } from '../../../core/services/abteilung.service';
import { FirmaService } from '../../../core/services/firma.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-abteilung-form',
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './abteilung-form.component.html',
})
export class AbteilungFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private abteilungService = inject(AbteilungService);
  private firmaService = inject(FirmaService);
  private notification = inject(NotificationService);

  form!: FormGroup;
  isEdit = false;
  abteilungId: number | null = null;
  loading = false;
  firmen: Firma[] = [];

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      firmaId: [null, Validators.required],
    });

    this.firmaService.getAll(0, 1000, 'name,asc').subscribe((page) => (this.firmen = page.content));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.abteilungId = Number(id);
      this.loading = true;
      this.abteilungService.getById(this.abteilungId).subscribe({
        next: (abt) => {
          this.form.patchValue(abt);
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
    if (this.isEdit && this.abteilungId) {
      this.abteilungService.update(this.abteilungId, data).subscribe({
        next: () => {
          this.notification.success('Abteilung erfolgreich aktualisiert');
          this.router.navigate(['/abteilungen', this.abteilungId]);
        },
        error: () => {},
      });
    } else {
      this.abteilungService.create(data).subscribe({
        next: (created) => {
          this.notification.success('Abteilung erfolgreich erstellt');
          this.router.navigate(['/abteilungen', created.id]);
        },
        error: () => {},
      });
    }
  }
}
