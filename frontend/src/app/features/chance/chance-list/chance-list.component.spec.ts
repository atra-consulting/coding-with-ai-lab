import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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

    // ChanceService is fully mocked via spy — httpMock.verify() guards against accidental real requests
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
    it('should compute totalWert as the sum of wert from all loaded records', () => {
      const chances = [
        makeChance({ id: 1, wert: 1000 }),
        makeChance({ id: 2, wert: 2500 }),
      ];
      mockChanceService.listAll.and.returnValue(of(chances));
      fixture.detectChanges();
      expect(component.totalWert).toBe(3500);
    });

    it('should set totalWert to 0 when no records are returned', () => {
      fixture.detectChanges();
      expect(component.totalWert).toBe(0);
    });

    it('should set totalWert to the single record wert when only one record is returned', () => {
      mockChanceService.listAll.and.returnValue(of([makeChance({ wert: 750 })]));
      fixture.detectChanges();
      expect(component.totalWert).toBe(750);
    });

    it('should set totalRows to the count of loaded records', () => {
      const chances = [makeChance({ id: 1 }), makeChance({ id: 2 }), makeChance({ id: 3 })];
      mockChanceService.listAll.and.returnValue(of(chances));
      fixture.detectChanges();
      expect(component.totalRows).toBe(3);
    });
  });

  describe('totalWert with null/undefined wert', () => {
    it('should treat null wert as 0 when computing totalWert', () => {
      const chances = [
        makeChance({ id: 1, wert: 2000 }),
        { ...makeChance({ id: 2 }), wert: null as unknown as number },
      ];
      mockChanceService.listAll.and.returnValue(of(chances));
      fixture.detectChanges();
      expect(component.totalWert).toBe(2000);
    });

    it('should treat undefined wert as 0 when computing totalWert', () => {
      const chances = [
        makeChance({ id: 1, wert: 1500 }),
        { ...makeChance({ id: 2 }), wert: undefined as unknown as number },
      ];
      mockChanceService.listAll.and.returnValue(of(chances));
      fixture.detectChanges();
      expect(component.totalWert).toBe(1500);
    });

    it('should return 0 when all records have null wert', () => {
      const chances = [
        { ...makeChance({ id: 1 }), wert: null as unknown as number },
        { ...makeChance({ id: 2 }), wert: null as unknown as number },
      ];
      mockChanceService.listAll.and.returnValue(of(chances));
      fixture.detectChanges();
      expect(component.totalWert).toBe(0);
    });
  });

  describe('loading state', () => {
    it('should start with loading set to true before ngOnInit runs', () => {
      expect(component.loading).toBeTrue();
    });

    it('should set loading to false after service responds with data', () => {
      fixture.detectChanges();
      expect(component.loading).toBeFalse();
    });

    it('should set loading to false even when the service returns an error', () => {
      mockChanceService.listAll.and.returnValue(throwError(() => new Error('network error')));
      fixture.detectChanges();
      expect(component.loading).toBeFalse();
    });
  });

  describe('template — Gesamtwert display', () => {
    it('should render the formatted total in a small.text-muted element when records are loaded', () => {
      mockChanceService.listAll.and.returnValue(of([makeChance({ wert: 1000 })]));
      fixture.detectChanges();
      fixture.detectChanges();

      const el = fixture.debugElement.query(By.css('small.text-muted'));
      expect(el).not.toBeNull();
      expect(el.nativeElement.textContent).toContain('Gesamtwert:');
      expect(el.nativeElement.textContent).toContain('1.000,00');
    });

    it('should not render the Gesamtwert element when no records exist', () => {
      fixture.detectChanges();
      fixture.detectChanges();

      const el = fixture.debugElement.query(By.css('small.text-muted'));
      expect(el).toBeNull();
    });
  });

  describe('displayedWert initial state', () => {
    it('should remain 0 after data loads when no grid filter is active', () => {
      mockChanceService.listAll.and.returnValue(of([makeChance({ wert: 3000 })]));
      fixture.detectChanges();
      // updateCounts() only runs when gridApi fires modelUpdated; without a real grid,
      // displayedWert stays at its reset value of 0.
      expect(component.displayedWert).toBe(0);
    });
  });

  // These tests drive component properties directly and assert template output only.
  // AG Grid's modelUpdated-triggered updateCounts() path is not exercised here.
  describe('template — Gesamtwert filter display', () => {
    it('should show only total wert and the formatted amount when filter is not active', () => {
      mockChanceService.listAll.and.returnValue(of([makeChance({ wert: 1000 })]));
      fixture.detectChanges();
      fixture.detectChanges();

      const el = fixture.debugElement.query(By.css('small.text-muted'));
      expect(el).not.toBeNull();
      expect(el.nativeElement.textContent).toContain('1.000,00');
      expect(el.nativeElement.textContent).not.toContain('/');
    });

    it('should show displayedWert / totalWert separated by / when filter is active', () => {
      mockChanceService.listAll.and.returnValue(of([makeChance({ wert: 5000 })]));
      fixture.detectChanges();
      component.isFilterActive = true;
      component.displayedWert = 2000;
      fixture.detectChanges();

      const el = fixture.debugElement.query(By.css('small.text-muted'));
      expect(el).not.toBeNull();
      expect(el.nativeElement.textContent).toContain('/');
      expect(el.nativeElement.textContent).toContain('2.000,00');
      expect(el.nativeElement.textContent).toContain('5.000,00');
    });
  });
});
