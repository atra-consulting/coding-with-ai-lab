import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('should allow access when user is authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => {
      return authGuard(
        {} as any,
        { url: '/dashboard' } as any,
      );
    });

    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login when user is not authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => {
      return authGuard(
        {} as any,
        { url: '/firmen' } as any,
      );
    });

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/firmen' },
    });
  });

  it('should sanitize return URL that starts with double slash', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => {
      return authGuard(
        {} as any,
        { url: '//evil.com' } as any,
      );
    });

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/' },
    });
  });
});
