import { TestBed } from '@angular/core/testing';
import { ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminGeocodingComponent } from './admin-geocoding.component';
import { AdminService } from './admin.service';
import { GeocodeResult } from '../../core/models/geocode-result.model';

/** Build a fake NgbModalRef whose result is a deferred promise. */
function makeModalRef(
  modalSpy: jasmine.SpyObj<NgbModal>,
  settlement: 'resolve' | 'reject',
  value: unknown = true,
): { componentInstance: Record<string, unknown> } {
  let resolve!: (v: unknown) => void;
  let reject!: (r: unknown) => void;
  const result = new Promise<unknown>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  // Suppress unhandled-rejection noise from dismissed-modal branches.
  result.catch(() => undefined);

  const ref = {
    componentInstance: {} as Record<string, unknown>,
    result,
    _resolve: resolve,
    _reject: reject,
  };

  modalSpy.open.and.returnValue(ref as unknown as NgbModalRef);

  if (settlement === 'resolve') {
    resolve(value);
  } else {
    reject(value);
  }

  return ref;
}

describe('AdminGeocodingComponent', () => {
  let fixture: ComponentFixture<AdminGeocodingComponent>;
  let component: AdminGeocodingComponent;
  let mockAdminService: jasmine.SpyObj<AdminService>;
  let mockModal: jasmine.SpyObj<NgbModal>;

  const successResult: GeocodeResult = {
    total: 5,
    succeeded: 4,
    failed: 0,
    skippedInsufficientData: 1,
  };

  beforeEach(async () => {
    mockAdminService = jasmine.createSpyObj<AdminService>('AdminService', ['geocodeAddresses']);
    mockModal = jasmine.createSpyObj<NgbModal>('NgbModal', ['open']);

    await TestBed.configureTestingModule({
      imports: [AdminGeocodingComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AdminService, useValue: mockAdminService },
        { provide: NgbModal, useValue: mockModal },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminGeocodingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the "Koordinaten ermitteln" button initially', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button.btn-primary');
    expect(button).toBeTruthy();
    expect(button.textContent?.trim()).toBe('Koordinaten ermitteln');
  });

  it('button is enabled initially', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button.btn-primary');
    expect(button.disabled).toBeFalse();
  });

  it('clicking button opens modal and sets title, message, confirmText, confirmButtonClass', fakeAsync(() => {
    const ref = makeModalRef(mockModal, 'reject', 'dismissed');

    component.startGeocode();
    tick();

    expect(mockModal.open).toHaveBeenCalled();
    expect(ref.componentInstance['title']).toBe('Geokodierung starten');
    expect(typeof ref.componentInstance['message']).toBe('string');
    expect((ref.componentInstance['message'] as string).length).toBeGreaterThan(0);
    expect(ref.componentInstance['confirmText']).toBe('Fortfahren');
    expect(ref.componentInstance['confirmButtonClass']).toBe('btn btn-primary');
  }));

  it('confirmed modal calls adminService.geocodeAddresses()', fakeAsync(() => {
    makeModalRef(mockModal, 'resolve', true);
    mockAdminService.geocodeAddresses.and.returnValue(of(successResult));

    component.startGeocode();
    tick();

    expect(mockAdminService.geocodeAddresses).toHaveBeenCalledTimes(1);
  }));

  it('dismissed modal does NOT call service and does not enter running state', fakeAsync(() => {
    makeModalRef(mockModal, 'reject', 'dismissed');

    component.startGeocode();
    tick();

    expect(mockAdminService.geocodeAddresses).not.toHaveBeenCalled();
    expect(component.running).toBeFalse();
  }));

  it('on success response, alert-success renders with four counter labels', fakeAsync(() => {
    makeModalRef(mockModal, 'resolve', true);
    mockAdminService.geocodeAddresses.and.returnValue(of(successResult));

    component.startGeocode();
    tick();
    fixture.detectChanges();

    const alert: HTMLElement = fixture.nativeElement.querySelector('.alert-success');
    expect(alert).toBeTruthy();
    const text = alert.textContent ?? '';
    expect(text).toContain('Gesamt');
    expect(text).toContain('Erfolgreich');
    expect(text).toContain('Fehlgeschlagen');
    expect(text).toContain('Übersprungen');
  }));

  it('on result.total === 0, renders "Keine Adressen ohne Koordinaten gefunden"', fakeAsync(() => {
    const emptyResult: GeocodeResult = {
      total: 0,
      succeeded: 0,
      failed: 0,
      skippedInsufficientData: 0,
    };
    makeModalRef(mockModal, 'resolve', true);
    mockAdminService.geocodeAddresses.and.returnValue(of(emptyResult));

    component.startGeocode();
    tick();
    fixture.detectChanges();

    const alert: HTMLElement = fixture.nativeElement.querySelector('.alert-success');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Keine Adressen ohne Koordinaten gefunden');
  }));

  it('on HTTP 409 error with message body, alert-danger shows status 409 and server message', fakeAsync(() => {
    makeModalRef(mockModal, 'resolve', true);
    const errorResponse = new HttpErrorResponse({
      status: 409,
      error: { message: 'Conflict: already running' },
    });
    mockAdminService.geocodeAddresses.and.returnValue(throwError(() => errorResponse));

    component.startGeocode();
    tick();
    fixture.detectChanges();

    const alert: HTMLElement = fixture.nativeElement.querySelector('.alert-danger');
    expect(alert).toBeTruthy();
    const text = alert.textContent ?? '';
    expect(text).toContain('409');
    expect(text).toContain('Conflict: already running');
  }));

  it('on HTTP error without body, alert-danger renders German fallback message', fakeAsync(() => {
    makeModalRef(mockModal, 'resolve', true);
    const errorResponse = new HttpErrorResponse({
      status: 500,
      error: null,
    });
    mockAdminService.geocodeAddresses.and.returnValue(throwError(() => errorResponse));

    component.startGeocode();
    tick();
    fixture.detectChanges();

    const alert: HTMLElement = fixture.nativeElement.querySelector('.alert-danger');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Vorgang fehlgeschlagen');
  }));

  it('button is disabled while running === true', fakeAsync(() => {
    makeModalRef(mockModal, 'resolve', true);
    const subject = new Subject<GeocodeResult>();
    mockAdminService.geocodeAddresses.and.returnValue(subject.asObservable());

    component.startGeocode();
    tick();
    fixture.detectChanges();

    expect(component.running).toBeTrue();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button.btn-primary');
    expect(button.disabled).toBeTrue();

    // Complete subject to avoid dangling subscription
    subject.complete();
    tick();
  }));
});
