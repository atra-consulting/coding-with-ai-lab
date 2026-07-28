import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SzenarioService } from './szenario.service';
import { Szenario, SzenarioCreate, SzenarioUpdate } from '../models/szenario.model';

describe('SzenarioService', () => {
  let service: SzenarioService;
  let httpMock: HttpTestingController;

  const mockProzess = {
    works: [0, 60, 30],
    waits: [240, 480],
  };

  const mockSzenario: Szenario = {
    id: 1,
    name: 'Standard-Szenario',
    humanSteps: mockProzess,
    agileKiSteps: { works: [0, 5, 5], waits: [240, 480] },
    semiAutomatedSteps: { works: [0, 5], waits: [240] },
    automatedSteps: { works: [0, 20], waits: [240] },
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
  };

  const mockCreate: SzenarioCreate = {
    name: 'Neues Szenario',
    humanSteps: mockProzess,
    agileKiSteps: { works: [0, 5, 5], waits: [240, 480] },
    semiAutomatedSteps: { works: [0, 5], waits: [240] },
    automatedSteps: { works: [0, 20], waits: [240] },
  };

  const mockUpdate: SzenarioUpdate = {
    name: 'Geändertes Szenario',
    humanSteps: mockProzess,
    agileKiSteps: { works: [0, 5, 5], waits: [240, 480] },
    semiAutomatedSteps: { works: [0, 5], waits: [240] },
    automatedSteps: { works: [0, 20], waits: [240] },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(SzenarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('list()', () => {
    it('fires GET to /api/szenarien', () => {
      service.list().subscribe();

      const req = httpMock.expectOne('/api/szenarien');
      expect(req.request.method).toBe('GET');
      req.flush([mockSzenario]);
    });

    it('emits the array returned by the server', () => {
      let received: Szenario[] | undefined;
      service.list().subscribe((r) => (received = r));

      httpMock.expectOne('/api/szenarien').flush([mockSzenario]);

      expect(received).toEqual([mockSzenario]);
    });

    it('propagates a 500 error to the subscriber error callback', () => {
      let caughtError: unknown;
      service.list().subscribe({
        next: () => fail('expected an error, not a value'),
        error: (err: unknown) => (caughtError = err),
      });

      httpMock.expectOne('/api/szenarien').flush(
        { message: 'Internal Server Error' },
        { status: 500, statusText: 'Server Error' },
      );

      expect(caughtError).toBeTruthy();
    });
  });

  describe('getById()', () => {
    it('fires GET to /api/szenarien/:id', () => {
      service.getById(1).subscribe();

      const req = httpMock.expectOne('/api/szenarien/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockSzenario);
    });

    it('uses the correct numeric id in the URL', () => {
      service.getById(42).subscribe();

      const req = httpMock.expectOne('/api/szenarien/42');
      expect(req.request.method).toBe('GET');
      req.flush(mockSzenario);
    });

    it('emits the scenario returned by the server', () => {
      let received: Szenario | undefined;
      service.getById(1).subscribe((r) => (received = r));

      httpMock.expectOne('/api/szenarien/1').flush(mockSzenario);

      expect(received).toEqual(mockSzenario);
    });
  });

  describe('create()', () => {
    it('fires POST to /api/szenarien', () => {
      service.create(mockCreate).subscribe();

      const req = httpMock.expectOne('/api/szenarien');
      expect(req.request.method).toBe('POST');
      req.flush({ ...mockSzenario, name: mockCreate.name });
    });

    it('sends the DTO as the request body', () => {
      service.create(mockCreate).subscribe();

      const req = httpMock.expectOne('/api/szenarien');
      expect(req.request.body).toEqual(mockCreate);
      req.flush({ ...mockSzenario, name: mockCreate.name });
    });

    it('emits the created scenario returned by the server', () => {
      const created: Szenario = { ...mockSzenario, id: 99, name: mockCreate.name };
      let received: Szenario | undefined;
      service.create(mockCreate).subscribe((r) => (received = r));

      httpMock.expectOne('/api/szenarien').flush(created);

      expect(received).toEqual(created);
    });
  });

  describe('update()', () => {
    it('fires PUT to /api/szenarien/:id', () => {
      service.update(1, mockUpdate).subscribe();

      const req = httpMock.expectOne('/api/szenarien/1');
      expect(req.request.method).toBe('PUT');
      req.flush(mockSzenario);
    });

    it('uses the correct numeric id in the URL', () => {
      service.update(7, mockUpdate).subscribe();

      const req = httpMock.expectOne('/api/szenarien/7');
      expect(req.request.method).toBe('PUT');
      req.flush(mockSzenario);
    });

    it('sends the DTO as the request body', () => {
      service.update(1, mockUpdate).subscribe();

      const req = httpMock.expectOne('/api/szenarien/1');
      expect(req.request.body).toEqual(mockUpdate);
      req.flush(mockSzenario);
    });

    it('emits the updated scenario returned by the server', () => {
      const updated: Szenario = { ...mockSzenario, name: 'Geändert' };
      let received: Szenario | undefined;
      service.update(1, mockUpdate).subscribe((r) => (received = r));

      httpMock.expectOne('/api/szenarien/1').flush(updated);

      expect(received).toEqual(updated);
    });
  });

  describe('delete()', () => {
    it('fires DELETE to /api/szenarien/:id', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne('/api/szenarien/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('uses the correct numeric id in the URL', () => {
      service.delete(5).subscribe();

      const req = httpMock.expectOne('/api/szenarien/5');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('observable completes after a successful delete', () => {
      let completed = false;
      service.delete(1).subscribe({
        complete: () => (completed = true),
      });

      httpMock.expectOne('/api/szenarien/1').flush(null);

      expect(completed).toBeTrue();
    });
  });
});
