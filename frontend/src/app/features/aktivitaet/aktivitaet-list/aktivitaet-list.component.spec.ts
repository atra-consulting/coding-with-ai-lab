import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AktivitaetListComponent } from './aktivitaet-list.component';
import { AktivitaetService } from '../../../core/services/aktivitaet.service';
import { Aktivitaet } from '../../../core/models/aktivitaet.model';

describe('AktivitaetListComponent', () => {
  let fixture: ComponentFixture<AktivitaetListComponent>;
  let component: AktivitaetListComponent;
  let mockAktivitaetService: jasmine.SpyObj<AktivitaetService>;
  let httpMock: HttpTestingController;

  const sampleAktivitaeten: Aktivitaet[] = [
    {
      id: 1,
      typ: 'ANRUF',
      subject: 'Test Anruf',
      description: 'Beschreibung',
      datum: '2024-01-15T10:00:00.000Z',
      createdAt: '2024-01-15T10:00:00.000Z',
      firmaId: 1,
      firmaName: 'Test GmbH',
      personId: null,
      personName: null,
    },
    {
      id: 2,
      typ: 'EMAIL',
      subject: 'Test E-Mail',
      description: 'E-Mail Beschreibung',
      datum: '2024-01-20T09:30:00.000Z',
      createdAt: '2024-01-20T09:30:00.000Z',
      firmaId: null,
      firmaName: null,
      personId: 5,
      personName: 'Max Mustermann',
    },
  ];

  beforeEach(async () => {
    mockAktivitaetService = jasmine.createSpyObj('AktivitaetService', ['listAll']);
    mockAktivitaetService.listAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AktivitaetListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AktivitaetService, useValue: mockAktivitaetService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(AktivitaetListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should have datum column with initialSort desc', () => {
    const datumCol = component.columnDefs.find((col) => col.field === 'datum');
    expect(datumCol?.initialSort).toBe('desc');
  });

  it('should start with loading set to true', () => {
    expect(component.loading).toBeTrue();
  });

  it('should set loading to false after ngOnInit resolves', fakeAsync(() => {
    mockAktivitaetService.listAll.and.returnValue(of([]));
    fixture.detectChanges();
    tick();
    expect(component.loading).toBeFalse();
  }));

  it('should populate rowData with data returned by the service', fakeAsync(() => {
    mockAktivitaetService.listAll.and.returnValue(of(sampleAktivitaeten));
    fixture.detectChanges();
    tick();
    expect(component.rowData).toEqual(sampleAktivitaeten);
  }));

  it('should show the loading spinner when loading is true', () => {
    // Do not call detectChanges so ngOnInit has not yet resolved
    expect(component.loading).toBeTrue();
    fixture.detectChanges();
    // After the first detectChanges the template renders; loading is still true
    // before the observable has emitted when using a synchronous spy, so we
    // check the DOM state after the first synchronous change detection cycle.
    // Since of([]) emits synchronously, loading is already false here — verify
    // the spinner appears when we explicitly set loading back to true.
    component.loading = true;
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('app-loading-spinner');
    expect(spinner).not.toBeNull();
  });

  it('should hide the loading spinner and show the grid after data loads', fakeAsync(() => {
    mockAktivitaetService.listAll.and.returnValue(of(sampleAktivitaeten));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('app-loading-spinner');
    expect(spinner).toBeNull();
  }));
});
