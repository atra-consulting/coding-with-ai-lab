import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PersonListComponent } from './person-list.component';
import { PersonService } from '../../../core/services/person.service';
import { AbteilungService } from '../../../core/services/abteilung.service';
import { Abteilung } from '../../../core/models/abteilung.model';
import { Page } from '../../../core/models/page.model';
import { Person } from '../../../core/models/person.model';

describe('PersonListComponent', () => {
  let fixture: ComponentFixture<PersonListComponent>;
  let component: PersonListComponent;
  let mockPersonService: jasmine.SpyObj<PersonService>;
  let mockAbteilungService: jasmine.SpyObj<AbteilungService>;
  let httpMock: HttpTestingController;

  const mockPage: Page<Person> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 9999,
    number: 0,
    first: true,
    last: true,
  };

  const mockAbteilungen: Abteilung[] = [
    { id: 1, name: 'Engineering', description: '', firmaId: 1, firmaName: 'Acme GmbH', personenCount: 5 },
    { id: 5, name: 'Sales', description: '', firmaId: 1, firmaName: 'Acme GmbH', personenCount: 3 },
  ];

  beforeEach(async () => {
    mockPersonService = jasmine.createSpyObj('PersonService', ['getAll']);
    mockPersonService.getAll.and.returnValue(of(mockPage));

    mockAbteilungService = jasmine.createSpyObj('AbteilungService', ['listAll']);
    mockAbteilungService.listAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [PersonListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PersonService, useValue: mockPersonService },
        { provide: AbteilungService, useValue: mockAbteilungService },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(PersonListComponent);
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
  });

  describe('ngOnInit', () => {
    it('should call abteilungService.listAll() on init', () => {
      fixture.detectChanges();
      expect(mockAbteilungService.listAll).toHaveBeenCalledTimes(1);
    });

    it('should populate abteilungen from the listAll response', fakeAsync(() => {
      mockAbteilungService.listAll.and.returnValue(of(mockAbteilungen));
      fixture.detectChanges();
      tick();
      expect(component.abteilungen).toEqual(mockAbteilungen);
    }));

    it('should call personService.getAll() on init', () => {
      fixture.detectChanges();
      expect(mockPersonService.getAll).toHaveBeenCalledTimes(1);
    });

    it('should call personService.getAll() with page 0 and size 9999 on init', () => {
      fixture.detectChanges();
      expect(mockPersonService.getAll).toHaveBeenCalledWith(0, 9999, 'lastName,asc', '', undefined);
    });

    it('should call personService.getAll() with undefined (not null) as abteilungId when selectedAbteilungId is null', () => {
      component.selectedAbteilungId = null;
      fixture.detectChanges();
      const callArgs = mockPersonService.getAll.calls.mostRecent().args;
      expect(callArgs[4]).toBeUndefined();
    });
  });

  describe('initial state', () => {
    it('should default selectedAbteilungId to null', () => {
      expect(component.selectedAbteilungId).toBeNull();
    });

    it('should default abteilungen to an empty array', () => {
      expect(component.abteilungen).toEqual([]);
    });

    it('should start with loading set to true before ngOnInit runs', () => {
      expect(component.loading).toBeTrue();
    });

    it('should set loading to false after personService responds', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.loading).toBeFalse();
    }));
  });

  describe('onDepartmentChange()', () => {
    it('should call personService.getAll() again when department changes', () => {
      fixture.detectChanges();
      mockPersonService.getAll.calls.reset();

      component.onDepartmentChange();

      expect(mockPersonService.getAll).toHaveBeenCalledTimes(1);
    });

    it('should pass selectedAbteilungId as the 5th argument when a department is selected', () => {
      fixture.detectChanges();
      mockPersonService.getAll.calls.reset();

      component.selectedAbteilungId = 5;
      component.onDepartmentChange();

      expect(mockPersonService.getAll).toHaveBeenCalledWith(0, 9999, 'lastName,asc', '', 5);
    });

    it('should pass undefined (not null) as the 5th argument when selectedAbteilungId is null', () => {
      fixture.detectChanges();
      mockPersonService.getAll.calls.reset();

      component.selectedAbteilungId = null;
      component.onDepartmentChange();

      const callArgs = mockPersonService.getAll.calls.mostRecent().args;
      expect(callArgs[4]).toBeUndefined();
    });

    it('should pass abteilungId=1 when selectedAbteilungId is 1', () => {
      fixture.detectChanges();
      mockPersonService.getAll.calls.reset();

      component.selectedAbteilungId = 1;
      component.onDepartmentChange();

      expect(mockPersonService.getAll).toHaveBeenCalledWith(0, 9999, 'lastName,asc', '', 1);
    });
  });
});
