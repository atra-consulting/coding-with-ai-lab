import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initially not be authenticated', () => {
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should initially have null current user', () => {
    expect(service.currentUser()).toBeNull();
  });

  it('should initially return null access token', () => {
    expect(service.getAccessToken()).toBeNull();
  });

  it('should return false for hasPermission when no user is set', () => {
    expect(service.hasPermission('FIRMEN_READ')).toBeFalse();
  });

  it('should store access token after login', () => {
    const loginResponse = {
      accessToken: 'test-token-123',
      benutzername: 'admin',
      vorname: 'Admin',
      nachname: 'User',
      rollen: ['ADMIN'],
    };

    const userInfo = {
      id: 1,
      benutzername: 'admin',
      vorname: 'Admin',
      nachname: 'User',
      email: 'admin@test.de',
      rollen: ['ADMIN'],
      permissions: ['FIRMEN_READ', 'FIRMEN_WRITE'],
    };

    service.login({ benutzername: 'admin', passwort: 'password' }).subscribe();

    const loginReq = httpMock.expectOne('/api/auth/login');
    expect(loginReq.request.method).toBe('POST');
    loginReq.flush(loginResponse);

    const meReq = httpMock.expectOne('/api/auth/me');
    expect(meReq.request.method).toBe('GET');
    meReq.flush(userInfo);

    expect(service.getAccessToken()).toBe('test-token-123');
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentUser()?.benutzername).toBe('admin');
  });

  it('should check permissions correctly after login', () => {
    const loginResponse = {
      accessToken: 'test-token',
      benutzername: 'admin',
      vorname: 'Admin',
      nachname: 'User',
      rollen: ['ADMIN'],
    };

    const userInfo = {
      id: 1,
      benutzername: 'admin',
      vorname: 'Admin',
      nachname: 'User',
      email: 'admin@test.de',
      rollen: ['ADMIN'],
      permissions: ['FIRMEN_READ', 'PERSONEN_WRITE'],
    };

    service.login({ benutzername: 'admin', passwort: 'password' }).subscribe();

    httpMock.expectOne('/api/auth/login').flush(loginResponse);
    httpMock.expectOne('/api/auth/me').flush(userInfo);

    expect(service.hasPermission('FIRMEN_READ')).toBeTrue();
    expect(service.hasPermission('PERSONEN_WRITE')).toBeTrue();
    expect(service.hasPermission('NONEXISTENT')).toBeFalse();
  });

  it('should clear auth state and navigate to login on logout', () => {
    // First login to set state
    const loginResponse = {
      accessToken: 'test-token',
      benutzername: 'admin',
      vorname: 'Admin',
      nachname: 'User',
      rollen: ['ADMIN'],
    };
    const userInfo = {
      id: 1,
      benutzername: 'admin',
      vorname: 'Admin',
      nachname: 'User',
      email: 'admin@test.de',
      rollen: ['ADMIN'],
      permissions: [],
    };

    service.login({ benutzername: 'admin', passwort: 'password' }).subscribe();
    httpMock.expectOne('/api/auth/login').flush(loginResponse);
    httpMock.expectOne('/api/auth/me').flush(userInfo);

    expect(service.isAuthenticated()).toBeTrue();

    // Now logout
    service.logout();
    const logoutReq = httpMock.expectOne('/api/auth/logout');
    expect(logoutReq.request.method).toBe('POST');
    logoutReq.flush({});

    expect(service.getAccessToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should update access token on refresh', () => {
    service.refresh().subscribe((response) => {
      expect(response).toBeTruthy();
      expect(response!.accessToken).toBe('new-token');
    });

    const req = httpMock.expectOne('/api/auth/refresh');
    expect(req.request.method).toBe('POST');
    req.flush({ accessToken: 'new-token' });

    expect(service.getAccessToken()).toBe('new-token');
  });

  it('should clear auth on refresh failure', () => {
    service.refresh().subscribe((response) => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne('/api/auth/refresh');
    req.error(new ProgressEvent('error'), { status: 401 });

    expect(service.getAccessToken()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });
});
