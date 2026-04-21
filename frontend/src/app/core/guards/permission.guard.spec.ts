import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { BenutzerInfo } from '../models/auth.model';
import { permissionGuard } from './permission.guard';

describe('permissionGuard', () => {
  const userWithMapView: BenutzerInfo = {
    id: 1,
    benutzername: 'admin',
    vorname: 'Admin',
    nachname: 'User',
    email: 'admin@test.de',
    rollen: ['ROLE_ADMIN'],
    permissions: ['MAP_VIEW', 'FIRMEN'],
  };

  const userWithoutMapView: BenutzerInfo = {
    id: 2,
    benutzername: 'user',
    vorname: 'Regular',
    nachname: 'User',
    email: 'user@test.de',
    rollen: ['ROLE_USER'],
    permissions: ['FIRMEN'],
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

  function runGuard(...requiredPermissions: string[]): boolean | Promise<boolean> {
    const guardFn = permissionGuard(...requiredPermissions);
    return TestBed.runInInjectionContext(() =>
      guardFn(null as any, null as any),
    ) as boolean | Promise<boolean>;
  }

  it('returns true when the user has the required permission', () => {
    mockAuthService.currentUser.set(userWithMapView);
    expect(runGuard('MAP_VIEW')).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('returns false and navigates to /dashboard when the user lacks the permission', () => {
    mockAuthService.currentUser.set(userWithoutMapView);
    expect(runGuard('MAP_VIEW')).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('returns false and navigates to /dashboard when there is no current user', () => {
    mockAuthService.currentUser.set(null);
    expect(runGuard('MAP_VIEW')).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('returns true when the user has ANY of the required permissions', () => {
    mockAuthService.currentUser.set(userWithoutMapView);
    expect(runGuard('MAP_VIEW', 'FIRMEN')).toBeTrue();
  });
});
