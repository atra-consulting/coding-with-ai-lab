import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BenutzerService } from '../../../core/services/benutzer.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-benutzer-form',
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent, TranslateModule],
  templateUrl: './benutzer-form.component.html',
})
export class BenutzerFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private benutzerService = inject(BenutzerService);
  private notification = inject(NotificationService);
  private translate = inject(TranslateService);

  form!: FormGroup;
  isEdit = false;
  benutzerId: number | null = null;
  loading = false;

  availableRollen = ['ADMIN', 'VERTRIEB', 'PERSONAL'];

  ngOnInit(): void {
    this.form = this.fb.group({
      benutzername: ['', Validators.required],
      passwort: ['', [Validators.required, Validators.minLength(8)]],
      vorname: ['', Validators.required],
      nachname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      rollen: [[] as string[]],
      aktiv: [true],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.benutzerId = Number(id);
      this.loading = true;

      // In edit mode, password is optional
      this.form.get('passwort')?.clearValidators();
      this.form.get('passwort')?.setValidators(Validators.minLength(8));
      this.form.get('passwort')?.updateValueAndValidity();

      this.benutzerService.getById(this.benutzerId).subscribe({
        next: (benutzer) => {
          this.form.patchValue({
            benutzername: benutzer.benutzername,
            vorname: benutzer.vorname,
            nachname: benutzer.nachname,
            email: benutzer.email,
            rollen: benutzer.rollen,
            aktiv: benutzer.aktiv,
          });
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  onRolleChange(rolle: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const currentRollen: string[] = this.form.get('rollen')?.value || [];
    if (checked) {
      this.form.patchValue({ rollen: [...currentRollen, rolle] });
    } else {
      this.form.patchValue({ rollen: currentRollen.filter((r) => r !== rolle) });
    }
  }

  hasRolle(rolle: string): boolean {
    const rollen: string[] = this.form.get('rollen')?.value || [];
    return rollen.includes(rolle);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const rollen: string[] = this.form.get('rollen')?.value || [];
    if (rollen.length === 0) {
      this.notification.error(this.translate.instant('VALIDATION.MIN_ONE_ROLE'));
      return;
    }

    const data = { ...this.form.value };

    // Don't send empty password on update
    if (this.isEdit && (!data.passwort || data.passwort.trim() === '')) {
      delete data.passwort;
    }

    if (this.isEdit && this.benutzerId) {
      this.benutzerService.update(this.benutzerId, data).subscribe({
        next: () => {
          this.notification.success(this.translate.instant('BENUTZER.UPDATED'));
          this.router.navigate(['/benutzer', this.benutzerId]);
        },
        error: () => {},
      });
    } else {
      this.benutzerService.create(data).subscribe({
        next: (created) => {
          this.notification.success(this.translate.instant('BENUTZER.CREATED'));
          this.router.navigate(['/benutzer', created.id]);
        },
        error: () => {},
      });
    }
  }
}
