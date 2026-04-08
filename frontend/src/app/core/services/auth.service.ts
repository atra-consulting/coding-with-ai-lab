import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';
import { BenutzerInfo, LoginRequest, LoginResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentUserSignal = signal<BenutzerInfo | null>(null);

  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => this.currentUserSignal() !== null);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>('/api/auth/login', request)
      .pipe(
        switchMap((response) =>
          this.fetchCurrentUser().pipe(
            switchMap(() => of(response)),
          ),
        ),
      );
  }

  logout(): void {
    this.http.post('/api/auth/logout', {}).subscribe({
      complete: () => {
        this.clearAuth();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.clearAuth();
        this.router.navigate(['/login']);
      },
    });
  }

  initializeAuth(): Observable<BenutzerInfo | null> {
    return this.fetchCurrentUser().pipe(
      catchError(() => of(null)),
    );
  }

  private fetchCurrentUser(): Observable<BenutzerInfo> {
    return this.http.get<BenutzerInfo>('/api/auth/me').pipe(
      tap((user) => this.currentUserSignal.set(user)),
      catchError((err) => {
        this.clearAuth();
        throw err;
      }),
    );
  }

  private clearAuth(): void {
    this.currentUserSignal.set(null);
  }
}
