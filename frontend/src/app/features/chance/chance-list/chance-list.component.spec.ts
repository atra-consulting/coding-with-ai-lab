import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ChanceListComponent } from './chance-list.component';
import { ChanceService } from '../../../core/services/chance.service';
import { Chance } from '../../../core/models/chance.model';

describe('ChanceListComponent', () => {
  let fixture: ComponentFixture<ChanceListComponent>;
  let component: ChanceListComponent;
  let mockChanceService: jasmine.SpyObj<ChanceService>;
  let httpMock: HttpTestingController;

  const makeChance = (overrides: Partial<Chance> = {}): Chance => ({
    id: 1,
    titel: 'Test Chance',
    beschreibung: 'Beschreibung',
    wert: 1000,
    currency: 'EUR',
    phase: 'NEU',
    wahrscheinlichkeit: 50,
    erwartetesDatum: '2025-12-31',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    firmaId: 1,
    firmaName: 'Test GmbH',
    kontaktPersonId: null,
    kontaktPersonName: null,
    ...overrides,
  });

  beforeEach(async () => {
    mockChanceService = jasmine.createSpyObj('ChanceService', ['listAll']);
    mockChanceService.listAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ChanceListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ChanceService, useValue: mockChanceService },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(ChanceListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('component creation', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should call listAll on init', () => {
      fixture.detectChanges();
      expect(mockChanceService.listAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('totalWert initial state', () => {
    it('should default totalWert to 0 before data loads', () => {
      expect(component.totalWert).toBe(0);
    });

    it('should default totalRows to 0 before data loads', () => {
      expect(component.totalRows).toBe(0);
    });
  });

  describe('totalWert computation', () => {
    it('should compute totalWert as the sum of wert from all loaded records', fakeAsync(() => {
      const chances = [
        makeChance({ id: 1, wert: 1000 }),
        makeChance({ id: 2, wert: 2500 }),
      ];
      mockChanceService.listAll.and.returnValue(of(chances));
      fixture.detectChanges();
      tick();
      expect(component.totalWert).toBe(3500);
    }));

    it('should set totalWert to 0 when no records are returned', fakeAsync(() => {
      mockChanceService.listAll.and.returnValue(of([]));
      fixture.detectChanges();
      tick();
      expect(component.totalWert).toBe(0);
    }));

    it('should set totalWert to the single record wert when only one record is returned', fakeAsync(() => {
      mockChanceService.listAll.and.returnValue(of([makeChance({ wert: 750 })]));
      fixture.detectChanges();
      tick();
      expect(component.totalWert).toBe(750);
    }));

    it('should set totalRows to the count of loaded records', fakeAsync(() => {
      const chances = [makeChance({ id: 1 }), makeChance({ id: 2 }), makeChance({ id: 3 })];
      mockChanceService.listAll.and.returnValue(of(chances));
      fixture.detectChanges();
      tick();
      expect(component.totalRows).toBe(3);
    }));
  });

  describe('totalWert with null/undefined wert', () => {
    it('should treat null wert as 0 when computing totalWert', fakeAsync(() => {
      const chances = [
        makeChance({ id: 1, wert: 2000 }),
        { ...makeChance({ id: 2 }), wert: null as unknown as number },
      ];
      mockChanceService.listAll.and.returnValue(of(chances));
      fixture.detectChanges();
      tick();
      expect(component.totalWert).toBe(2000);
    }));

    it('should treat undefined wert as 0 when computing totalWert', fakeAsync(() => {
      const chances = [
        makeChance({ id: 1, wert: 1500 }),
        { ...makeChance({ id: 2 }), wert: undefined as unknown as number },
      ];
      mockChanceService.listAll.and.returnValue(of(chances));
      fixture.detectChanges();
      tick();
      expect(component.totalWert).toBe(1500);
    }));

    it('should return 0 when all records have null wert', fakeAsync(() => {
      const chances = [
        { ...makeChance({ id: 1 }), wert: null as unknown as number },
        { ...makeChance({ id: 2 }), wert: null as unknown as number },
      ];
      mockChanceService.listAll.and.returnValue(of(chances));
      fixture.detectChanges();
      tick();
      expect(component.totalWert).toBe(0);
    }));
  });

  describe('loading state', () => {
    it('should start with loading set to true before ngOnInit runs', () => {
      expect(component.loading).toBeTrue();
    });

    it('should set loading to false after service responds with data', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.loading).toBeFalse();
    }));

    it('should set loading to false even when the service returns an error', fakeAsync(() => {
      mockChanceService.listAll.and.returnValue(throwError(() => new Error('network error')));
      fixture.detectChanges();
      tick();
      expect(component.loading).toBeFalse();
    }));
  });

  describe('template — Gesamtwert display', () => {
    it('should render "Gesamtwert:" text when records are loaded', fakeAsync(() => {
      mockChanceService.listAll.and.returnValue(of([makeChance({ wert: 1000 })]));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Gesamtwert:');
    }));

    it('should not render "Gesamtwert:" text when no records exist (totalRows === 0)', fakeAsync(() => {
      mockChanceService.listAll.and.returnValue(of([]));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).not.toContain('Gesamtwert:');
    }));
  });
});
