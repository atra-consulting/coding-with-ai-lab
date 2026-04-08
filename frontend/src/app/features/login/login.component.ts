import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface UserCard {
  benutzername: string;
  passwort: string;
  displayName: string;
  rollen: string;
  color: string;
}

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly users: UserCard[] = [
    { benutzername: 'admin', passwort: 'admin123', displayName: 'Admin User', rollen: 'ADMIN', color: '#dc3545' },
    { benutzername: 'user', passwort: 'test123', displayName: 'Test User', rollen: 'USER', color: '#0d6efd' },
    { benutzername: 'demo', passwort: 'demo1234', displayName: 'Demo User', rollen: 'ADMIN', color: '#fd7e14' },
  ];

  loadingUser = signal<string | null>(null);
  errorMessage = signal<string>('');

  loginAs(user: UserCard): void {
    if (this.loadingUser() !== null) return;

    this.loadingUser.set(user.benutzername);
    this.errorMessage.set('');

    this.authService.login({ benutzername: user.benutzername, passwort: user.passwort }).subscribe({
      next: () => {
        this.loadingUser.set(null);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        const safeUrl = returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/dashboard';
        this.router.navigateByUrl(safeUrl);
      },
      error: (err) => {
        this.loadingUser.set(null);
        this.errorMessage.set(err.error?.message || 'Anmeldung fehlgeschlagen');
      },
    });
  }
}
