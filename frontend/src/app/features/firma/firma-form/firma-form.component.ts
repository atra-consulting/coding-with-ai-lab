import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FirmaService } from '../../../core/services/firma.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-firma-form',
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './firma-form.component.html',
})
export class FirmaFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private firmaService = inject(FirmaService);
  private notification = inject(NotificationService);

  form!: FormGroup;
  isEdit = false;
  firmaId: number | null = null;
  loading = false;

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      industry: [''],
      website: [''],
      phone: [''],
      email: ['', Validators.email],
      notes: [''],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.firmaId = Number(id);
      this.loading = true;
      this.firmaService.getById(this.firmaId).subscribe({
        next: (firma) => {
          this.form.patchValue(firma);
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

    if (this.isEdit && this.firmaId) {
      this.firmaService.update(this.firmaId, data).subscribe({
        next: () => {
          this.notification.success('Firma erfolgreich aktualisiert');
          this.router.navigate(['/firmen', this.firmaId]);
        },
        error: () => {},
      });
    } else {
      this.firmaService.create(data).subscribe({
        next: (created) => {
          this.notification.success('Firma erfolgreich erstellt');
          this.router.navigate(['/firmen', created.id]);
        },
        error: () => {},
      });
    }
  }
}
