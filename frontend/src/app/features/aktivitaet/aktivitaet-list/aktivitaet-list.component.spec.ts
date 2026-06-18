import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
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

  it('should call listAll on init', () => {
    fixture.detectChanges();
    expect(mockAktivitaetService.listAll).toHaveBeenCalledTimes(1);
  });

  it('should have datum column with initialSort desc', () => {
    const datumCol = component.columnDefs.find((col) => col.field === 'datum');
    expect(datumCol?.initialSort).toBe('desc');
  });

  it('should start with loading set to true before ngOnInit runs', () => {
    expect(component.loading).toBeTrue();
  });

  it('should set loading to false after service responds', fakeAsync(() => {
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

  it('should show loading spinner while service is pending', fakeAsync(() => {
    const subject = new Subject<Aktivitaet[]>();
    mockAktivitaetService.listAll.and.returnValue(subject.asObservable());
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-loading-spinner')).not.toBeNull();
    subject.next([]);
    subject.complete();
    tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-loading-spinner')).toBeNull();
  }));

  it('should hide spinner and show grid after data loads', fakeAsync(() => {
    mockAktivitaetService.listAll.and.returnValue(of(sampleAktivitaeten));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('app-loading-spinner');
    expect(spinner).toBeNull();
    const grid = fixture.nativeElement.querySelector('ag-grid-angular');
    expect(grid).not.toBeNull();
  }));

  it('should set loading to false even when service returns an error', fakeAsync(() => {
    mockAktivitaetService.listAll.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    tick();
    expect(component.loading).toBeFalse();
  }));
});
