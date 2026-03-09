import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, FaIconComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  faEye = faEye;
  faEyeSlash = faEyeSlash;

  form: FormGroup = this.fb.group({
    benutzername: ['', Validators.required],
    passwort: ['', Validators.required],
  });

  errorMessage = '';
  showPassword = false;
  loading = false;
  demoEnabled = false;

  ngOnInit(): void {
    this.http.get<{ enabled: boolean }>('/api/auth/demo-mode').subscribe({
      next: (res) => (this.demoEnabled = res.enabled),
      error: () => (this.demoEnabled = false),
    });
  }

  fillDemo(): void {
    this.form.patchValue({ benutzername: 'demo', passwort: 'demo1234' });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.form.value).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        const safeUrl = returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/dashboard';
        this.router.navigateByUrl(safeUrl);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Anmeldung fehlgeschlagen';
      },
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
