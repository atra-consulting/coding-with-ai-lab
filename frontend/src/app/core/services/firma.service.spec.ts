import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FirmaService } from './firma.service';

describe('FirmaService', () => {
  let service: FirmaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(FirmaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch paginated firmen with default params', () => {
    const mockPage = {
      content: [{ id: 1, name: 'Test GmbH', industry: 'IT' }],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    service.getAll().subscribe((page) => {
      expect(page.content.length).toBe(1);
      expect(page.content[0].name).toBe('Test GmbH');
      expect(page.totalElements).toBe(1);
    });

    const req = httpMock.expectOne((r) => r.url === '/api/firmen');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('sort')).toBe('name,asc');
    expect(req.request.params.get('search')).toBe('');
    req.flush(mockPage);
  });

  it('should fetch paginated firmen with custom params', () => {
    const mockPage = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 1,
      first: false,
      last: true,
    };

    service.getAll(1, 20, 'industry,desc', 'tech').subscribe((page) => {
      expect(page.size).toBe(20);
      expect(page.number).toBe(1);
    });

    const req = httpMock.expectOne((r) => r.url === '/api/firmen');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.get('sort')).toBe('industry,desc');
    expect(req.request.params.get('search')).toBe('tech');
    req.flush(mockPage);
  });

  it('should list all firmen', () => {
    const mockFirmen = [
      { id: 1, name: 'Firma A' },
      { id: 2, name: 'Firma B' },
    ];

    service.listAll().subscribe((firmen) => {
      expect(firmen.length).toBe(2);
    });

    const req = httpMock.expectOne('/api/firmen/all');
    expect(req.request.method).toBe('GET');
    req.flush(mockFirmen);
  });

  it('should get firma by id', () => {
    const mockFirma = { id: 1, name: 'Test GmbH', industry: 'IT' };

    service.getById(1).subscribe((firma) => {
      expect(firma.name).toBe('Test GmbH');
    });

    const req = httpMock.expectOne('/api/firmen/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockFirma);
  });

  it('should create a firma', () => {
    const newFirma = { name: 'Neue Firma', industry: 'Consulting' };
    const createdFirma = { id: 3, ...newFirma };

    service.create(newFirma).subscribe((firma) => {
      expect(firma.id).toBe(3);
      expect(firma.name).toBe('Neue Firma');
    });

    const req = httpMock.expectOne('/api/firmen');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newFirma);
    req.flush(createdFirma);
  });

  it('should update a firma', () => {
    const updateData = { name: 'Updated Firma', industry: 'Finance' };
    const updatedFirma = { id: 1, ...updateData };

    service.update(1, updateData).subscribe((firma) => {
      expect(firma.name).toBe('Updated Firma');
    });

    const req = httpMock.expectOne('/api/firmen/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateData);
    req.flush(updatedFirma);
  });

  it('should delete a firma', () => {
    service.delete(1).subscribe();

    const req = httpMock.expectOne('/api/firmen/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should fetch personen for a firma', () => {
    const mockPage = {
      content: [{ id: 1, firstName: 'Max', lastName: 'Mustermann' }],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    service.getPersonen(1).subscribe((page) => {
      expect(page.content.length).toBe(1);
      expect(page.content[0].firstName).toBe('Max');
    });

    const req = httpMock.expectOne((r) => r.url === '/api/firmen/1/personen');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    req.flush(mockPage);
  });

  it('should fetch abteilungen for a firma', () => {
    const mockPage = {
      content: [{ id: 1, name: 'Vertrieb' }],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    service.getAbteilungen(1).subscribe((page) => {
      expect(page.content.length).toBe(1);
      expect(page.content[0].name).toBe('Vertrieb');
    });

    const req = httpMock.expectOne((r) => r.url === '/api/firmen/1/abteilungen');
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });
});
