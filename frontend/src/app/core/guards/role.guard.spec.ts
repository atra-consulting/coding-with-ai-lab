import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { BenutzerInfo } from '../models/auth.model';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  const adminUser: BenutzerInfo = {
    id: 1,
    benutzername: 'admin',
    vorname: 'Admin',
    nachname: 'User',
    email: 'admin@test.de',
    rollen: ['ADMIN', 'USER'],
    permissions: [],
  };

  const regularUser: BenutzerInfo = {
    id: 2,
    benutzername: 'user',
    vorname: 'Regular',
    nachname: 'User',
    email: 'user@test.de',
    rollen: ['USER'],
    permissions: [],
  };

  let mockAuthService: { currentUser: ReturnType<typeof signal<BenutzerInfo | null>> };
  let router: Router;

  beforeEach(() => {
    const userSignal = signal<BenutzerInfo | null>(null);

    mockAuthService = {
      currentUser: userSignal,
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  function runGuard(requiredRole: string): boolean | Promise<boolean> {
    const guardFn = roleGuard(requiredRole);
    return TestBed.runInInjectionContext(() =>
      guardFn(null as any, null as any),
    ) as boolean | Promise<boolean>;
  }

  it('returns true when currentUser has the required role', () => {
    mockAuthService.currentUser.set(adminUser);
    const result = runGuard('ADMIN');
    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('returns false and navigates to /dashboard when user lacks the required role', () => {
    mockAuthService.currentUser.set(regularUser);
    const result = runGuard('ADMIN');
    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('returns false and navigates to /dashboard when currentUser is null', () => {
    mockAuthService.currentUser.set(null);
    const result = runGuard('ADMIN');
    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
