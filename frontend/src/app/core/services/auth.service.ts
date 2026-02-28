import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';
import { BenutzerInfo, LoginRequest, LoginResponse, RefreshResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private accessToken: string | null = null;
  private currentUserSignal = signal<BenutzerInfo | null>(null);

  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => this.currentUserSignal() !== null);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>('/api/auth/login', request, { withCredentials: true })
      .pipe(
        tap((response) => {
          this.accessToken = response.accessToken;
        }),
        switchMap((response) =>
          this.fetchCurrentUser().pipe(
            switchMap(() => of(response)),
          ),
        ),
      );
  }

  logout(): void {
    this.http.post('/api/auth/logout', {}, { withCredentials: true }).subscribe({
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

  refresh(): Observable<RefreshResponse | null> {
    return this.http
      .post<RefreshResponse>('/api/auth/refresh', {}, { withCredentials: true })
      .pipe(
        tap((response) => {
          this.accessToken = response.accessToken;
        }),
        catchError(() => {
          this.clearAuth();
          return of(null);
        }),
      );
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUserSignal();
    return user?.permissions?.includes(permission) ?? false;
  }

  initializeAuth(): Observable<RefreshResponse | null> {
    return this.refresh().pipe(
      switchMap((response) => {
        if (response) {
          return this.fetchCurrentUser().pipe(switchMap(() => of(response)));
        }
        return of(null);
      }),
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
    this.accessToken = null;
    this.currentUserSignal.set(null);
  }
}
