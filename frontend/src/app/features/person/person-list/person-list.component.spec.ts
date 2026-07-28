import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PersonListComponent } from './person-list.component';
import { PersonService } from '../../../core/services/person.service';
import { AbteilungService } from '../../../core/services/abteilung.service';
import { Abteilung } from '../../../core/models/abteilung.model';
import { Person } from '../../../core/models/person.model';

describe('PersonListComponent', () => {
  let fixture: ComponentFixture<PersonListComponent>;
  let component: PersonListComponent;
  let mockPersonService: jasmine.SpyObj<PersonService>;
  let mockAbteilungService: jasmine.SpyObj<AbteilungService>;
  let httpMock: HttpTestingController;

  const mockPersons: Person[] = [];

  const mockAbteilungen: Abteilung[] = [
    { id: 1, name: 'Engineering', description: '', firmaId: 1, firmaName: 'Acme GmbH', personenCount: 5 },
    { id: 5, name: 'Sales', description: '', firmaId: 1, firmaName: 'Acme GmbH', personenCount: 3 },
  ];

  beforeEach(async () => {
    mockPersonService = jasmine.createSpyObj('PersonService', ['listAll']);
    mockPersonService.listAll.and.returnValue(of(mockPersons));

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

    it('should populate abteilungen from the listAll response', () => {
      mockAbteilungService.listAll.and.returnValue(of(mockAbteilungen));
      fixture.detectChanges();
      expect(component.abteilungen).toEqual(mockAbteilungen);
    });

    it('should call personService.listAll() on init', () => {
      fixture.detectChanges();
      expect(mockPersonService.listAll).toHaveBeenCalledTimes(1);
    });

    it('should call personService.listAll() with undefined when selectedAbteilungId is null', () => {
      fixture.detectChanges();
      expect(mockPersonService.listAll).toHaveBeenCalledWith(undefined);
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
    it('should call personService.listAll() again when department changes', () => {
      fixture.detectChanges();
      mockPersonService.listAll.calls.reset();

      component.onDepartmentChange();

      expect(mockPersonService.listAll).toHaveBeenCalledTimes(1);
    });

    it('should pass selectedAbteilungId when a department is selected', () => {
      fixture.detectChanges();
      mockPersonService.listAll.calls.reset();

      component.selectedAbteilungId = 5;
      component.onDepartmentChange();

      expect(mockPersonService.listAll).toHaveBeenCalledWith(5);
    });

    it('should pass undefined (not null) when selectedAbteilungId is null', () => {
      fixture.detectChanges();
      mockPersonService.listAll.calls.reset();

      component.selectedAbteilungId = null;
      component.onDepartmentChange();

      const callArgs = mockPersonService.listAll.calls.mostRecent().args;
      expect(callArgs[0]).toBeUndefined();
    });

    it('should pass abteilungId=1 when selectedAbteilungId is 1', () => {
      fixture.detectChanges();
      mockPersonService.listAll.calls.reset();

      component.selectedAbteilungId = 1;
      component.onDepartmentChange();

      expect(mockPersonService.listAll).toHaveBeenCalledWith(1);
    });

    it('should pass abteilungId=0 unchanged when selectedAbteilungId is 0', () => {
      fixture.detectChanges();
      mockPersonService.listAll.calls.reset();

      component.selectedAbteilungId = 0;
      component.onDepartmentChange();

      expect(mockPersonService.listAll).toHaveBeenCalledWith(0);
    });
  });
});
