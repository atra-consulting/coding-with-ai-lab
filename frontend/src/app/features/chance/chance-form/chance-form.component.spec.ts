import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ChanceFormComponent } from './chance-form.component';
import { ChanceService } from '../../../core/services/chance.service';
import { FirmaService } from '../../../core/services/firma.service';
import { PersonService } from '../../../core/services/person.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Page } from '../../../core/models/page.model';
import { Firma } from '../../../core/models/firma.model';
import { Person } from '../../../core/models/person.model';

function emptyPage<T>(): Page<T> {
  return { content: [], totalElements: 0, totalPages: 0, size: 1000, number: 0, first: true, last: true };
}

function makeRoute(id: string | null): Partial<ActivatedRoute> {
  return {
    snapshot: {
      paramMap: convertToParamMap(id ? { id } : {}),
    } as ActivatedRoute['snapshot'],
  };
}

describe('ChanceFormComponent', () => {
  let fixture: ComponentFixture<ChanceFormComponent>;
  let component: ChanceFormComponent;
  let mockChanceService: jasmine.SpyObj<ChanceService>;
  let mockFirmaService: jasmine.SpyObj<FirmaService>;
  let mockPersonService: jasmine.SpyObj<PersonService>;
  let mockNotification: jasmine.SpyObj<NotificationService>;
  let httpMock: HttpTestingController;

  function configureTestBed(routeId: string | null): void {
    mockChanceService = jasmine.createSpyObj<ChanceService>('ChanceService', [
      'listAll',
      'getById',
      'create',
      'update',
      'delete',
    ]);
    mockFirmaService = jasmine.createSpyObj<FirmaService>('FirmaService', ['getAll']);
    mockPersonService = jasmine.createSpyObj<PersonService>('PersonService', ['getAll']);
    mockNotification = jasmine.createSpyObj<NotificationService>('NotificationService', [
      'success',
      'error',
      'info',
      'warning',
    ]);

    mockFirmaService.getAll.and.returnValue(of(emptyPage<Firma>()));
    mockPersonService.getAll.and.returnValue(of(emptyPage<Person>()));

    TestBed.configureTestingModule({
      imports: [ChanceFormComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ChanceService, useValue: mockChanceService },
        { provide: FirmaService, useValue: mockFirmaService },
        { provide: PersonService, useValue: mockPersonService },
        { provide: NotificationService, useValue: mockNotification },
        { provide: ActivatedRoute, useValue: makeRoute(routeId) },
      ],
    }).compileComponents();

    // Services are fully mocked via spy — httpMock.verify() guards against accidental real requests
    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(ChanceFormComponent);
    component = fixture.componentInstance;
  }

  afterEach(() => {
    httpMock.verify();
  });

  describe('create mode (no route id)', () => {
    beforeEach(() => {
      configureTestBed(null);
      fixture.detectChanges();
    });

    it('creates the component', () => {
      expect(component).toBeTruthy();
    });

    it('has a notiz form control', () => {
      expect(component.form.contains('notiz')).toBeTrue();
    });

    it('initializes the notiz control to an empty string', () => {
      expect(component.form.get('notiz')?.value).toBe('');
    });

    it('does not require the notiz control — form stays valid with notiz empty and other required fields set', () => {
      component.form.patchValue({ titel: 'Test-Chance', phase: 'NEU', firmaId: 1, notiz: '' });
      expect(component.form.get('notiz')?.valid).toBeTrue();
      expect(component.form.valid).toBeTrue();
    });

    it('accepts a non-empty notiz value', () => {
      component.form.get('notiz')?.setValue('Wichtige Anmerkung');
      expect(component.form.get('notiz')?.value).toBe('Wichtige Anmerkung');
      expect(component.form.get('notiz')?.valid).toBeTrue();
    });
  });

  describe('edit mode (route id present)', () => {
    beforeEach(() => {
      configureTestBed('42');
    });

    it('patches the notiz control from the loaded chance', () => {
      mockChanceService.getById.and.returnValue(
        of({
          id: 42,
          titel: 'Bestandschance',
          beschreibung: 'Beschreibung',
          notiz: 'Kunde ruft zurück',
          wert: 1000,
          currency: 'EUR',
          phase: 'ANGEBOT',
          wahrscheinlichkeit: 50,
          erwartetesDatum: '2025-12-31',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          firmaId: 1,
          firmaName: 'Test GmbH',
          kontaktPersonId: null,
          kontaktPersonName: null,
        }),
      );

      fixture.detectChanges();

      expect(component.form.get('notiz')?.value).toBe('Kunde ruft zurück');
    });
  });
});
