import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PersonService } from './person.service';
import { Page } from '../models/page.model';
import { Person } from '../models/person.model';

describe('PersonService', () => {
  let service: PersonService;
  let httpMock: HttpTestingController;

  const mockPage: Page<Person> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    first: true,
    last: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(PersonService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll()', () => {
    it('fires GET to /api/personen with default params', () => {
      service.getAll().subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/personen' && r.method === 'GET',
      );
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('10');
      expect(req.request.params.get('sort')).toBe('lastName,asc');
      req.flush(mockPage);
    });

    it('does NOT include abteilungId param when abteilungId is not provided', () => {
      service.getAll(0, 10, 'lastName,asc', '').subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/personen' && r.method === 'GET',
      );
      expect(req.request.params.has('abteilungId')).toBeFalse();
      req.flush(mockPage);
    });

    it('does NOT include abteilungId param when called with only default args', () => {
      service.getAll().subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/personen' && r.method === 'GET',
      );
      expect(req.request.params.has('abteilungId')).toBeFalse();
      req.flush(mockPage);
    });

    it('includes abteilungId=5 in params when abteilungId is 5', () => {
      service.getAll(0, 10, 'lastName,asc', '', 5).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/personen' && r.method === 'GET',
      );
      expect(req.request.params.get('abteilungId')).toBe('5');
      req.flush(mockPage);
    });

    it('includes abteilungId=0 in params when abteilungId is 0 (not undefined)', () => {
      service.getAll(0, 10, 'lastName,asc', '', 0).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/personen' && r.method === 'GET',
      );
      expect(req.request.params.has('abteilungId')).toBeTrue();
      expect(req.request.params.get('abteilungId')).toBe('0');
      req.flush(mockPage);
    });

    it('passes search param to request', () => {
      service.getAll(0, 10, 'lastName,asc', 'Müller').subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/personen' && r.method === 'GET',
      );
      expect(req.request.params.get('search')).toBe('Müller');
      req.flush(mockPage);
    });

    it('emits the page response returned by the server', () => {
      let received: Page<Person> | undefined;
      service.getAll().subscribe((r) => (received = r));

      httpMock.expectOne((r) => r.url === '/api/personen').flush(mockPage);

      expect(received).toEqual(mockPage);
    });
  });
});
