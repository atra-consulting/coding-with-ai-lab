import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PersonService } from './person.service';

describe('PersonService', () => {
  let service: PersonService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PersonService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch paginated personen with default params', () => {
    const mockPage = {
      content: [{ id: 1, firstName: 'Max', lastName: 'Mustermann' }],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    service.getAll().subscribe((page) => {
      expect(page.content.length).toBe(1);
      expect(page.content[0].firstName).toBe('Max');
      expect(page.totalElements).toBe(1);
    });

    const req = httpMock.expectOne((r) => r.url === '/api/personen');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('sort')).toBe('lastName,asc');
    req.flush(mockPage);
  });

  it('should fetch paginated personen with custom params', () => {
    const mockPage = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 25,
      number: 2,
      first: false,
      last: true,
    };

    service.getAll(2, 25, 'firstName,desc', 'schmidt').subscribe((page) => {
      expect(page.size).toBe(25);
      expect(page.number).toBe(2);
    });

    const req = httpMock.expectOne((r) => r.url === '/api/personen');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('25');
    expect(req.request.params.get('sort')).toBe('firstName,desc');
    expect(req.request.params.get('search')).toBe('schmidt');
    req.flush(mockPage);
  });

  it('should list all personen', () => {
    const mockPersonen = [
      { id: 1, firstName: 'Max', lastName: 'Mustermann' },
      { id: 2, firstName: 'Erika', lastName: 'Muster' },
    ];

    service.listAll().subscribe((personen) => {
      expect(personen.length).toBe(2);
      expect(personen[1].firstName).toBe('Erika');
    });

    const req = httpMock.expectOne('/api/personen/all');
    expect(req.request.method).toBe('GET');
    req.flush(mockPersonen);
  });

  it('should get person by id', () => {
    const mockPerson = { id: 1, firstName: 'Max', lastName: 'Mustermann', email: 'max@test.de' };

    service.getById(1).subscribe((person) => {
      expect(person.firstName).toBe('Max');
      expect(person.email).toBe('max@test.de');
    });

    const req = httpMock.expectOne('/api/personen/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockPerson);
  });

  it('should create a person', () => {
    const newPerson = { firstName: 'Neue', lastName: 'Person', firmaId: 1 };
    const createdPerson = { id: 3, ...newPerson };

    service.create(newPerson).subscribe((person) => {
      expect(person.id).toBe(3);
      expect(person.firstName).toBe('Neue');
    });

    const req = httpMock.expectOne('/api/personen');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newPerson);
    req.flush(createdPerson);
  });

  it('should update a person', () => {
    const updateData = { firstName: 'Updated', lastName: 'Person', firmaId: 1 };
    const updatedPerson = { id: 1, ...updateData };

    service.update(1, updateData).subscribe((person) => {
      expect(person.firstName).toBe('Updated');
    });

    const req = httpMock.expectOne('/api/personen/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateData);
    req.flush(updatedPerson);
  });

  it('should delete a person', () => {
    service.delete(1).subscribe();

    const req = httpMock.expectOne('/api/personen/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
