import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { permissionGuard } from './permission.guard';

describe('permissionGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasPermission']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    notificationSpy = jasmine.createSpyObj('NotificationService', ['error']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: NotificationService, useValue: notificationSpy },
      ],
    });
  });

  it('should allow access when user has required permission', () => {
    authServiceSpy.hasPermission.and.returnValue(true);
    const guard = permissionGuard('FIRMEN_READ');

    const result = TestBed.runInInjectionContext(() => {
      return guard({} as any, {} as any);
    });

    expect(result).toBeTrue();
    expect(authServiceSpy.hasPermission).toHaveBeenCalledWith('FIRMEN_READ');
    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(notificationSpy.error).not.toHaveBeenCalled();
  });

  it('should deny access and show error when user lacks permission', () => {
    authServiceSpy.hasPermission.and.returnValue(false);
    const guard = permissionGuard('FIRMEN_WRITE');

    const result = TestBed.runInInjectionContext(() => {
      return guard({} as any, {} as any);
    });

    expect(result).toBeFalse();
    expect(authServiceSpy.hasPermission).toHaveBeenCalledWith('FIRMEN_WRITE');
    expect(notificationSpy.error).toHaveBeenCalledWith('Zugriff verweigert');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should work with different permission strings', () => {
    authServiceSpy.hasPermission.and.callFake((perm: string) => perm === 'PERSONEN_READ');

    const readGuard = permissionGuard('PERSONEN_READ');
    const writeGuard = permissionGuard('PERSONEN_WRITE');

    const readResult = TestBed.runInInjectionContext(() => {
      return readGuard({} as any, {} as any);
    });
    expect(readResult).toBeTrue();

    const writeResult = TestBed.runInInjectionContext(() => {
      return writeGuard({} as any, {} as any);
    });
    expect(writeResult).toBeFalse();
  });
});
